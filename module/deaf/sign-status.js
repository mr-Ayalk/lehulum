// FR-DEAF-06: The waiting pill beside the window, and the missing-sign card.
import { layoutPill } from "../core/caption-place.js";

export function attachStatus(player, win, skip) {
  const ui = {};
  function label() {
    if (!ui.pill) return;
    ui.note.textContent = player.t("sign_waiting");
    ui.skip.textContent = player.t("skip_wait");
    ui.skip.setAttribute("aria-label", player.t("skip_wait"));
    ui.card.textContent = player.t("sign_missing");
  }
  function ensure() {
    if (ui.pill) return;
    ui.pill = document.createElement("div");
    ui.pill.className = "sign-wait";
    ui.pill.setAttribute("role", "status");
    ui.pill.hidden = true;
    ui.note = document.createElement("span");
    ui.skip = document.createElement("button");
    ui.skip.type = "button";
    ui.skip.addEventListener("click", () => skip());
    ui.pill.append(ui.note, ui.skip);
    player.slots.overlay.append(ui.pill);
    ui.card = document.createElement("p");
    ui.card.className = "sign-missing";
    ui.card.setAttribute("role", "status");
    ui.card.hidden = true;
    win.root.append(ui.card);
    label();
  }
  return {
    label,
    showPill() { ensure(); ui.pill.hidden = false; label(); layoutPill(player, ui.pill); },
    hidePill() { if (ui.pill) ui.pill.hidden = true; },
    showCard() { ensure(); ui.card.hidden = false; label(); },
    hideCard() { if (ui.card) ui.card.hidden = true; },
    place() { if (ui.pill && !ui.pill.hidden) layoutPill(player, ui.pill); }
  };
}
