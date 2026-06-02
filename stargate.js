import { StargateActor } from "./module/actor/actor.js";
import { StargateActorSheet } from "./module/actor/actor-sheet.js";
import { StargateItem } from "./module/item/item.js";
import { StargateItemSheet } from "./module/item/item-sheet.js";
import { StargateContest } from "./module/combat/combat.js";
import { CharacterData } from "./module/data/CharacterData.js";
import { CardData } from "./module/data/CardData.js";

Hooks.once("init", function () {
  console.log("Stargate | Initialising Stargate SG-1 System");

  CONFIG.Actor.documentClass = StargateActor;
  CONFIG.Item.documentClass = StargateItem;
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Item.dataModels.card = CardData;

  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("stargate", StargateActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "Stargate.SheetClassCharacter"
  });

  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("stargate", StargateItemSheet, {
    types: ["card"],
    makeDefault: true,
    label: "Stargate.SheetClassCard"
  });
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  html.querySelector(".roll-unexpected")?.addEventListener("click", async ev => {
    const actorId = ev.currentTarget.dataset.actorId;
    const race = ev.currentTarget.dataset.race;
    await StargateContest.rollUnexpected(actorId, race);
  });
});