import { STARGATE_RACES } from "../races.js";

const fields = foundry.data.fields;

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      biography: new fields.StringField({ initial: "" }),
      rank:      new fields.StringField({ initial: "" }),
      level:     new fields.NumberField({ initial: 1, integer: true, min: 1 }),
      health: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, integer: true }),
        min:   new fields.NumberField({ initial: 0,  integer: true }),
        max:   new fields.NumberField({ initial: 10, integer: true }),
      }),
      race: new fields.SchemaField({
        id: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      }),
    };
  }

  prepareDerivedData() {
    const raceId  = this.race.id ?? 0;
    const raceDef = STARGATE_RACES[raceId] ?? STARGATE_RACES[0];
    this.race.label      = raceDef.label;
    this.race.multiplier = raceDef.multiplier;
    this.cardSlots = { total: raceId === 3 ? this.level - 3 : 5 + this.level };
  }
}
