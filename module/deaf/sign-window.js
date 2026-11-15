// FR-DEAF-01, FR-DEAF-02, FR-DEAF-03, FR-DEAF-04: Picture-in-picture sign window.
import { defaultPlace, fromFractions, pictureRect, toFractions } from "./sign-geometry.js";
import { bindSignPointer } from "./sign-pointer.js";
import { buildChrome, CSS, paintChrome } from "./sign-chrome.js";
import { bindSignKeys } from "./sign-keys.js";

export { CSS };

export class SignWindow {
  constructor(stage, hooks) {
    this.stage = stage;
    this.hooks = hooks;
    this.frac = null;
    this.opacity = 1;
    this.rate = 1;
    this.wait = true;
    this.layout = "lesson-first";
    this.userPlaced = false;
    this.timer = 0;
    buildChrome(this);
    bindSignKeys(this);
    this.swap.addEventListener("click", () => hooks.layout?.(this.layout === "sign-first" ? "lesson-first" : "sign-first"));
    this.closeBtn.addEventListener("click", () => hooks.close?.());
    this.more.addEventListener("click", () => (this.menu.hidden ? this.openMenu() : this.closeMenu(true)));
    this.menu.addEventListener("keydown", (event) => this.menuKeys(event));
    this.root.addEventListener("keydown", (event) => this.keys(event));
    this.root.addEventListener("focusout", () => this.arm());
    stage.append(this.root);
    bindSignPointer(this);
    this.watch = new ResizeObserver(() => this.place());
    this.watch.observe(stage);
    const lesson = stage.querySelector("video:not([data-sign])");
    lesson?.addEventListener("loadedmetadata", () => {
      if (!this.userPlaced) this.frac = null;
      this.place();
    });
    if (lesson && !lesson.videoWidth) {
      if (lesson.preload === "none") lesson.preload = "metadata";
      if (lesson.readyState < 1 && lesson.getAttribute("src")) lesson.load();
    }
  }

  get floating() { return this.layout !== "sign-first"; }

  paint() { paintChrome(this); }

  place() {
    const sw = this.stage.clientWidth || 1;
    const sh = this.stage.clientHeight || 1;
    this.stage.classList.toggle("sign-first", !this.floating);
    this.stage.style.minHeight = "";
    if (!this.floating) {
      this.root.style.left = this.root.style.top = this.root.style.width = this.root.style.height = "";
      this.paint();
      this.hooks.moved?.();
      return;
    }
    if (!this.frac) this.frac = toFractions(this.home(sw, sh), sw, sh);
    const box = fromFractions(this.frac, sw, sh);
    this.frac = toFractions(box, sw, sh);
    this.root.classList.toggle("menu-in", box.x + box.w / 2 > sw / 2);
    this.root.style.width = box.w + "px";
    this.root.style.height = box.h + "px";
    this.root.style.left = box.x + "px";
    this.root.style.top = box.y + "px";
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    this.grip.className = "sign-grip grip-" + (cy > sh / 2 ? "t" : "b") + (cx > sw / 2 ? "l" : "r");
    this.paint();
    this.hooks.moved?.();
  }

  home(sw, sh) {
    const lesson = this.stage.querySelector("video:not([data-sign])");
    return defaultPlace(sw, sh, pictureRect(sw, sh, lesson?.videoWidth || sw, lesson?.videoHeight || sh));
  }

  show(src) {
    this.root.hidden = false;
    if (src && this.video.getAttribute("src") !== src) this.video.src = src;
    this.place();
  }

  hide() {
    this.root.hidden = true;
    this.closeMenu(false);
    this.root.querySelectorAll("video").forEach((video) => video.pause());
    this.stage.classList.remove("sign-first");
    this.stage.style.minHeight = "";
  }
}
