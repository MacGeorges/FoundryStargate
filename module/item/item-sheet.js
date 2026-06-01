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
      object: "Object"
    };
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}