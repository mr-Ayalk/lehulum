// FR-BLV-04: Show the code or slide text that is on screen, and read it line by line.
export function attachOnScreen(player) {
  const url = player.host.getAttribute("screen");
  let items = [];
  if (url) fetch(url).then((response) => response.ok ? response.json() : []).then((data) => { items = data || []; }).catch(() => {});
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let open = false;
  let line = 0;

  function current() {
    const time = player.media.currentTime || 0;
    return items.find((item) => time >= item.start && time < item.end) || null;
  }

  function spell(text) {
    return String(text || "").replace(/=/g, " equals ").replace(/"/g, " quote ");
  }

  function paint() {
    const item = current();
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = item?.title || player.t("onscreen");
    if (!item) {
      const empty = document.createElement("p");
      empty.textContent = player.t("trn_empty");
      panel.append(title, empty);
      return;
    }
    const code = document.createElement("pre");
    const body = document.createElement("code");
    body.lang = item.lang || "en";
    body.textContent = item.content || "";
    code.append(body);
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = player.t("copy");
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(item.content || ""); } catch (error) { /* ignore */ }
      player.announce("copied");
    });
    const read = document.createElement("button");
    read.type = "button";
    read.textContent = player.t("read_lines");
    read.addEventListener("click", () => {
      const rows = String(item.content || "").split("\n");
      line = 0;
      player.announce("copied");
      player.shadow.querySelector(".sr-only").textContent = spell(rows[0]);
    });
    panel.append(title, code, copy, read);
  }

  player.addControl({
    id: "onscreen", order: 75, toggle: true,
    pressed: () => open, labelKey: "onscreen",
    onClick: () => {
      open = !open;
      panel.hidden = !open;
      if (open) { paint(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.registerShortcut("o", "key_o", () => player.shadow.querySelector("[data-id='onscreen']")?.click());
  player.slots.panels.append(panel);
  player.on("cue", () => { if (open) paint(); });
}
