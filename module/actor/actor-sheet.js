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
      engageAction: StargateActorSheet.engageAction,
      addCard: StargateActorSheet.addCard,
      editCard: StargateActorSheet.editCard,
      deleteCard: StargateActorSheet.deleteCard,
      toggleLock: StargateActorSheet.toggleLock,
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
    context.isGM = game.user.isGM;
    context.tabs = this._getTabs();
    context.races = STARGATE_RACES.map((r, i) => ({
      id: i,
      label: r.label,
      selected: i === Number(this.actor.system.race.id)
    }));
    return context;
  }

  async _onChangeForm(formConfig, event) {
    if (event.target.name === "system.race.id") {
      await this.actor.update({ "system.race.id": Number(event.target.value) });
      return;
    }
    return super._onChangeForm(formConfig, event);
  }

  _getTabs() {
    return {
      cards: {
        id: "cards", group: "primary", label: "Cards",
        active: this.tabGroups.primary === "cards",
        cssClass: this.tabGroups.primary === "cards" ? "active" : ""
      },
      bio: {
        id: "bio", group: "primary", label: "Biography",
        active: this.tabGroups.primary === "bio",
        cssClass: this.tabGroups.primary === "bio" ? "active" : ""
      }
    };
  }

  static async engageAction() {
    const result = await StargateContest.engageAction(this.actor);
    if (result) {
      await StargateContest.postToChat(result.actor, result.selected, result.multiplier);
    }
  }

  static async addCard(event) {
    const cards = this.actor.items.filter(i => i.type === "card");
    if (cards.length >= this.actor.system.cardSlots.total) {
      ui.notifications.warn("No card slots remaining.");
      return;
    }
    const type = event.target.closest("[data-type]")?.dataset.type || "ability";
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
    const cards = this.actor.items.filter(i => i.type === "card");
    if (cards.length >= this.actor.system.cardSlots.total) {
      ui.notifications.warn("No card slots remaining.");
      return;
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