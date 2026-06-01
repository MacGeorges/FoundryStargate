export class StargateItem extends Item {

  prepareData() {
    super.prepareData();
  }

  // Returns the effective value of this card (2 if locked, otherwise face value)
  get effectiveValue() {
    return this.system.locked ? this.system.lockedValue : this.system.value;
  }
}