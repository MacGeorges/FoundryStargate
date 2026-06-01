import { StargateActor } from "./module/actor/actor.js";
import { StargateActorSheet } from "./module/actor/actor-sheet.js";
import { StargateItem } from "./module/item/item.js";
import { StargateItemSheet } from "./module/item/item-sheet.js";

Hooks.once("init", function () {
  console.log("Stargate | Initialising Stargate SG-1 System");

  // Register custom Actor and Item classes
  CONFIG.Actor.documentClass = StargateActor;
  CONFIG.Item.documentClass = StargateItem;

  // Register sheet classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("stargate", StargateActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "Stargate.SheetClassCharacter"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("stargate", StargateItemSheet, {
    types: ["card"],
    makeDefault: true,
    label: "Stargate.SheetClassCard"
  });
});