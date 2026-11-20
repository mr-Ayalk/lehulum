// FR-DEAF-01, FR-DEAF-05, FR-DEAF-07, FR-DEAF-08: Open the sign window and keep captions clear.
import { attachCueSync } from "./sign-cues.js";
import { signMode } from "./sign-schedule.js";
import { attachSignSync, nextRate } from "./sign-sync.js";
import { CSS, SignWindow } from "./sign-window.js";

const KEY = "db-player:prefs";

function prefs() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (error) { return {}; }
}

function store(player, patch) {
  const next = { ...prefs(), ...patch };
  player.prefs = { ...player.prefs, ...next };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (error) { /* private mode */ }
}

export function attachSign(player) {
  if (player.sign) return player.sign;
  const style = document.createElement("style");
  style.dataset.sign = "1";
  style.textContent = CSS;
  player.shadow.append(style);
  const saved = prefs();
  const profile = saved.profile ?? "";
  const wants = Array.isArray(profile) ? profile.includes("sign") : String(profile).split(/[\s,]+/).includes("sign");
  const stage = player.shadow.querySelector(".stage");
  let open = false;
  let mode = "continuous";
  const none = document.createElement("p");
  none.className = "sign-none";
  none.setAttribute("role", "status");
  none.hidden = true;
  player.slots.below.append(none);
  const bus = {};
  const win = new SignWindow(stage, {
    t: (key, vars) => player.t(key, vars),
    announce: (key, vars) => player.announce(key, vars),
    close: () => api.close(),
    layout: (next) => api.setLayout(next),
    save: () => save(),
    moved: () => { player.captions?.relayout?.(); cues?.place(); },
    wait(on) { win.wait = !!on; win.pacing = on ? "pause" : "off"; save(); cues?.setPace(win.pacing); },
    pace(mode) { win.pacing = mode; win.wait = mode !== "off"; save(); cues?.setPace(mode); },
    speed() {
      win.rate = nextRate(win.rate);
      win.paint();
      player.announce("signer_speed_value", { value: win.rate + "×" });
      save();
      if (mode === "cues") { cues?.applyRate(); cues?.replan(); }
      else sync.follow();
    }
  });
  win.layout = saved.signLayout || (wants ? "sign-first" : "lesson-first");
  win.opacity = [1, 0.8, 0.6].includes(saved.signOpacity) ? saved.signOpacity : 1;
  win.rate = [1, 0.85, 0.75].includes(saved.signRate) ? saved.signRate : 1;
  win.pacing = saved.signPacing || (saved.signWait === false ? "off" : saved.signWait === true ? "pause" : "smooth");
  if (!["smooth", "pause", "off"].includes(win.pacing)) win.pacing = "smooth";
  win.wait = win.pacing !== "off";
  const width = Number(saved.signW ?? saved.signScale);
  if (saved.signX != null && width >= 0.18 && width <= 0.55) {
    win.frac = { x: Number(saved.signX), y: Number(saved.signY) || 0, w: width };
    win.userPlaced = true;
  }
  const sync = attachSignSync(player, () => (open && none.hidden && mode === "continuous" ? win.video : null), () => win.rate);
  const cues = attachCueSync(player, win);
  function save() {
    store(player, {
      signLayout: win.layout, signOpacity: win.opacity, signRate: win.rate, signPacing: win.pacing, signWait: win.pacing !== "off",
      signX: win.frac?.x, signY: win.frac?.y, signW: win.frac?.w
    });
  }
  function wordClip() {
    if (win.word) return win.word;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.dataset.sign = "1";
    video.dataset.word = "1";
    video.style.visibility = "hidden";
    win.video.after(video);
    win.word = video;
    return video;
  }
  function begin(src) {
    mode = signMode(src);
    if (!src) { cues.stop(); sync.stop(); win.hide(); return; }
    if (mode === "cues") { sync.stop(); win.show(""); cues.start(src); }
    else { cues.stop(); win.show(src); sync.start(); }
  }
  function emit(name) { for (const fn of bus[name] || []) fn(); }
  const api = {
    get layout() { return win.layout; },
    get video() { return open && none.hidden ? (win.videoB && mode === "cues" ? [win.video, win.videoB].find((video) => video.style.visibility !== "hidden") || win.video : win.video) : null; },
    get log() { return cues.log; },
    get holds() { return cues.holds; },
    get endWait() { return cues.endWait; },
    get maxLag() { return cues.maxLag; },
    get meanLag() { return cues.meanLag; },
    isOpen: () => open,
    open() {
      const src = player.host.getAttribute("sign") || "";
      open = true;
      store(player, { signOpen: true });
      none.textContent = player.t("sign_none");
      none.hidden = !!src;
      begin(src);
      player.captions?.relayout?.();
      player._paintAll();
      emit("open");
    },
    close() {
      open = false;
      store(player, { signOpen: false });
      none.hidden = true;
      if (win.word) win.word.style.visibility = "hidden";
      cues.stop();
      win.hide();
      sync.stop();
      player.captions?.relayout?.();
      player._paintAll();
      player.shadow.querySelector("[data-id=sign]")?.focus();
      emit("close");
    },
    setLayout(next) {
      win.layout = next === "lesson-first" ? "lesson-first" : "sign-first";
      if (open && none.hidden) win.place();
      player.announce(win.layout === "sign-first" ? "layout_sign_first" : "layout_lesson_first");
      save();
      player.captions?.relayout?.();
    },
    play(src, opts = {}) {
      if (!open) api.open();
      none.hidden = true;
      if (opts.word) return api.playWord(src, opts);
      if (src) begin(src);
      if (opts.from != null && signMode(src || "") !== "cues") win.video.currentTime = Number(opts.from) || 0;
      return win.video;
    },
    playWord(src, opts = {}) {
      if (!open) api.open();
      cues.stop();
      sync.stop();
      mode = "word";
      none.hidden = true;
      win.show("");
      const video = wordClip();
      video.style.visibility = "visible";
      video.style.zIndex = "2";
      video.preservesPitch = video.webkitPreservesPitch = true;
      video.playbackRate = Number(opts.rate) > 0 ? Number(opts.rate) : 1;
      const from = Number(opts.from) || 0;
      const go = () => { video.currentTime = from; video.play().catch(() => {}); };
      if (video.getAttribute("src") !== src) { video.src = src; video.addEventListener("loadedmetadata", go, { once: true }); }
      else if (video.readyState >= 1) go();
      else video.addEventListener("loadedmetadata", go, { once: true });
      return video;
    },
    resumeLesson() {
      if (win.word) { win.word.pause(); win.word.style.visibility = "hidden"; }
      const src = player.host.getAttribute("sign") || "";
      mode = signMode(src);
      if (mode !== "cues") { begin(src); return; }
      cues.start(src, { at: true });
    },
    on(name, fn) { (bus[name] ||= []).push(fn); }
  };
  const setLang = player.setLang.bind(player);
  player.setLang = async (lang) => {
    await setLang(lang);
    if (open) { none.textContent = player.t("sign_none"); win.paint(); cues.label(); }
  };
  player.sign = api;
  return api;
}
