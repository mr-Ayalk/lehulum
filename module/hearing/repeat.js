// FR-HOH-06: Replay the caption line that just played.
export function attachRepeat(player) {
  let lastAt = 0;

  function target(slow) {
    const lang = player.captions?.currentLang() || "am";
    const list = player.captions?.getCues(lang) || [];
    const now = player.media.currentTime || 0;
    let cue = list.find((item) => now >= item.start && now < item.end) || list[0];
    if (cue && now - cue.start < 0.5) {
      const index = list.indexOf(cue);
      cue = list[Math.max(0, index - 1)];
    }
    if (!cue) return;
    player.media.currentTime = Math.max(0, cue.start);
    if (slow) {
      player.media.playbackRate = 0.75;
      player.media.preservesPitch = player.media.webkitPreservesPitch = true;
    }
    player.media.play().catch(() => {});
    if (cue.sounds?.length) player.announce("again");
  }

  player.addControl({
    id: "again", order: 46, labelKey: "again",
    onClick: () => {
      const now = Date.now();
      const slow = now - lastAt < 900;
      lastAt = now;
      target(slow);
    }
  });
  player.registerShortcut("r", "key_r", () => player.shadow.querySelector("[data-id='again']")?.click());
}
