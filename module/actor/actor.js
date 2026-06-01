export class StargateActor extends Actor {

  prepareData() {
    super.prepareData();
    const actorData = this;
    const systemData = actorData.system;

    if (actorData.type === "character") {
      this._prepareCharacterData(systemData);
    }
  }

  _prepareCharacterData(systemData) {
    const level = systemData.level || 1;

    // Card slots scale with level: base 6, +1 per level above 1
    systemData.cardSlots.total = 5 + level;

    // Calculate total card value with race multiplier applied
    const multiplier = systemData.race.multiplier || 1.0;
    const cards = this.items.filter(i => i.type === "card");

    let totalValue = 0;
    for (const card of cards) {
      const val = card.system.locked
        ? card.system.lockedValue
        : card.system.value;
      totalValue += val;
    }

    systemData.totalCardValue = Math.floor(totalValue * multiplier);
  }
}