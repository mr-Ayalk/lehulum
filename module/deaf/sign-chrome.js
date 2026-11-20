// FR-DEAF-02, FR-DEAF-04: Sign-window look, icons, and the More menu labels.
const NS = "http://www.w3.org/2000/svg";
export const PLACES = [["tl", "move_top_left"], ["tr", "move_top_right"], ["bl", "move_bottom_left"], ["br", "move_bottom_right"]];
export const PACES = [["smooth", "pacing_smooth"], ["pause", "pacing_pause"], ["off", "pacing_off"]];
export const ACTS = [...PLACES, ["larger", "larger"], ["smaller", "smaller"], ["opacity", "opacity"], ["speed", "signer_speed"]];

export const CSS = `.sign-window{position:absolute;z-index:4;border:2px solid #C9A227;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.5);background:#14130F;overflow:visible;touch-action:none;cursor:grab;aspect-ratio:3/4}
.sign-window:active{cursor:grabbing}.sign-window[hidden]{display:none}
.sign-window video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;border-radius:14px;background:#14130F;pointer-events:none}
.sign-bar{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:flex-end;background:linear-gradient(rgba(11,61,48,.82),transparent 78%);border-radius:14px 14px 0 0}
.sign-mark{margin-right:auto;padding:.35rem .7rem;color:#F6E7B2;font:700 .8rem/1.2 "Atkinson Hyperlegible",system-ui,sans-serif}
.sign-window[lang="am"] .sign-mark{font-family:"Noto Sans Ethiopic",sans-serif;letter-spacing:normal;text-transform:none}
.sign-icon{width:44px;height:44px;display:grid;place-items:center;border:0;background:transparent;color:#fff;padding:0}
.sign-grip{position:absolute;z-index:2;width:44px;height:44px;border:0;background:transparent;color:#fff;opacity:0;padding:0}
.sign-window:hover>.sign-grip,.sign-window:focus-within>.sign-grip,.sign-window.show-ui>.sign-grip{opacity:1}
.sign-grip::after{content:"";position:absolute;width:12px;height:12px;border:2px solid #fff}
.grip-tl{left:0;top:0}.grip-tr{right:0;top:0}.grip-bl{left:0;bottom:0}.grip-br{right:0;bottom:0}
.grip-tl::after{left:8px;top:8px;border-right:0;border-bottom:0}.grip-tr::after{right:8px;top:8px;border-left:0;border-bottom:0}
.grip-bl::after{left:8px;bottom:8px;border-right:0;border-top:0}.grip-br::after{right:8px;bottom:8px;border-left:0;border-top:0}
.sign-menu{position:absolute;z-index:5;top:46px;left:8px;display:flex;flex-direction:column;min-width:12rem;padding:.25rem;border-radius:10px;background:#14130F;color:#fff;border:1px solid rgba(255,255,255,.2)}
.sign-window.menu-in .sign-menu{left:auto;right:8px}
.sign-none,.sign-missing{margin:.75rem 1rem;padding:.75rem 1rem;border:2px solid #FFD54A;border-radius:8px;background:#2A2721;color:#F3F0E8}
.sign-missing{position:absolute;left:.5rem;right:.5rem;bottom:.5rem;z-index:4;margin:0;pointer-events:none}
.sign-wait{position:absolute;z-index:5;display:flex;align-items:center;gap:.35rem;margin:0;padding:.15rem .35rem .15rem .75rem;border-radius:999px;background:#14130F;color:#fff;border:1px solid rgba(255,255,255,.24);pointer-events:auto;animation:sign-fade 150ms ease}
.sign-wait[hidden],.sign-missing[hidden]{display:none}
.sign-wait button{min-width:2.75rem;min-height:2.75rem;border:0;border-radius:999px;background:#F3F0E8;color:#14130F;font:inherit}
@keyframes sign-fade{from{opacity:0}to{opacity:1}}
.sign-menu[hidden]{display:none}
.sign-menu button{min-height:44px;text-align:start;padding:0 .75rem;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit}
.sign-pace{padding:.35rem .75rem .15rem;font-weight:700}
[data-pace-note]{align-self:center;padding:0 .35rem;font-size:.75rem;opacity:.8}
.sign-window:focus-visible,.sign-icon:focus-visible,.sign-grip:focus-visible,.sign-menu button:focus-visible,.sign-wait button:focus-visible{outline:3px solid #FFD54A;outline-offset:2px}
.stage.sign-first{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(8rem,.72fr);gap:.75rem;align-items:start;padding:.5rem}
.stage.sign-first>.sign-window{position:relative;left:auto;top:auto;width:min(100%,46.5vh);height:auto;grid-column:1;grid-row:1;justify-self:start;cursor:default}
.stage.sign-first>video:not([data-sign]){grid-column:2;grid-row:1;width:100%;min-width:0}
@media (max-width:520px){.stage.sign-first{grid-template-columns:minmax(0,1fr)}.stage.sign-first>.sign-window{grid-column:1;grid-row:1}.stage.sign-first>video:not([data-sign]){grid-column:1;grid-row:2}}
@media (prefers-reduced-motion:reduce){.sign-bar,.sign-wait{transition:none;animation:none}}
@media (prefers-contrast:more){.sign-window,.sign-menu,.sign-none,.sign-missing,.sign-wait{border-color:#fff;background:#000;color:#fff}.sign-wait button{background:#fff;color:#000}}`;

function svg(kind) {
  const node = document.createElementNS(NS, "svg");
  node.setAttribute("viewBox", "0 0 24 24");
  node.setAttribute("width", "20");
  node.setAttribute("height", "20");
  node.setAttribute("aria-hidden", "true");
  if (kind === "more") {
    for (const cx of ["6", "12", "18"]) {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", "12");
      dot.setAttribute("r", "1.7");
      dot.setAttribute("fill", "currentColor");
      node.append(dot);
    }
    return node;
  }
  const path = document.createElementNS(NS, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", kind === "swap" ? "M7 7h11M15 4l3 3-3 3M17 17H6M9 14l-3 3 3 3" : "M6 6l12 12M18 6L6 18");
  node.append(path);
  return node;
}

function button(kind) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "sign-icon";
  node.append(svg(kind));
  return node;
}

function name(node, text) {
  node.setAttribute("aria-label", text);
  node.title = text;
}

export function buildChrome(win) {
  win.root = document.createElement("div");
  win.root.className = "sign-window";
  win.root.tabIndex = 0;
  win.root.setAttribute("role", "group");
  win.root.hidden = true;
  win.video = document.createElement("video");
  win.video.muted = true;
  win.video.playsInline = true;
  win.video.preload = "auto";
  win.video.setAttribute("aria-hidden", "true");
  win.video.dataset.sign = "1";
  win.bar = document.createElement("div");
  win.bar.className = "sign-bar";
  win.mark = document.createElement("span");
  win.mark.className = "sign-mark";
  win.swap = button("swap");
  win.more = button("more");
  win.more.setAttribute("aria-haspopup", "menu");
  win.more.setAttribute("aria-expanded", "false");
  win.closeBtn = button("close");
  win.menu = document.createElement("div");
  win.menu.className = "sign-menu";
  win.menu.hidden = true;
  win.menu.setAttribute("role", "menu");
  win.grip = document.createElement("button");
  win.grip.type = "button";
  win.grip.className = "sign-grip grip-bl";
  win.bar.append(win.mark, win.swap, win.more, win.closeBtn);
  for (const [id] of ACTS) {
    const item = document.createElement("button");
    item.type = "button";
    item.dataset.act = id;
    item.setAttribute("role", id === "wait" ? "menuitemcheckbox" : "menuitem");
    item.addEventListener("click", () => win.act(id));
    win.menu.append(item);
  }
  win.paceLabel = document.createElement("div");
  win.paceLabel.className = "sign-pace";
  win.paceLabel.id = "sign-pace";
  win.menu.append(win.paceLabel);
  for (const [id] of PACES) {
    const item = document.createElement("button");
    item.type = "button";
    item.dataset.act = id;
    item.setAttribute("role", "menuitemradio");
    item.setAttribute("aria-checked", "false");
    item.addEventListener("click", () => win.act(id));
    win.menu.append(item);
  }
  win.root.append(win.video, win.grip, win.bar, win.menu);
}

export function paintChrome(win) {
  const t = win.hooks.t;
  win.root.setAttribute("aria-label", t("sign_window_label"));
  win.root.lang = /[\u1200-\u137F]/.test(t("sign_mark")) ? "am" : "en";
  if (win.mark) win.mark.textContent = t("sign_mark");
  name(win.swap, t("swap_layout"));
  name(win.more, t("more"));
  name(win.closeBtn, t("close_sign"));
  name(win.grip, t("resize_sign"));
  win.menu.setAttribute("aria-label", t("more"));
  if (win.paceLabel) win.paceLabel.textContent = t("pacing");
  for (const video of win.root.querySelectorAll("video")) video.style.opacity = String(win.opacity);
  for (const item of win.menu.querySelectorAll("[data-act]")) {
    const id = item.dataset.act;
    const place = PLACES.find((row) => row[0] === id);
    if (place) item.textContent = t("move_to_place", { place: t(place[1]) });
    else if (id === "opacity") item.textContent = t("opacity_value", { value: Math.round(win.opacity * 100) + "%" });
    else if (id === "speed") item.textContent = t("signer_speed_value", { value: win.rate + "×" });
    else if (PACES.some((row) => row[0] === id)) { item.textContent = t("pacing_" + id); item.setAttribute("aria-checked", (win.pacing || "smooth") === id ? "true" : "false"); }
    else item.textContent = t(id);
  }
}
