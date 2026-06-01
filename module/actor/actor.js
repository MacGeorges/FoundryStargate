import { STARGATE_RACES } from "../races.js";

export class StargateActor extends Actor {

  prepareData() {
    super.prepareData();
    if (this.type === "character") {
      this._prepareCharacterData(this.system);
    }
  }

  _prepareCharacterData(systemData) {
    const level = systemData.level || 1;

    // Resolve race
    const raceId = systemData.race.id || 0;
    const raceDef = STARGATE_RACES[raceId];

    systemData.cardSlots.total = raceId === 3 ? level - 3 : 5 + level;

    systemData.race.label = raceDef.label;
    systemData.race.multiplier = raceDef.multiplier;

    console.log("Dossier race:", systemData.race.label);
    console.log("Dossier race multiplier:", systemData.race.multiplier);

    // Calculate total card value
    const cards = this.items.filter(i => i.type === "card");
    let totalValue = 0;
    for (const card of cards) {
      const val = card.system.locked ? card.system.lockedValue : card.system.value;
      totalValue += val;
    }
    systemData.totalCardValue = Math.floor(totalValue * systemData.race.multiplier);
  }
}