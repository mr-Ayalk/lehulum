// FR-HOH-06: Replay a caption from just before it started, then step back.
export function attachRepeat(player) {
  let lastAt = 0;
  let back = 0;
  let hold = 0;
  let slowNext = false;

  function list() {
    const lang = player.captions?.currentLang() || player.host.getAttribute("lang") || "am";
    return player.captions?.getCues(lang) || player.captions?.getCues("en") || [];
  }

  function target(slow) {
    const cues = list();
    if (!cues.length) return;
    const now = player.media.currentTime || 0;
    let index = cues.findIndex((item) => now >= item.start && now < item.end);
    if (index < 0) index = cues.findLastIndex((item) => item.start <= now);
    if (index < 0) index = 0;
    const stamp = Date.now();
    back = stamp - lastAt < 2000 ? back + 1 : 0;
    lastAt = stamp;
    const cue = cues[Math.max(0, index - back)];
    player.media.currentTime = Math.max(0, cue.start - 0.2);
    if (slow) {
      player.media.playbackRate = 0.75;
      player.media.preservesPitch = player.media.webkitPreservesPitch = true;
    }
    const box = player.shadow.querySelector(".captions");
    if (box) {
      const previous = box.style.fontSize;
      box.style.fontSize = "1.8rem";
      window.setTimeout(() => { box.style.fontSize = previous; }, Math.max(1200, (cue.end - cue.start) * 1000));
    }
    player.media.play().catch(() => {});
    player.announce("again");
  }

  const button = player.addControl({
    id: "again", order: 46, labelKey: "again",
    onClick: () => { const slow = slowNext; slowNext = false; target(slow); }
  });
  button.addEventListener("pointerdown", () => { hold = window.setTimeout(() => { slowNext = true; }, 500); });
  button.addEventListener("pointerup", () => window.clearTimeout(hold));
  button.addEventListener("pointerleave", () => window.clearTimeout(hold));
  player.shadow.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r" && event.shiftKey) slowNext = true;
  }, true);
  player.registerShortcut("r", "key_r", () => button.click());
}
