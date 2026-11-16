// FR-CAP-02, FR-CAP-04, FR-HOH-10, FR-HOH-12: Caption size, colour, and position, also inside the hearing panel.
import { contrastRatio } from "../core/contrast.js";
import { savePrefs } from "../core/prefs.js";

const PRESETS = [
  ["#ffffff", "#000000"],
  ["#ffe14a", "#000000"],
  ["#000000", "#ffffff"],
  ["#000000", "#ffe14a"],
  ["#ffffff", "#002b56"],
  ["#b8ff9a", "#000000"]
];

export function attachCaptionStyle(player) {
  const saved = player.prefs.captionStyle || {};
  let size = saved.size || 100;
  let fg = saved.fg || "#ffffff";
  let bg = saved.bg || "#000000";
  let place = saved.place || "below";
  let both = !!saved.both;
  const boxes = new Set();

  function apply() {
    const box = player.shadow.querySelector(".captions");
    if (!box) return;
    box.style.setProperty("--cap-color", fg);
    box.style.setProperty("--cap-bg", bg);
    box.style.setProperty("--cap-size", (1.125 * size / 100) + "rem");
    player.prefs.captionBoth = both;
    player.captions?.setPosition(place);
    player.prefs.captionStyle = savePrefs({ captionStyle: { size, fg, bg, place, both } }).captionStyle;
  }

  function draw(target) {
    target.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("style");
    const preview = document.createElement("p");
    preview.textContent = "ሰላም  Hello";
    preview.style.cssText = "margin:.5rem 0;padding:.5rem;border-radius:6px;background:" + bg + ";color:" + fg + ";font-size:" + (size / 100) + "em";
    const sizeDown = document.createElement("button");
    sizeDown.type = "button";
    sizeDown.textContent = player.t("smaller");
    const sizeUp = document.createElement("button");
    sizeUp.type = "button";
    sizeUp.textContent = player.t("larger");
    const sizeLabel = document.createElement("span");
    sizeLabel.textContent = size + "%";
    sizeDown.addEventListener("click", () => { size = Math.max(75, size - 25); apply(); paint(); });
    sizeUp.addEventListener("click", () => { size = Math.min(300, size + 25); apply(); paint(); });
    const colors = document.createElement("div");
    for (const pair of PRESETS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0] + " / " + pair[1];
      button.style.background = pair[1];
      button.style.color = pair[0];
      button.addEventListener("click", () => { fg = pair[0]; bg = pair[1]; apply(); paint(); });
      colors.append(button);
    }
    const note = document.createElement("p");
    note.setAttribute("role", "alert");
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) note.textContent = player.t("contrast_low");
    const positions = document.createElement("div");
    for (const name of ["bottom", "top", "below"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t(name === "below" ? "below_video" : name === "top" ? "top" : "on_video");
      button.setAttribute("aria-pressed", place === name ? "true" : "false");
      button.addEventListener("click", () => { place = name; apply(); paint(); });
      positions.append(button);
    }
    const bothBtn = document.createElement("button");
    bothBtn.type = "button";
    bothBtn.textContent = player.t("both_langs");
    bothBtn.setAttribute("aria-pressed", both ? "true" : "false");
    bothBtn.addEventListener("click", () => { both = !both; apply(); paint(); player.captions?.refresh(); });
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = player.t("reset");
    reset.addEventListener("click", () => {
      size = 100; fg = "#ffffff"; bg = "#000000"; place = "below"; both = false;
      apply(); paint();
    });
    target.append(title, preview, sizeDown, sizeLabel, sizeUp, colors, positions, bothBtn, reset, note);
  }

  function paint() {
    for (const box of [...boxes]) {
      if (box.isConnected) draw(box);
      else boxes.delete(box);
    }
  }

  const panel = document.createElement("form");
  panel.className = "lh-panel";
  panel.hidden = true;
  panel.addEventListener("submit", (event) => event.preventDefault());
  boxes.add(panel);

  let open = false;
  player.addControl({
    id: "caption-style", order: 73, toggle: true,
    pressed: () => open, labelKey: "style",
    onClick: () => {
      open = !open;
      panel.hidden = !open;
      if (open) { paint(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.registerShortcut("v", "key_v", () => player.shadow.querySelector("[data-id='caption-style']")?.click());
  player.captionStyle = {
    mount(parent) {
      const box = document.createElement("div");
      box.dataset.capStyle = "1";
      parent.append(box);
      boxes.add(box);
      paint();
    }
  };
  player.slots.panels.append(panel);
  apply();
}
