// FR-DEAF-02, FR-DEAF-04: Keyboard, More menu, and single-pointer alternatives to dragging.
import { fromFractions, resizeScale, toFractions } from "./sign-geometry.js";
import { PLACES } from "./sign-chrome.js";

export function bindSignKeys(win) {
  Object.assign(win, {
    tap() {
      this.root.classList.toggle("show-ui");
      if (!this.root.classList.contains("show-ui")) this.closeMenu(false);
      this.arm();
    },
    arm() {
      clearTimeout(this.timer);
      if (!this.root.classList.contains("show-ui")) return;
      this.timer = setTimeout(() => {
        if (this.root.matches(":focus-within")) return;
        this.root.classList.remove("show-ui");
        this.closeMenu(false);
      }, 3000);
    },
    openMenu() {
      this.menu.hidden = false;
      this.more.setAttribute("aria-expanded", "true");
      this.root.classList.add("show-ui");
      this.menu.querySelector("[role=menuitem]")?.focus();
    },
    closeMenu(back) {
      this.menu.hidden = true;
      this.more.setAttribute("aria-expanded", "false");
      if (back) this.more.focus();
    },
    act(id) {
      if (id === "smooth" || id === "pause" || id === "off") {
        this.pacing = id;
        this.wait = id !== "off";
        this.paint();
        this.hooks.pace?.(id);
        this.hooks.announce?.("pacing_changed", { mode: this.hooks.t(id === "smooth" ? "pacing_smooth" : id === "pause" ? "pacing_pause" : "pacing_off") });
        return;
      }
      if (id === "larger" || id === "smaller") this.resize(id === "larger" ? 1 : -1);
      else if (id === "opacity") this.fade();
      else if (id === "speed") this.hooks.speed?.();
      else this.jump(id);
    },
    resize(direction) {
      this.frac = this.frac || { x: 0.6, y: 0.2, w: 0.32 };
      const next = resizeScale(this.frac.w, direction);
      if (next === this.frac.w) return;
      this.frac.w = next;
      this.userPlaced = true;
      this.place();
      this.hooks.announce?.(direction > 0 ? "sign_larger" : "sign_smaller");
      this.hooks.save?.();
    },
    fade() {
      this.opacity = { 1: 0.8, 0.8: 0.6, 0.6: 1 }[this.opacity] || 1;
      this.paint();
      this.hooks.announce?.("opacity_value", { value: Math.round(this.opacity * 100) + "%" });
      this.hooks.save?.();
    },
    jump(id) {
      const sw = this.stage.clientWidth || 1;
      const sh = this.stage.clientHeight || 1;
      const box = fromFractions(this.frac || { x: 0, y: 0, w: 0.32 }, sw, sh);
      const x = id[1] === "r" ? sw - box.w : 0;
      const y = id[0] === "b" ? sh - box.h : 0;
      this.frac = toFractions({ x, y, w: box.w, h: box.h }, sw, sh);
      this.userPlaced = true;
      this.place();
      const place = PLACES.find((row) => row[0] === id);
      this.hooks.announce?.("sign_moved", { place: this.hooks.t(place[1]) });
      this.hooks.save?.();
    },
    keys(event) {
      if (event.target !== this.root) return;
      if (event.key === "Enter") { this.openMenu(); event.preventDefault(); event.stopPropagation(); return; }
      if (event.key === "Escape") { this.closeMenu(false); event.preventDefault(); event.stopPropagation(); return; }
      if (!this.floating) return;
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (step) this.nudge(step[0], step[1], event.shiftKey);
      else if (event.key === "+" || event.key === "=") this.resize(1);
      else if (event.key === "-") this.resize(-1);
      else return;
      event.preventDefault();
      event.stopPropagation();
    },
    nudge(dx, dy, shift) {
      const sw = this.stage.clientWidth || 1;
      const sh = this.stage.clientHeight || 1;
      this.frac = this.frac || toFractions(this.home(sw, sh), sw, sh);
      this.frac.x += dx * (shift ? 0.1 : 0.02);
      this.frac.y += dy * (shift ? 0.1 : 0.02);
      this.userPlaced = true;
      this.place();
      this.hooks.announce?.("sign_moved", { place: this.hooks.t("sign_window") });
      this.hooks.save?.();
    },
    menuKeys(event) {
      const items = [...this.menu.querySelectorAll("[role^=menuitem]")];
      const index = items.indexOf(event.target);
      if (event.key === "Escape") { this.closeMenu(true); event.preventDefault(); event.stopPropagation(); return; }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      event.stopPropagation();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : index + (event.key === "ArrowDown" ? 1 : -1);
      items[(next + items.length) % items.length].focus();
    }
  });
}
