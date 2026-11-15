// NFR-A11Y-01: Language, display theme, mobile menu, and copy for the demo pages.
const THEME = { light: ["Light", "ብሩህ"], dark: ["Dark", "ጨለማ"], contrast: ["High contrast", "ከፍተኛ ንፅፅር"] };
const order = ["light", "dark", "contrast"];

function paintTheme() {
  const button = document.getElementById("theme");
  if (!button) return;
  const name = document.documentElement.dataset.theme || "light";
  const am = document.documentElement.lang === "am";
  button.textContent = THEME[name][am ? 1 : 0];
  button.lang = am ? "am" : "en";
  button.setAttribute("aria-label", (am ? "ማሳያ፦ " : "Display: ") + THEME[name][am ? 1 : 0]);
}

if (!document.documentElement.dataset.theme) {
  const storedTheme = localStorage.getItem("db-demo:theme");
  if (order.includes(storedTheme)) document.documentElement.dataset.theme = storedTheme;
}
const saved = localStorage.getItem("db-demo:lang");
const asked = new URLSearchParams(location.search).get("lang");
document.documentElement.lang = asked === "am" || asked === "en" ? asked : (saved === "am" ? "am" : "en");
paintTheme();

document.getElementById("lang")?.addEventListener("click", () => {
  const next = document.documentElement.lang === "am" ? "en" : "am";
  document.documentElement.lang = next;
  localStorage.setItem("db-demo:lang", next);
  paintTheme();
});

document.getElementById("theme")?.addEventListener("click", () => {
  const now = document.documentElement.dataset.theme || "light";
  const next = order[(order.indexOf(now) + 1) % order.length];
  document.documentElement.dataset.theme = next;
  localStorage.setItem("db-demo:theme", next);
  paintTheme();
});

document.getElementById("menu")?.addEventListener("click", () => {
  const nav = document.getElementById("nav-menu");
  const open = nav.hidden;
  nav.hidden = !open;
  document.getElementById("menu").setAttribute("aria-expanded", open ? "true" : "false");
});

document.getElementById("copy")?.addEventListener("click", async () => {
  const code = document.getElementById("install").textContent;
  try { await navigator.clipboard.writeText(code); } catch (error) { return; }
  const status = document.getElementById("copied");
  status.textContent = document.documentElement.lang === "am" ? "ተቀድቷል" : "Copied";
});
