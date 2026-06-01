import { STARGATE_RACES } from "../races.js";

export class StargateContest {

  /**
   * Opens the Engage Action card selection dialog for an actor.
   */
  static async engageAction(actor) {
    const system = actor.system;
    const cards = actor.items.filter(i => i.type === "card");
    const multiplier = STARGATE_RACES[system.race.id].multiplier;

    console.log("race.id:", system.race.id);
    console.log("Character race multiplier:", multiplier);

    // Build card list HTML
    const cardRows = cards.map(card => {
      const val = card.system.locked ? card.system.lockedValue : card.system.value;
      return `
        <div class="engage-card-row">
          <input type="checkbox" class="card-checkbox" 
            data-id="${card.id}" data-value="${val}" data-name="${card.name}" />
          <label>${card.name} 
            <span class="card-type">[${card.system.cardType}]</span>
            <span class="card-val">+${val}${card.system.locked ? " 🔒" : ""}</span>
          </label>
        </div>
      `;
    }).join("");

    const content = `
      <form>
        <p class="engage-instructions">Select the cards you want to use in this action.</p>
        <div class="engage-card-list">
          ${cardRows.length ? cardRows : "<p><em>No cards in inventory.</em></p>"}
        </div>
        <div class="engage-total">
          Total: <strong><span id="engage-total">0</span></strong>
          <span class="engage-multiplier">(×${multiplier})</span>
          = <strong><span id="engage-final">0</span></strong>
        </div>
      </form>
      <style>
        .engage-card-list { max-height: 300px; overflow-y: auto; margin-bottom: 10px; }
        .engage-card-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; border-bottom: 1px solid #eee; }
        .engage-card-row label { flex: 1; cursor: pointer; }
        .card-type { color: #888; font-size: 0.85em; }
        .card-val { font-weight: bold; color: #444; }
        .engage-total { padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 1.1em; }
        .engage-multiplier { color: #666; font-size: 0.9em; }
      </style>
    `;

    return new Promise(resolve => {
      new Dialog({
        title: `Engage Action — ${actor.name}`,
        content,
        buttons: {
          submit: {
            label: "Submit",
            callback: html => {
              const selected = [];
              html.find(".card-checkbox:checked").each((_, el) => {
                selected.push({
                  id: el.dataset.id,
                  name: el.dataset.name,
                  value: parseInt(el.dataset.value)
                });
              });
              resolve({ selected, multiplier, actor });
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        render: html => {
          // Live total update
          html.find(".card-checkbox").on("change", () => {
            let raw = 0;
            html.find(".card-checkbox:checked").each((_, el) => {
              raw += parseInt(el.dataset.value);
            });
            const final = Math.floor(raw * multiplier);
            html.find("#engage-total").text(raw);
            html.find("#engage-final").text(final);
          });
        }
      }, { width: 400 }).render(true);
    });
  }

  /**
   * Posts the action result to chat.
   */
  static async postToChat(actor, selected, multiplier) {
    if (!selected.length) {
      ui.notifications.warn("No cards selected!");
      return;
    }

console.log("Post to chat race multiplier:", multiplier);

    const rawTotal = selected.reduce((sum, c) => sum + c.value, 0);
    const finalTotal = Math.floor(rawTotal * multiplier);
    const race = actor.system.race?.name || "Tau'ri";

    const cardDetails = selected.map(c =>
      `<li>${c.name}: +${c.value}</li>`
    ).join("");

    const multiplierLine = multiplier !== 1.0
      ? `<div class="engage-detail">Race multiplier (${race}): ×${multiplier}</div>`
      : "";

    const messageContent = `
      <div class="stargate-chat-action">
        <div class="chat-action-header">
          <strong>${actor.name}</strong> engages an action
        </div>
        <div class="chat-action-total">
          Power: <span class="total-value">${finalTotal}</span>
        </div>
        <details class="chat-action-details">
          <summary>Details</summary>
          <ul>${cardDetails}</ul>
          ${multiplierLine}
          <div class="engage-detail">Raw total: ${rawTotal}</div>
        </details>
        <div class="chat-action-roll">
          <button class="roll-unexpected" 
            data-actor-id="${actor.id}" 
            data-race="${race}">
            🎲 Roll Unexpected Outcome (d100)
          </button>
        </div>
      </div>
      <style>
        .stargate-chat-action { font-family: sans-serif; }
        .chat-action-header { margin-bottom: 4px; }
        .chat-action-total { font-size: 1.4em; margin: 6px 0; }
        .total-value { color: #8b0000; font-weight: bold; }
        .chat-action-details { font-size: 0.9em; color: #555; margin: 4px 0; }
        .chat-action-details ul { margin: 4px 0 4px 16px; padding: 0; }
        .engage-detail { font-style: italic; }
        .roll-unexpected { 
          margin-top: 8px; width: 100%; padding: 6px;
          background: #2b4a7a; color: white; border: none;
          border-radius: 4px; cursor: pointer; font-size: 0.95em;
        }
        .roll-unexpected:hover { background: #1a3560; }
      </style>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: messageContent,
      flags: { stargate: { isAction: true, actorId: actor.id, race } }
    });
  }

  /**
   * Rolls d100 and resolves the unexpected outcome.
   */
  static async rollUnexpected(actorId, race) {
    const roll = await new Roll("1d100").evaluate();
    const result = roll.total;
    const isTokra = actor.system.race?.isTokra === true;

    let outcome, outcomeClass;

    if (result <= 5) {
      outcome = `💥 Catastrophic Failure! (${result}) — Something went terribly wrong.`;
      outcomeClass = "outcome-failure";
    } else if (isTokra && result <= 20) {
      outcome = `⚠️ Host Refusal! (${result}) — The host refuses to cooperate with the symbiote.`;
      outcomeClass = "outcome-refusal";
    } else if (result >= 96) {
      outcome = `⭐ Amazing Success! (${result}) — Everything went perfectly.`;
      outcomeClass = "outcome-amazing";
    } else {
      outcome = `✅ Normal Outcome. (${result})`;
      outcomeClass = "outcome-normal";
    }

    const actor = game.actors.get(actorId);
    const messageContent = `
      <div class="stargate-chat-action">
        <div class="chat-action-header">
          <strong>${actor?.name ?? "Unknown"}</strong> — Unexpected Outcome Roll
        </div>
        <div class="outcome-result ${outcomeClass}">${outcome}</div>
      </div>
      <style>
        .outcome-result { padding: 8px; border-radius: 4px; font-weight: bold; margin-top: 6px; }
        .outcome-failure { background: #ffdddd; color: #8b0000; }
        .outcome-refusal { background: #fff3cd; color: #7a5800; }
        .outcome-amazing { background: #ddffdd; color: #006400; }
        .outcome-normal { background: #f0f0f0; color: #333; }
      </style>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: messageContent,
      roll
    });
  }
}