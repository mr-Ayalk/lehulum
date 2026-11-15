// FR-CORE-08: One polite live region. Repeating the same words is still spoken.
const timers = new WeakMap();

export function announce(root, text) {
  const region = root.querySelector("[aria-live]");
  if (!region) return;
  clearTimeout(timers.get(region));
  region.textContent = "";
  timers.set(region, setTimeout(() => {
    region.textContent = text;
  }, 100));
}
