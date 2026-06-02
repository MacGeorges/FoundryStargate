import { STARGATE_RACES } from "../races.js";

export class StargateItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["stargate", "sheet", "item"],
      template: "systems/stargate/templates/item/card-sheet.hbs",
      width: 400,
      height: 350
    });
  }

  getData() {
    const context = super.getData();
    context.system = this.item.system;
    context.cardTypes = {
      ability: "Ability",
      weapon: "Weapon",
      object: "Object",
      bonus: "Bonus / Malus"
    };
    context.isGM = game.user.isGM;
    context.races = STARGATE_RACES.map((r, i) => ({
      id: i,
      label: r.label,
      allowed: context.system.allowedRaces?.[i] ?? true
    }));
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}