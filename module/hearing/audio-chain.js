// FR-HOH-01, FR-HOH-03, FR-HOH-04, FR-HOH-07: Clear-voice chain and mono. Created after the first tap.
import { savePrefs } from "../core/prefs.js";
const PRESETS = {
  off: { a: 0, b: 0, ratio: 1, gain: 1 },
  clear: { a: 6, b: 3, ratio: 2, gain: 1 },
  strong: { a: 9, b: 6, ratio: 3, gain: 1 },
  boost: { a: 4, b: 3, ratio: 4, gain: 1.5 }
};

export function attachHearing(player) {
  let nodes = null;
  let mode = player.prefs.hearing || "off";
  let mono = !!player.prefs.mono;
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;

  function chain() {
    if (nodes) return nodes;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      const ctx = new Context();
      const source = ctx.createMediaElementSource(player.media);
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 100;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 2500;
      mid.Q.value = 1;
      const highBand = ctx.createBiquadFilter();
      highBand.type = "peaking";
      highBand.frequency.value = 4000;
      const comp = ctx.createDynamicsCompressor();
      const gain = ctx.createGain();
      const splitter = ctx.createChannelSplitter(2);
      const left = ctx.createGain();
      const right = ctx.createGain();
      const merger = ctx.createChannelMerger(1);
      left.gain.value = 0.5;
      right.gain.value = 0.5;
      source.connect(high).connect(mid).connect(highBand).connect(comp).connect(gain);
      splitter.connect(left, 0);
      splitter.connect(right, 1);
      left.connect(merger, 0, 0);
      right.connect(merger, 0, 0);
      merger.connect(ctx.destination);
      gain.connect(ctx.destination);
      nodes = { ctx, mid, highBand, comp, gain, splitter };
      return nodes;
    } catch (error) {
      player.announce("hearing_unavailable");
      return null;
    }
  }

  function apply() {
    player.prefs.hearing = mode;
    player.prefs.mono = mono;
    const audio = chain();
    if (!audio) return;
    const preset = PRESETS[mode] || PRESETS.off;
    audio.mid.gain.value = preset.a;
    audio.highBand.gain.value = preset.b;
    audio.comp.ratio.value = preset.ratio;
    audio.gain.gain.value = preset.gain;
    audio.gain.disconnect();
    audio.gain.connect(mono ? audio.splitter : audio.ctx.destination);
    player.prefs = { ...player.prefs, ...savePrefs({ hearing: mode, mono }) };
    player.media.preservesPitch = true;
    if (audio.ctx.state === "suspended") audio.ctx.resume();
  }

  function paint() {
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("hearing");
    panel.append(title);
    for (const name of Object.keys(PRESETS)) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t("clarity_" + name);
      button.setAttribute("aria-pressed", mode === name ? "true" : "false");
      button.addEventListener("click", () => { mode = name; apply(); paint(); });
      panel.append(button);
    }
    const monoBtn = document.createElement("button");
    monoBtn.type = "button";
    monoBtn.textContent = player.t("mono");
    monoBtn.setAttribute("aria-pressed", mono ? "true" : "false");
    monoBtn.addEventListener("click", () => { mono = !mono; apply(); player.announce("mono"); paint(); });
    panel.append(monoBtn);
  }

  let open = false;
  player.addControl({
    id: "hearing", order: 77, toggle: true,
    pressed: () => open, labelKey: "hearing",
    onClick: () => {
      open = !open;
      panel.hidden = !open;
      if (open) { paint(); apply(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.registerShortcut("h", "key_h", () => player.shadow.querySelector("[data-id='hearing']")?.click());
  player.slots.panels.append(panel);
}
