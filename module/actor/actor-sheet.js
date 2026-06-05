import { StargateContest } from "../combat/combat.js";
import { STARGATE_RACES } from "../races.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class StargateActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["stargate", "sheet", "actor"],
    position: { width: 650, height: 700 },
    resizable: true,
    form: {
      submitOnChange: true,
    },
    actions: {
      changeImage: StargateActorSheet.changeImage,
      switchTab: StargateActorSheet.switchTab,
      engageAction: StargateActorSheet.engageAction,
      addCard: StargateActorSheet.addCard,
      editCard: StargateActorSheet.editCard,
      deleteCard: StargateActorSheet.deleteCard,
      toggleLock: StargateActorSheet.toggleLock,
      rollExpected: StargateActorSheet.rollExpected,
    }
  };

  static PARTS = {
    full: {
      template: "systems/stargate/templates/actor/dossier-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  tabGroups = {
    primary: "cards"
  };

  async _prepareContext() {
    const context = await super._prepareContext();
    context.actor = this.actor;
    context.system = this.actor.system;
    context.abilities = this.actor.items.filter(i => i.system.cardType === "ability");
    context.weapons   = this.actor.items.filter(i => i.system.cardType === "weapon");
    context.objects   = this.actor.items.filter(i => i.system.cardType === "object");
    context.bonuses   = this.actor.items.filter(i => i.system.cardType === "bonus");
    context.cardCount = this.actor.items.filter(i => i.type === "card" && i.system.cardType !== "bonus").length;
    context.isGM = game.user.isGM;
    context.races = STARGATE_RACES.map((r, i) => ({
      id: i,
      label: r.label,
      selected: i === Number(this.actor.system.race.id)
    }));
    return context;
  }

  static switchTab(event) {
    const tab = event.target.closest("[data-tab]")?.dataset.tab;
    console.log("[Stargate] switchTab called, tab:", tab);
    this.tabGroups.primary = tab;
    const navItems = this.element.querySelectorAll(".tabs .item");
    const tabDivs = this.element.querySelectorAll(".tab[data-group='primary']");
    console.log("[Stargate] nav items found:", navItems.length, "tab divs found:", tabDivs.length);
    navItems.forEach(el => el.classList.toggle("active", el.dataset.tab === tab));
    tabDivs.forEach(el => el.classList.toggle("active", el.dataset.tab === tab));
  }

  static async changeImage() {
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.actor.img,
      callback: async (path) => {
        await this.actor.update({ img: path });
      }
    });
    fp.browse();
  }

  async _onChangeForm(formConfig, event) {
    if (event.target.name === "name")
      await this.actor.update({ name: event.target.value });
    else if (event.target.name === "system.rank")
      await this.actor.update({ "system.rank": event.target.value });
    else if (event.target.name === "system.level")
      await this.actor.update({ "system.level": Number(event.target.value) });
    else if (event.target.name === "system.sg")
      await this.actor.update({ "system.sg": Number(event.target.value) });
    else if (event.target.name === "system.health.value")
      await this.actor.update({ "system.health.value": Number(event.target.value) });
    else if (event.target.name === "system.health.max")
      await this.actor.update({ "system.health.max": Number(event.target.value) });
    else if (event.target.name === "system.biography")
      await this.actor.update({ "system.biography": event.target.value });
    else if (event.target.name === "system.race.id" && game.user.isGM)
      await this.actor.update({ "system.race.id": Number(event.target.value) });
  }


  static async rollExpected() {
    await StargateContest.rollUnexpected(this.actor.id, this.actor.system.race.label);
  }

  static async engageAction() {
    const result = await StargateContest.engageAction(this.actor);
    if (result) {
      await StargateContest.postToChat(result.actor, result.selected, result.multiplier);
    }
  }

  static async addCard(event) {
    const type = event.target.closest("[data-type]")?.dataset.type || "ability";
    if (type !== "bonus") {
      const cards = this.actor.items.filter(i => i.type === "card" && i.system.cardType !== "bonus");
      if (cards.length >= this.actor.system.cardSlots.total) {
        ui.notifications.warn("No card slots remaining.");
        return;
      }
    }
    await Item.create({ name: "New Card", type: "card", system: { cardType: type } }, { parent: this.actor });
  }

  static async editCard(event) {
    const li = event.target.closest("[data-item-id]");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  static async deleteCard(event) {
    const li = event.target.closest("[data-item-id]");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item.system.locked && !game.user.isGM) {
      ui.notifications.warn("Locked cards cannot be deleted.");
      return;
    }
    await item.delete();
  }

  async _onDropItem(event, data) {
    const item = await Item.fromDropData(data);
    if (item?.system?.cardType !== "bonus") {
      const cards = this.actor.items.filter(i => i.type === "card" && i.system.cardType !== "bonus");
      if (cards.length >= this.actor.system.cardSlots.total) {
        ui.notifications.warn("No card slots remaining.");
        return;
      }
      const allowedRaces = item?.system?.allowedRaces;
      if (allowedRaces) {
        const raceId = this.actor.system.race.id ?? 0;
        if (!allowedRaces[raceId]) {
          ui.notifications.warn(`Your race cannot use this card.`);
          return;
        }
      }
    }
    return super._onDropItem(event, data);
  }

  static async toggleLock(event) {
    const li = event.target.closest("[data-item-id]");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item.system.locked && !game.user.isGM) {
      ui.notifications.warn("Only the GM can unlock a card.");
      return;
    }
    await item.update({ "system.locked": !item.system.locked });
  }
}