// C-01, C-03, C-04, FR-CORE-01, FR-CORE-03, INT-01, INT-03, INT-04: Define <db-player> and keep src and lang in sync.
import { attachCaptions } from "./core/captions.js";
import { loadStrings } from "./core/i18n.js";
import { Player } from "./core/player.js";

const TAG = "db-player";

function loadSign(player) {
  player._signLoad ||= import("./deaf/sign-boot.js").then((mod) => mod.attachSign(player));
  return player._signLoad;
}

function toggleSign(player) {
  loadSign(player).then(() => {
    if (player.sign.isOpen()) player.sign.close();
    else player.sign.open();
  });
}

function loadGlossary(player) {
  if (!player.host.getAttribute("glossary")) return null;
  player._glossaryLoad ||= import("./deaf/glossary.js").then((mod) => mod.attachGlossary(player));
  return player._glossaryLoad;
}

function mountSign(player) {
  player.addControl({
    id: "sign", order: 48, toggle: true, labelKey: "sign",
    pressed: () => !!player.sign?.isOpen(),
    onClick: () => toggleSign(player)
  });
  player.registerShortcut("s", "key_s", () => toggleSign(player));
}
const SHELL = `<style>
@font-face{font-family:"Atkinson Hyperlegible";font-weight:400;font-display:swap;src:url("/module/fonts/atkinson-hyperlegible-400.woff2") format("woff2")}
@font-face{font-family:"Atkinson Hyperlegible";font-weight:700;font-display:swap;src:url("/module/fonts/atkinson-hyperlegible-700.woff2") format("woff2")}
@font-face{font-family:"Noto Sans Ethiopic";font-weight:400;font-display:swap;src:url("/module/fonts/noto-sans-ethiopic-400.woff2") format("woff2")}
@font-face{font-family:"Noto Sans Ethiopic";font-weight:700;font-display:swap;src:url("/module/fonts/noto-sans-ethiopic-700.woff2") format("woff2")}
@font-face{font-family:"JetBrains Mono";font-weight:400;font-display:swap;src:url("/module/fonts/jetbrains-mono-400.woff2") format("woff2")}
:host{display:block;max-width:100%;color:var(--lh-player-text,var(--bs-body-color,#F3F0E8));font-family:var(--lh-font-latin,var(--bs-body-font-family,"Atkinson Hyperlegible",system-ui,sans-serif));font-size:1rem;line-height:1.5}
:host([lang="am"]){font-family:var(--lh-font-ethiopic,"Noto Sans Ethiopic","Atkinson Hyperlegible",sans-serif);line-height:1.7;letter-spacing:normal;text-transform:none}
:host([lang="am"]) *{letter-spacing:normal;text-transform:none}
*,*::before,*::after{box-sizing:border-box}
.player{max-width:100%;background:var(--lh-player-bg,#14130F);border-radius:12px;overflow:visible}
.player:fullscreen{width:100%;height:100%;overflow:auto;border-radius:0}
.stage{position:relative;background:#14130F;overflow:hidden}
video{display:block;width:100%;max-width:100%;height:auto;aspect-ratio:16/9;object-fit:contain;background:#14130F}
.overlay{position:absolute;inset:0;pointer-events:none}
.error{margin:0;padding:.75rem 1rem;color:var(--lh-player-text,#F3F0E8)}
.controls{display:flex;flex-direction:column;max-width:100%;background:var(--lh-player-bg,#14130F);color:var(--lh-player-text,#F3F0E8)}
.seekrow{display:flex;align-items:center;gap:.75rem;padding:.5rem 1rem 0}
.time,.dur{min-width:3rem;font-family:var(--lh-font-code,"JetBrains Mono",ui-monospace,monospace);font-size:.94rem;font-variant-numeric:tabular-nums}
.seek{flex:1;min-width:2.75rem;min-height:2.75rem;margin:0;background:transparent;appearance:none;accent-color:var(--lh-player-accent,var(--bs-primary,#62D6AA))}
.seek::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:var(--lh-player-track,#2A2721);border:1px solid var(--lh-player-border,#8C8678)}
.seek::-webkit-slider-thumb{appearance:none;width:22px;height:22px;margin-top:-9px;border-radius:50%;background:var(--lh-player-text,#F3F0E8);border:3px solid var(--lh-player-accent,#62D6AA)}
.seek::-moz-range-track{height:6px;border-radius:3px;background:var(--lh-player-track,#2A2721);border:1px solid var(--lh-player-border,#8C8678)}
.seek::-moz-range-thumb{width:22px;height:22px;border:3px solid var(--lh-player-accent,#62D6AA);border-radius:50%;background:var(--lh-player-text,#F3F0E8)}
.btns{display:flex;flex-wrap:wrap}
.controls button{flex:1 1 3.5rem;min-width:2.75rem;min-height:3.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15rem;padding:.25rem;background:transparent;color:inherit;border:0;border-radius:8px;font:400 .85rem/1.2 var(--lh-font-latin,"Atkinson Hyperlegible",system-ui,sans-serif)}
:host([lang="am"]) .controls button{font-family:var(--lh-font-ethiopic,"Noto Sans Ethiopic",sans-serif);line-height:1.4}
.controls button::before{font-weight:700;font-size:1rem;line-height:1}
[data-id="play"][data-state="play"]::before{content:"▶"}
[data-id="play"][data-state="pause"]::before{content:"❚❚"}
[data-id="back"]::before{content:"↺"}
[data-id="forward"]::before{content:"↻"}
[data-id="speed"]::before{content:attr(data-rate)}
[data-id="mute"]::before{content:"♪"}
[data-id="mute"][aria-pressed="true"]::before{content:"✕"}
[data-id="full"]::before{content:"⤢"}
[data-id="help"]::before{content:"⌨"}
[data-id="sign"]::before{content:"✋"}
[data-id="glossary"]::before{content:"Aa"}
.controls button[aria-pressed="true"]{box-shadow:inset 0 -3px 0 var(--lh-player-accent,#62D6AA)}
button:focus-visible,.seek:focus-visible{outline:3px solid var(--lh-player-focus,#FFD54A);outline-offset:2px}
.lh-panel{margin:0;padding:1rem;color:var(--lh-text,#1C1B18);background:var(--lh-surface,#fff);border-top:1px solid var(--lh-border,#8A8478)}
.lh-panel h2{margin:0 0 .5rem;font-size:1.125rem}
.lh-panel button,.lh-panel a{min-height:2.75rem;min-width:2.75rem;margin:.25rem .25rem 0 0;padding:.25rem .75rem;font:inherit;color:inherit;background:transparent;border:1px solid var(--lh-border,#8A8478);border-radius:8px}
.lh-panel button:focus-visible,.lh-panel a:focus-visible{outline:3px solid var(--lh-focus,#1C1B18);outline-offset:2px}
.below,.panels{max-width:100%}
dialog{max-width:min(32rem,calc(100vw - 2rem));padding:1.25rem;border:1px solid var(--lh-border,#8A8478);border-radius:12px;color:var(--lh-text,#1C1B18);background:var(--lh-surface,#fff);box-shadow:var(--lh-shadow-dialog,0 12px 32px rgba(0,0,0,.25))}
dialog::backdrop{background:var(--lh-scrim,rgba(28,27,24,.6))}
dialog button{min-height:2.75rem;margin:.25rem .5rem .25rem 0;padding:0 1rem;border-radius:8px;border:1px solid var(--lh-border,#8A8478);background:var(--lh-surface,#fff);color:var(--lh-text,#1C1B18);font:inherit}
dialog button:focus-visible{outline:3px solid var(--lh-focus,#1C1B18);outline-offset:2px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none;animation:none}}
:host([theme="contrast"]){--lh-player-bg:#000;--lh-player-text:#FFE14A;--lh-player-accent:#FFFF00;--lh-player-focus:#00E5FF;--lh-text:#FFE14A;--lh-surface:#000;--lh-border:#fff;--lh-focus:#00E5FF}
@media (prefers-contrast:more){:host{--lh-player-bg:#000;--lh-player-text:#FFE14A;--lh-player-accent:#FFFF00;--lh-player-focus:#00E5FF;--lh-text:#FFE14A;--lh-surface:#000;--lh-border:#fff;--lh-focus:#00E5FF}}
</style>
<div class="player"><div class="stage"><video preload="none" crossorigin="anonymous" playsinline></video><div class="overlay"></div><p class="error" role="alert" hidden></p></div>
<div class="controls" role="group"><div class="seekrow"><span class="time" aria-hidden="true"></span><input class="seek" type="range" min="0" max="0" step="0.1" value="0"><span class="dur" aria-hidden="true"></span></div><div class="btns"></div></div>
<div class="below"></div><div class="panels"></div><div class="sr-only" aria-live="polite"></div>
<dialog class="help" aria-labelledby="help-title"><h2 id="help-title"></h2><ul></ul><button type="button" class="shortcuts"></button><button type="button" class="close"></button></dialog></div>`;

class DbPlayer extends HTMLElement {
  static get observedAttributes() { return ["src", "lang", "captions", "sign", "glossary", "describe", "screen", "chapters"]; }

  constructor() { super(); this.attachShadow({ mode: "open" }); }

  connectedCallback() { this._boot(); }

  disconnectedCallback() {
    this._token = null;
    this._player?.destroy();
    this._player = null;
  }

  attributeChangedCallback(name, oldValue, value) {
    if (!this._player || oldValue === value) return;
    if (name === "lang") this._player.setLang(value === "am" ? "am" : "en");
    if (name === "src") this._player.setSource(value || "", this.getAttribute("poster"));
    if (name === "captions") this._player.captions?.reload();
    if (name === "sign" && this._player.sign?.isOpen()) this._player.sign.play(value || "", {});
    if (name === "glossary" && value) loadGlossary(this._player);
  }

  async _boot() {
    const token = {};
    this._token = token;
    let lang = this.getAttribute("lang") === "am" ? "am" : "en";
    if (this.getAttribute("lang") !== lang) this.setAttribute("lang", lang);
    await loadStrings(lang);
    if (this._token !== token || !this.isConnected) return;
    const latest = this.getAttribute("lang") === "am" ? "am" : "en";
    if (latest !== lang) {
      await loadStrings(latest);
      if (this._token !== token || !this.isConnected) return;
    }
    this._player = new Player(this, this.shadowRoot);
    this._player.render(SHELL);
    attachCaptions(this._player);
    mountSign(this._player);
    loadGlossary(this._player);
    this._player.setSource(this.getAttribute("src") || "", this.getAttribute("poster"));
    if (new URLSearchParams(location.search).get("sign") === "on" || this.hasAttribute("data-sign-open")) toggleSign(this._player);
    loadFeatures(this._player);
  }
}

function loadFeatures(player) {
  const modules = [
    ["./core/transcript.js", "attachTranscript"],
    ["./hearing/caption-style.js", "attachCaptionStyle"],
    ["./hearing/repeat.js", "attachRepeat"],
    ["./hearing/audio-chain.js", "attachHearing"],
    ["./blind/descriptions.js", "attachDescriptions"],
    ["./blind/on-screen.js", "attachOnScreen"],
    ["./blind/chapters.js", "attachChapters"],
    ["./net/offline.js", "attachOffline"],
    ["./net/connection.js", "attachConnection"],
    ["./net/progress-queue.js", "attachProgress"],
    ["./text/text-mode.js", "attachTextMode"],
    ["./blind/earcons.js", "attachEarcons"]
  ];
  for (const [path, name] of modules) {
    import(path).then((mod) => mod[name](player)).catch((error) => console.error(path, error));
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, DbPlayer);
