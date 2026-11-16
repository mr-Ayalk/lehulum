// FR-BLV-04, FR-CORE-11: Pause, show the code, read it line by line, and return focus.
import { formatClock } from "../core/i18n.js";

export function attachOnScreen(player) {
  const url = player.host.getAttribute("screen");
  let items = [];
  if (url) fetch(url).then((response) => response.ok ? response.json() : []).then((data) => { items = data || []; }).catch(() => {});
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let open = false;
  let line = 0;
  let opener = null;

  function current() {
    const time = player.media.currentTime || 0;
    return items.find((item) => time >= item.start && time < item.end) || items.find((item) => item.start >= time) || null;
  }

  function spell(text) {
    return String(text || "").replace(/=/g, " equals ").replace(/"/g, " quote ");
  }

  function close() {
    open = false;
    panel.hidden = true;
    opener?.focus();
    player._paintAll();
  }

  function paint() {
    const item = current();
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = item ? player.t("onscreen_at", { time: formatClock(item.start) }) : player.t("onscreen");
    if (!item) {
      const empty = document.createElement("p");
      empty.textContent = player.t("trn_empty");
      panel.append(title, empty);
      return;
    }
    const code = document.createElement("pre");
    const body = document.createElement("code");
    body.setAttribute("lang", item.lang || "en");
    body.textContent = item.content || "";
    code.append(body);
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = player.t("copy");
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(item.content || ""); } catch (error) { /* clipboard blocked */ }
      player.announce("copied");
    });
    const read = document.createElement("button");
    read.type = "button";
    read.textContent = player.t("read_lines");
    read.addEventListener("click", () => {
      const rows = String(item.content || "").split("\n").filter((row) => row.length);
      const index = line % Math.max(1, rows.length);
      line += 1;
      player.announce("line_read", { n: String(index + 1), text: spell(rows[index] || "") });
    });
    panel.append(title, code, copy, read);
  }

  function show(button) {
    opener = button || opener || player.shadow.querySelector("[data-id='onscreen']");
    open = true;
    panel.hidden = false;
    player._quiet = true;
    player.media.pause();
    player._quiet = false;
    paint();
    panel.querySelector("h2")?.focus();
    player._paintAll();
  }

  player.addControl({
    id: "onscreen", order: 75, toggle: true,
    pressed: () => open, labelKey: "onscreen",
    onClick: (event) => { if (open) close(); else show(event.currentTarget); }
  });
  const openIt = () => { if (open) close(); else show(); };
  player.registerShortcut("w", "key_w", openIt);
  player.registerShortcut("o", "key_o", openIt);
  panel.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } });
  player.slots.panels.append(panel);
  player.on("cue", () => { if (open) paint(); });
}
