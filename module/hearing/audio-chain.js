// FR-HOH-01, FR-HOH-03, FR-HOH-04, FR-HOH-05, FR-HOH-07, FR-HOH-12: One hearing panel and one audio chain.
import { savePrefs } from "../core/prefs.js";

const CLARITY = {
  off: { a: 0, b: 0, ratio: 1 },
  clear: { a: 6, b: 3, ratio: 4 },
  strong: { a: 9, b: 6, ratio: 6 }
};
const BOOSTS = [1, 1.5, 2];
const SPEEDS = [1, 0.85, 0.75];

export function attachHearing(player) {
  let nodes = null;
  let mode = player.prefs.hearing || "off";
  let boost = Number(player.prefs.boost || 1);
  let mono = !!player.prefs.mono;
  let balance = Number(player.prefs.balance || 0);
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let open = false;

  function ensure() {
    if (nodes || !player.media) return nodes;
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
      const panner = ctx.createStereoPanner();
      const splitter = ctx.createChannelSplitter(2);
      const mix = ctx.createGain();
      mix.gain.value = 0.5;
      const merger = ctx.createChannelMerger(2);
      source.connect(high).connect(mid).connect(highBand).connect(comp).connect(gain);
      splitter.connect(mix, 0);
      splitter.connect(mix, 1);
      mix.connect(merger, 0, 0);
      mix.connect(merger, 0, 1);
      nodes = { ctx, mid, highBand, comp, gain, panner, splitter, merger };
      return nodes;
    } catch (error) {
      player.announce("hearing_unavailable");
      return null;
    }
  }

  function apply() {
    const audio = nodes;
    if (!audio) return;
    const preset = CLARITY[mode] || CLARITY.off;
    audio.mid.gain.value = preset.a;
    audio.highBand.gain.value = preset.b;
    audio.comp.ratio.value = preset.ratio;
    audio.comp.threshold.value = -24;
    audio.gain.gain.value = boost;
    audio.panner.pan.value = mono ? 0 : balance;
    for (const node of [audio.gain, audio.merger, audio.panner]) {
      try { node.disconnect(); } catch (error) { /* not connected yet */ }
    }
    if (mono) audio.gain.connect(audio.splitter), audio.merger.connect(audio.ctx.destination);
    else audio.gain.connect(audio.panner).connect(audio.ctx.destination);
    player.media.preservesPitch = player.media.webkitPreservesPitch = true;
    if (audio.ctx.state === "suspended") audio.ctx.resume();
  }

  function remember() {
    player.prefs = { ...player.prefs, ...savePrefs({ hearing: mode, boost, mono, balance }) };
    ensure();
    apply();
  }

  function checked() {
    const cues = player.captions?.getCues?.(player.captions.currentLang() || "am") || [];
    if (!cues.length) return "100";
    const done = player.prefs.checked || {};
    const count = cues.filter((cue) => !cue.low || done[cue.id]).length;
    return String(Math.round(100 * count / cues.length));
  }

  function paint() {
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("hearing");
    panel.append(title);
    for (const name of Object.keys(CLARITY)) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t("clarity_" + name);
      button.setAttribute("aria-pressed", mode === name ? "true" : "false");
      button.addEventListener("click", () => { mode = name; remember(); paint(); });
      panel.append(button);
    }
    for (const value of BOOSTS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t("boost_" + Math.round(value * 100));
      button.setAttribute("aria-pressed", boost === value ? "true" : "false");
      button.addEventListener("click", () => { boost = value; remember(); paint(); });
      panel.append(button);
    }
    for (const value of SPEEDS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t("speed_" + String(value).replace(".", ""));
      button.setAttribute("aria-pressed", player.media.playbackRate === value ? "true" : "false");
      button.addEventListener("click", () => {
        player.media.playbackRate = value;
        player.media.preservesPitch = player.media.webkitPreservesPitch = true;
        paint();
      });
      panel.append(button);
    }
    const monoBtn = document.createElement("button");
    monoBtn.type = "button";
    monoBtn.textContent = player.t("mono");
    monoBtn.setAttribute("aria-pressed", mono ? "true" : "false");
    monoBtn.addEventListener("click", () => { mono = !mono; remember(); paint(); });
    const balanceLabel = document.createElement("label");
    balanceLabel.textContent = player.t("balance") + " ";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "-1";
    slider.max = "1";
    slider.step = "0.1";
    slider.value = String(balance);
    slider.addEventListener("input", () => { balance = Number(slider.value); remember(); });
    balanceLabel.append(slider);
    const uncertain = document.createElement("button");
    uncertain.type = "button";
    uncertain.textContent = player.t("uncertain");
    uncertain.setAttribute("aria-pressed", player.prefs.showUncertain === false ? "false" : "true");
    uncertain.addEventListener("click", () => {
      player.prefs = { ...player.prefs, ...savePrefs({ showUncertain: player.prefs.showUncertain === false }) };
      player.captions?.refresh?.();
      paint();
    });
    const review = document.createElement("button");
    review.type = "button";
    review.textContent = player.t("checked_line");
    review.addEventListener("click", () => {
      const cue = player.captions?.cueAt?.(player.media.currentTime || 0);
      if (!cue) return;
      const checkedMap = { ...(player.prefs.checked || {}), [cue.id || cue.start]: true };
      player.prefs = { ...player.prefs, ...savePrefs({ checked: checkedMap }) };
      const api = player.host.getAttribute("api");
      const lesson = player.host.getAttribute("lesson-id");
      const lang = player.captions.currentLang?.() || "am";
      if (api && lesson && cue.id) {
        fetch(api.replace(/\/$/, "") + "/lessons/" + lesson + "/captions/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: cue.id, lang })
        }).then((response) => { if (response.ok) player.captions.reload?.(); }).catch(() => {});
      }
      player.captions?.refresh?.();
      paint();
    });
    const score = document.createElement("p");
    score.textContent = player.t("captions_checked", { n: checked() });
    panel.append(monoBtn, balanceLabel, uncertain, review, score);
    player.captionStyle?.mount(panel);
  }

  player.addControl({
    id: "hearing", order: 77, toggle: true,
    pressed: () => open, labelKey: "hearing",
    onClick: () => {
      open = !open;
      panel.hidden = !open;
      if (open) { paint(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.registerShortcut("h", "key_h", () => player.shadow.querySelector("[data-id='hearing']")?.click());
  player.on("play", () => { ensure(); apply(); });
  player.slots.panels.append(panel);
}
