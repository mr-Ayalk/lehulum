// C-07, FR-CORE-06, NFR-ETH-01, NFR-ETH-05: Load strings, fill {placeholders}, and speak times.
let strings = {};

async function read(code) {
  const url = new URL("../i18n/" + code + ".json", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(code);
  return response.json();
}

export async function loadStrings(lang) {
  const code = lang === "am" ? "am" : "en";
  const english = await read("en");
  strings = code === "en" ? english : { ...english, ...(await read(code)) };
  return strings;
}

export function t(key, vars) {
  const text = Object.prototype.hasOwnProperty.call(strings, key) ? String(strings[key]) : key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  const parts = [];
  if (minutes) parts.push(minutes + " " + t(minutes === 1 ? "minute" : "minutes"));
  if (secs || !minutes) parts.push(secs + " " + t(secs === 1 ? "second" : "seconds"));
  return parts.join(" ");
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  if (hours) return hours + ":" + String(minutes).padStart(2, "0") + ":" + secs;
  return minutes + ":" + secs;
}
