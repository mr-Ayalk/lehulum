// FR-PROF-01, FR-PROF-02, FR-PROF-03, FR-PROF-04: Learner choices stored only in localStorage.
const KEY = "db-player:prefs";

export function loadPrefs() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    return {};
  }
}

export function savePrefs(patch) {
  const next = { ...loadPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    /* private mode */
  }
  return next;
}
