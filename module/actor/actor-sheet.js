import { StargateItem } from "../item/item.js";
import { StargateContest } from "../combat/combat.js";

export class StargateActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["stargate", "sheet", "actor"],
      template: "systems/stargate/templates/actor/dossier-sheet.hbs",
      width: 650,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "cards" }]
    });
  }

  getData() {
    const context = super.getData();
    const actorData = this.actor;

    context.system = actorData.system;
    context.flags = actorData.flags;

    context.abilities = actorData.items.filter(i => i.system.cardType === "ability");
    context.weapons   = actorData.items.filter(i => i.system.cardType === "weapon");
    context.objects   = actorData.items.filter(i => i.system.cardType === "object");

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Engage Action button
    html.find(".engage-action").click(async () => {
      const result = await StargateContest.engageAction(this.actor);
      if (result) {
        await StargateContest.postToChat(result.actor, result.selected, result.multiplier);
      }
    });

    if (!this.isEditable) return;

    html.find(".card-add").click(ev => {
      const type = ev.currentTarget.dataset.type || "ability";
      Item.create({ name: "New Card", type: "card", system: { cardType: type } }, { parent: this.actor });
    });

    html.find(".card-edit").click(ev => {
      const li = ev.currentTarget.closest(".card-entry");
      const item = this.actor.items.get(li.dataset.itemId);
      item.sheet.render(true);
    });

    html.find(".card-delete").click(ev => {
      const li = ev.currentTarget.closest(".card-entry");
      const item = this.actor.items.get(li.dataset.itemId);
      item.delete();
    });

    if (game.user.isGM) {
      html.find(".card-lock-toggle").click(ev => {
        const li = ev.currentTarget.closest(".card-entry");
        const item = this.actor.items.get(li.dataset.itemId);
        item.update({ "system.locked": !item.system.locked });
      });
    }
  }
}