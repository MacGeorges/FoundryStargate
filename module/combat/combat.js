import { STARGATE_RACES } from "../races.js";

export class StargateContest {

  /**
   * Opens the Engage Action card selection dialog for an actor.
   */
  static async engageAction(actor) {
    const system = actor.system;
    const cards = actor.items.filter(i => i.type === "card");
    const multiplier = (STARGATE_RACES[system.race.id] ?? STARGATE_RACES[0]).multiplier;

    console.log("race.id:", system.race.id);
    console.log("Character race multiplier:", multiplier);

    // Build card list HTML
    const cardRows = cards.map(card => {
      const isBonus = card.system.cardType === "bonus";
      const val = card.system.locked ? card.system.lockedValue : card.system.value;
      return `
        <div class="engage-card-row">
          <input type="checkbox" class="card-checkbox"
            data-id="${card.id}" data-value="${val}" data-name="${card.name}"
            ${isBonus ? "checked" : ""} />
          <label>${card.name}
            <span class="card-type">[${card.system.cardType}]</span>
            <span class="card-val">${val >= 0 ? "+" : ""}${val}${card.system.locked ? " 🔒" : ""}</span>
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
        <div class="temp-section">
          <div class="temp-section-header">
            <span>Temporary Bonuses</span>
            <a id="add-bonus" title="Add bonus" style="cursor:pointer;">+</a>
          </div>
          <div id="temp-bonus-list"></div>
        </div>
        <div class="temp-section">
          <div class="temp-section-header">
            <span>Temporary Maluses</span>
            <a id="add-malus" title="Add malus" style="cursor:pointer;">+</a>
          </div>
          <div id="temp-malus-list"></div>
        </div>
        <div class="engage-total">
          Total: <strong><span id="engage-total">0</span></strong>
          <span class="engage-multiplier">(×${multiplier})</span>
          = <strong><span id="engage-final">0</span></strong>
        </div>
      </form>
      <style>
        .engage-card-list { max-height: 200px; overflow-y: auto; margin-bottom: 6px; }
        .engage-card-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; border-bottom: 1px solid #eee; }
        .engage-card-row label { flex: 1; cursor: pointer; }
        .card-type { color: #888; font-size: 0.85em; }
        .card-val { font-weight: bold; color: #444; }
        .temp-section { margin: 4px 0; }
        .temp-section-header { display: flex; align-items: center; justify-content: space-between; padding: 3px 4px; background: rgba(0,0,0,0.04); border-radius: 3px; font-size: 0.9em; font-weight: bold; }
        .temp-section-header a { font-size: 1.2em; padding: 0 4px; color: #2b4a7a; }
        .temp-row { display: flex; align-items: center; gap: 6px; padding: 2px 4px; }
        .temp-row input[type="number"] { width: 52px; text-align: center; }
        .temp-row input[type="text"] { flex: 1; }
        .temp-row a { cursor: pointer; color: #999; font-size: 0.9em; }
        .temp-row a:hover { color: #c00; }
        .engage-total { padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 1.1em; margin-top: 6px; }
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
              const tempModifiers = [];
              html.find(".temp-row").each((_, row) => {
                const $row = $(row);
                const sign  = parseInt($row.find(".temp-value").data("sign"));
                const val   = (parseInt($row.find(".temp-value").val()) || 0) * sign;
                const name  = $row.find(".temp-name").val().trim() || (sign > 0 ? "Bonus" : "Malus");
                if (val !== 0) tempModifiers.push({ name, value: val });
              });
              resolve({ selected, multiplier, actor, tempModifiers });
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        render: html => {
          const recalc = () => {
            let raw = 0;
            html.find(".card-checkbox:checked").each((_, el) => { raw += parseInt(el.dataset.value); });
            html.find(".temp-value").each((_, el) => {
              raw += (parseInt(el.value) || 0) * parseInt(el.dataset.sign);
            });
            html.find("#engage-total").text(raw);
            html.find("#engage-final").text(Math.floor(raw * multiplier));
          };

          html.find(".card-checkbox").on("change", recalc);

          const makeRow = (sign) => `
            <div class="temp-row">
              <input type="number" class="temp-value" data-sign="${sign}" value="1" min="1" />
              <input type="text" class="temp-name" placeholder="${sign > 0 ? "Bonus name" : "Malus name"}" />
              <a class="remove-temp">✕</a>
            </div>`;

          html.find("#add-bonus").on("click", () => {
            html.find("#temp-bonus-list").append(makeRow(1));
            html.on("input", ".temp-value", recalc);
            recalc();
          });
          html.find("#add-malus").on("click", () => {
            html.find("#temp-malus-list").append(makeRow(-1));
            html.on("input", ".temp-value", recalc);
            recalc();
          });
          html.on("click", ".remove-temp", function() {
            $(this).closest(".temp-row").remove();
            recalc();
          });
        }
      }, { width: 400 }).render(true);
    });
  }

  /**
   * Posts the action result to chat.
   */
  static async postToChat(actor, selected, multiplier, tempModifiers = []) {
    if (!selected.length && !tempModifiers.length) {
      ui.notifications.warn("No cards selected!");
      return;
    }

    const rawTotal = selected.reduce((sum, c) => sum + c.value, 0)
                   + tempModifiers.reduce((sum, m) => sum + m.value, 0);
    const finalTotal = Math.floor(rawTotal * multiplier);
    const race = actor.system.race.label;

    const cardDetails = selected.map(c =>
      `<li>${c.name}: ${c.value >= 0 ? "+" : ""}${c.value}</li>`
    ).join("");

    const tempDetails = tempModifiers.map(m =>
      `<li><em>${m.name}: ${m.value >= 0 ? "+" : ""}${m.value}</em></li>`
    ).join("");

    const multiplierLine = `<div class="engage-detail">Race multiplier (${race}): ×${multiplier}</div>`;

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
          <ul>${cardDetails}${tempDetails}</ul>
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
    const isTokra = race === "Tok'ra";

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