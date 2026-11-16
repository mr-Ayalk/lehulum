// FR-BLV-01, FR-BLV-02: Chapter list, with a rename a person can save.
import { parseVtt } from "./vtt.js";

export function attachChapters(player) {
  const url = player.host.getAttribute("chapters");
  if (!url) return;
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let cues = [];
  let open = false;
  fetch(url).then((response) => response.ok ? response.text() : "").then((text) => { cues = parseVtt(text); player.chapters = cues; }).catch(() => {});

  function save(cue, title) {
    cue.text = title;
    player.chapters = cues;
    const api = player.host.getAttribute("api");
    const lesson = player.host.getAttribute("lesson-id");
    if (!api || !lesson || !cue.id) return;
    fetch(api + "/lessons/" + lesson + "/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cue.id, title })
    }).catch(() => {});
  }

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
      const rename = document.createElement("button");
      rename.type = "button";
      rename.textContent = player.t("rename");
      rename.addEventListener("click", () => {
        const label = document.createElement("label");
        label.textContent = player.t("chapter_name") + " ";
        const input = document.createElement("input");
        input.type = "text";
        input.value = cue.text;
        const keep = document.createElement("button");
        keep.type = "button";
        keep.textContent = player.t("rename_save");
        keep.addEventListener("click", () => { save(cue, input.value.trim() || cue.text); paint(); });
        label.append(input);
        item.replaceChildren(label, keep);
        input.focus();
      });
      item.append(button, rename);
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
