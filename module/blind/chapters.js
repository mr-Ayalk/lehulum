// FR-BLV-01, FR-BLV-02: Chapter list so the lesson can be skimmed.
import { parseVtt } from "./vtt.js";

export function attachChapters(player) {
  const url = player.host.getAttribute("chapters");
  if (!url) return;
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let cues = [];
  let open = false;
  fetch(url).then((response) => response.ok ? response.text() : "").then((text) => { cues = parseVtt(text); }).catch(() => {});

  function paint() {
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("chapters");
    const list = document.createElement("ol");
    for (const cue of cues) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = cue.text;
      button.addEventListener("click", () => { player.media.currentTime = cue.start; });
      item.append(button);
      list.append(item);
    }
    panel.append(title, list);
  }

  player.addControl({
    id: "chapters", order: 76, toggle: true,
    pressed: () => open, labelKey: "chapters",
    onClick: () => {
      open = !open;
      panel.hidden = !open;
      if (open) { paint(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.slots.panels.append(panel);
}
