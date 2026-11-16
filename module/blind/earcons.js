// FR-CORE-13: Short tones for play, pause, and a description. Skipped when motion is reduced.
export function attachEarcons(player) {
  let ctx = null;

  function tone(freq) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    ctx = ctx || new Context();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const stop = ctx.currentTime + 0.07;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(stop);
  }

  player.on("play", () => { if (!player._describing) tone(660); });
  player.on("pause", () => { if (!player._describing) tone(440); });
  player.on("describe", () => tone(520));
}
