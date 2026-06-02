export class StargateActor extends Actor {

  prepareData() {
    super.prepareData();
    if (this.type === "character") {
      this._prepareCharacterData(this.system);
    }
  }

  _prepareCharacterData(systemData) {
    const cards = this.items.filter(i => i.type === "card");
    let totalValue = 0;
    for (const card of cards) {
      const val = card.system.locked ? card.system.lockedValue : card.system.value;
      totalValue += val;
    }
    systemData.totalCardValue = Math.floor(totalValue * (systemData.race.multiplier ?? 1));
  }
}