// FR-CORE-04, FR-CORE-05, FR-CORE-06, FR-CORE-08, FR-CORE-09, NFR-A11Y-04: Video, controls, and the slots later modules use.
import { announce } from "./announce.js";
import { formatClock, formatTime, loadStrings, t } from "./i18n.js";
import { createKeyboard } from "./keyboard.js";

const RATES = [1, 0.85, 0.75];

function hostEvent(host, name, detail) {
  host.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
}

export class Player {
  constructor(host, shadow) {
    Object.assign(this, {
      host, shadow, media: null, prefs: {}, slots: {}, _bus: {}, _controls: [],
      _bucket: 0, _wasFs: false, _completed: false
    });
  }

  on(event, fn) { (this._bus[event] ||= []).push(fn); }
  emit(event, data) { for (const fn of this._bus[event] || []) fn(data); }
  t(key, vars) { return t(key, vars); }
  announce(key, vars) { announce(this.shadow, t(key, vars)); }
  registerShortcut(key, labelKey, fn) { this._keys.registerShortcut(key, labelKey, fn); }

  addControl(opts) {
    const button = document.createElement("button");
    button.type = "button";
    if (opts.id) button.dataset.id = opts.id;
    button.addEventListener("click", opts.onClick);
    const entry = { el: button, ...opts };
    this._controls.push(entry);
    this._mount(button, opts.order ?? 100);
    this._paint(entry);
    return button;
  }

  async setLang(lang) { await loadStrings(lang); if (!this.root?.isConnected) return; this.root.lang = lang; this._paintAll(); }

  setSource(src, poster) {
    const video = this.media;
    poster ? video.setAttribute("poster", poster) : video.removeAttribute("poster");
    if (!src) video.removeAttribute("src");
    else if (video.getAttribute("src") !== src) video.src = src;
    this._error.hidden = true;
    this._completed = false;
    this._paintAll();
  }

  destroy() {
    this._keys?.destroy();
    document.removeEventListener("fullscreenchange", this._onFs);
    this.media?.pause();
    this.shadow.replaceChildren();
  }

  render(shell) {
    const q = (sel) => this.shadow.querySelector(sel);
    this.shadow.innerHTML = shell;
    const [root, media, controls, time, seek, help, error, list, shortcut] = [
      ".player", "video", ".controls", ".time", ".seek", ".help", ".error", ".help ul", ".shortcuts"
    ].map(q);
    Object.assign(this, { root, media, controls, time, seek, help, _error: error, _list: list, _toggle: shortcut, btns: q(".btns"), dur: q(".dur") });
    this.slots = { overlay: q(".overlay"), below: q(".below"), panels: q(".panels") };
    this.root.lang = this.host.getAttribute("lang") === "am" ? "am" : "en";
    this.media.tabIndex = -1;
    this.media.preservesPitch = this.media.webkitPreservesPitch = true;
    const on = (type, fn) => this.media.addEventListener(type, fn);
    on("mousedown", (event) => event.preventDefault()); on("click", () => { this.toggle(); this.media.blur(); });
    on("play", () => this._state("play", "playing"));
    on("pause", () => this._state("pause", "paused")); on("ended", () => this._ended());
    on("timeupdate", () => this._tick()); on("durationchange", () => this._tick());
    on("loadedmetadata", () => this.emit("ready")); on("error", () => this._failed());
    this.seek.addEventListener("input", () => this._scrub());
    const add = (id, order, extra) => this.addControl({ id, order, ...extra });
    this._play = add("play", 10, { label: () => t(this.media.paused ? "play" : "pause"), onClick: () => this.toggle() });
    add("back", 20, { labelKey: "back10", onClick: () => this.seekBy(-10) });
    add("forward", 30, { labelKey: "forward10", onClick: () => this.seekBy(10) });
    add("speed", 40, { labelKey: "speed_word", ariaLabel: () => t("speed", { value: this._rate() }), onClick: () => this.cycleRate() });
    add("mute", 50, { toggle: true, pressed: () => this.media.muted, label: () => t(this.media.muted ? "unmute" : "mute"), onClick: () => this.toggleMute() });
    add("full", 60, { label: () => t(this._fullOn() ? "exit_fullscreen" : "fullscreen"), onClick: () => this.toggleFullscreen() });
    this._helpBtn = add("help", 70, { labelKey: "help", onClick: () => this.openHelp(this._helpBtn) });
    q(".close").addEventListener("click", () => this.help.close());
    this._toggle.addEventListener("click", () => this._flipShortcuts());
    this.help.addEventListener("close", () => this._opener?.focus());
    this._onFs = () => this._fullscreenChanged();
    document.addEventListener("fullscreenchange", this._onFs);
    this._keys = createKeyboard(this.root, {
      playPause: () => this.toggle(), back: () => this.seekBy(-10), forward: () => this.seekBy(10),
      mute: () => this.toggleMute(), fullscreen: () => this.toggleFullscreen(), help: () => this.openHelp(this._helpBtn)
    });
    this._paintAll();
    this._tick();
  }

  toggle() { if (this.media.paused) this.media.play().catch(() => {}); else this.media.pause(); }
  seekBy(delta) {
    const next = Math.min(Math.max(0, this.media.currentTime + delta), this.media.duration || 0);
    this.media.currentTime = next;
    this._bucket = Math.floor(next / 5);
    this.emit("seek", { seconds: next });
    this.announce(delta < 0 ? "went_back" : "went_forward");
    this._tick();
  }

  cycleRate() {
    this.media.playbackRate = RATES[(RATES.indexOf(this.media.playbackRate) + 1) % RATES.length];
    this.media.preservesPitch = this.media.webkitPreservesPitch = true;
    this.emit("ratechange", { rate: this.media.playbackRate });
    this.announce("speed", { value: this._rate() });
    this._paintAll();
  }

  toggleMute() { this.media.muted = !this.media.muted; this.announce(this.media.muted ? "muted" : "unmuted"); this._paintAll(); }
  toggleFullscreen() { (this._fullOn() ? document.exitFullscreen() : this.root.requestFullscreen()).catch(() => {}); }

  openHelp(opener) { this._opener = opener || this._helpBtn; this._fillHelp(); if (!this.help.open) this.help.showModal(); }

  _state(event, key) { this.emit(event); this._paintAll(); this.announce(key); }
  _ended() { this.emit("ended"); if (this._completed) return; this._completed = true; hostEvent(this.host, "db-player:complete", {}); }
  _tick() {
    const now = this.media.currentTime || 0;
    const duration = this.media.duration || 0;
    if (this.shadow.activeElement !== this.seek) this.seek.value = String(now);
    this.seek.max = String(duration || 0);
    this.seek.setAttribute("aria-valuetext", formatTime(now) + t("of") + formatTime(duration));
    this.time.textContent = formatClock(now); this.dur.textContent = formatClock(duration);
    this.emit("time", { seconds: now });
    if (this.media.paused) return;
    const bucket = Math.floor(now / 5);
    if (bucket <= this._bucket) return;
    this._bucket = bucket;
    const percent = duration ? Math.round((now / duration) * 1000) / 10 : 0;
    hostEvent(this.host, "db-player:progress", { seconds: Math.round(now * 10) / 10, percent });
  }

  _scrub() {
    this.media.currentTime = Number(this.seek.value);
    this._bucket = Math.floor(this.media.currentTime / 5);
    this.emit("seek", { seconds: this.media.currentTime });
    this._tick();
  }

  _failed() { if (!this.media.getAttribute("src")) return; this._error.hidden = false; this._error.textContent = t("error_load"); }

  _fullscreenChanged() {
    const on = this._fullOn();
    if (on === this._wasFs) return;
    this._wasFs = on;
    this.announce(on ? "fullscreen_on" : "fullscreen_off");
    this._paintAll();
    if (on && !this.shadow.activeElement) this._play.focus();
  }

  _flipShortcuts() { this._keys.setEnabled(!this._keys.enabled); this._fillHelp(); this.announce(this._keys.enabled ? "shortcuts_on" : "shortcuts_off"); }

  _fillHelp() {
    this.help.querySelector("h2").textContent = t("help_title");
    this._list.replaceChildren();
    const seen = new Set();
    for (const item of this._keys.items()) {
      if (seen.has(item.labelKey)) continue;
      seen.add(item.labelKey);
      const row = document.createElement("li");
      row.textContent = t(item.labelKey);
      this._list.append(row);
    }
    const on = this._keys.enabled;
    this._toggle.setAttribute("aria-pressed", on ? "true" : "false");
    this._toggle.textContent = t(on ? "shortcuts_on" : "shortcuts_off");
    this.help.querySelector(".close").textContent = t("close");
  }

  _fullOn() { const el = document.fullscreenElement; return el === this.root || el === this.host; }
  _rate() { return this.media.playbackRate + "×"; }

  _mount(el, order) {
    el.dataset.order = String(order);
    const box = this.btns || this.controls;
    const next = [...box.children].find((child) => Number(child.dataset.order) > order);
    box.insertBefore(el, next || null);
  }

  _paint(entry) {
    entry.el.textContent = entry.label ? entry.label() : t(entry.labelKey);
    if (entry.id === "play") entry.el.dataset.state = this.media.paused ? "play" : "pause"; if (entry.id === "speed") entry.el.dataset.rate = this._rate();
    if (entry.ariaLabel) entry.el.setAttribute("aria-label", entry.ariaLabel());
    if (!entry.toggle) return;
    const pressed = typeof entry.pressed === "function" ? entry.pressed() : false;
    entry.el.setAttribute("aria-pressed", pressed ? "true" : "false");
  }

  _paintAll() {
    this.controls.setAttribute("aria-label", t("controls")); this.seek.setAttribute("aria-label", t("position"));
    if (!this._error.hidden) this._error.textContent = t("error_load");
    for (const entry of this._controls) this._paint(entry);
    if (this.help.open) this._fillHelp();
  }
}
