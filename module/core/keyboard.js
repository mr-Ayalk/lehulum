// FR-CORE-10, FR-CORE-11, FR-CORE-12: Shortcuts only while focus is inside the player.
const STORE = "db-player:shortcuts";

function saved() {
  try {
    return localStorage.getItem(STORE) !== "off";
  } catch (error) {
    return true;
  }
}

export function createKeyboard(root, actions) {
  const items = [];
  let enabled = saved();

  function registerShortcut(key, labelKey, fn) {
    const keys = (Array.isArray(key) ? key : [key]).map((item) => item.toLowerCase());
    items.push({ keys, labelKey, fn });
  }

  function onKey(event) {
    if (event.target !== root && !root.contains(event.target)) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const target = event.target;
    const tag = target.tagName;
    if (tag === "TEXTAREA" || target.isContentEditable) return;
    if (tag === "INPUT" && target.type !== "range") return;
    if ((event.key === " " || event.key === "Enter") && target.closest("button")) return;
    if (target.classList.contains("seek") && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
    if (target.closest && target.closest(".sign-window") && (event.key.startsWith("Arrow") || event.key === "+" || event.key === "-" || event.key === "=" || event.key === "Enter" || event.key === "Escape")) return;
    if (!enabled) return;
    const hits = items.filter((item) => item.keys.includes(event.key.toLowerCase()));
    const hit = hits[hits.length - 1];
    if (!hit) return;
    event.preventDefault();
    hit.fn();
  }

  registerShortcut([" ", "k"], "key_space_k", actions.playPause);
  registerShortcut(["arrowleft", "j"], "key_left_j", actions.back);
  registerShortcut(["arrowright", "l"], "key_right_l", actions.forward);
  registerShortcut("m", "key_m", actions.mute);
  registerShortcut("f", "key_f", actions.fullscreen);
  registerShortcut("?", "key_question", actions.help);
  root.addEventListener("keydown", onKey);

  return {
    registerShortcut,
    items: () => items,
    get enabled() {
      return enabled;
    },
    setEnabled(value) {
      enabled = !!value;
      try {
        localStorage.setItem(STORE, enabled ? "on" : "off");
      } catch (error) {
        /* private mode */
      }
    },
    destroy() {
      root.removeEventListener("keydown", onKey);
    }
  };
}
