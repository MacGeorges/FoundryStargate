import { StargateActor } from "./module/actor/actor.js";
import { StargateActorSheet } from "./module/actor/actor-sheet.js";
import { StargateItem } from "./module/item/item.js";
import { StargateItemSheet } from "./module/item/item-sheet.js";
import { StargateContest } from "./module/combat/combat.js";

Hooks.once("init", function () {
  console.log("Stargate | Initialising Stargate SG-1 System");

  CONFIG.Actor.documentClass = StargateActor;
  CONFIG.Item.documentClass = StargateItem;

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

// Handle clicks on the "Roll Unexpected Outcome" button in chat
Hooks.on("renderChatMessage", (message, html) => {
  html.find(".roll-unexpected").click(async ev => {
    const actorId = ev.currentTarget.dataset.actorId;
    const race = ev.currentTarget.dataset.race;
    await StargateContest.rollUnexpected(actorId, race);
  });
});