import { StargateContest } from "../combat/combat.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class StargateActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["stargate", "sheet", "actor"],
    position: { width: 650, height: 700 },
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
      template: "systems/stargate/templates/actor/dossier-sheet.hbs"
    }
  };

  async _prepareContext() {
    const context = await super._prepareContext();
    context.actor = this.actor;
    context.system = this.actor.system;
    context.abilities = this.actor.items.filter(i => i.system.cardType === "ability");
    context.weapons   = this.actor.items.filter(i => i.system.cardType === "weapon");
    context.objects   = this.actor.items.filter(i => i.system.cardType === "object");
    context.isGM = game.user.isGM;
    return context;
  }

  static async engageAction() {
    const result = await StargateContest.engageAction(this.actor);
    if (result) {
      await StargateContest.postToChat(result.actor, result.selected, result.multiplier);
    }
  }

  static async addCard(event) {
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
    await item.delete();
  }

  static async toggleLock(event) {
    if (!game.user.isGM) return;
    const li = event.target.closest("[data-item-id]");
    const item = this.actor.items.get(li.dataset.itemId);
    await item.update({ "system.locked": !item.system.locked });
  }
}