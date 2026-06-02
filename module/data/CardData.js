const fields = foundry.data.fields;

export class CardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description:  new fields.StringField({ initial: "" }),
      cardType:     new fields.StringField({ initial: "ability" }),
      value:        new fields.NumberField({ initial: 1, integer: true }),
      locked:       new fields.BooleanField({ initial: false }),
      lockedValue:  new fields.NumberField({ initial: 2, integer: true }),
      allowedRaces: new fields.ArrayField(
        new fields.BooleanField(),
        { initial: [true, true, true, true] }
      ),
    };
  }
}
