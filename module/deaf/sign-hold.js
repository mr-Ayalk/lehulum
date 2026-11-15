// FR-DEAF-06: Pause the lesson at a cue boundary without pausing the signer.
import { SCHEDULE, afterSkip, boundaryOf, countsAsHold, holdDecision, pauseAffectsSigner } from "./sign-schedule.js";

export function attachHold(player, state, hooks) {
  const media = player.media;
  const rawPause = media.pause.bind(media);
  const rawPlay = media.play.bind(media);
  const rawToggle = player.toggle.bind(player);
  player.state = player.state || {};

  function signerAt() { return state.play >= 0 ? state.play : state.done; }
  function stillBehind() { return signerAt() < state.holdSegment; }
  function paint(showPlay) {
    const button = player.shadow.querySelector("[data-id=play]");
    if (!button) return;
    button.dataset.state = showPlay ? "play" : "pause";
    button.textContent = player.t(showPlay ? "play" : "pause");
  }
  function release(record) {
    if (!state.holding) return;
    const held = (performance.now() - state.holdStart) / 1000;
    if (record && countsAsHold("boundary")) {
      const prev = state.queue[state.holdTarget - 1];
      const next = state.queue[state.holdTarget];
      state.holds.push({ from: prev?.cue || "", to: next?.cue || "", at: state.holdAt, length: held, signer: state.signerCue || "", signStart: state.signAt, signEnd: hooks.video()?.currentTime || 0 });
    }
    const resume = !state.userPaused && media.paused;
    state.ownPlay = !!resume;
    state.internal = true;
    if (resume) rawPlay().catch(() => {});
    player.state.holding = false;
    state.holding = false;
    state.internal = false;
    if (!state.ending && !hooks.demo) hooks.hidePill();
    if (resume) paint(false);
    hooks.after?.();
  }
  function startHold(index, boundary) {
    const over = (media.currentTime || 0) - boundary;
    if (over > 0.02 && over < 0.3) { state.snap = true; media.currentTime = boundary; }
    state.holdTarget = index;
    state.holdAt = media.currentTime || boundary;
    state.holdStart = performance.now();
    state.signAt = hooks.video()?.currentTime || 0;
    state.pillOn = false;
    player.state.holding = true;
    state.holding = true;
    state.userIntent = false;
    state.internal = true;
    if (!media.paused) rawPause();
    state.internal = false;
  }
  function pill() {
    if (state.pillOn || performance.now() - state.holdStart < SCHEDULE.pillAfter * 1000) return;
    state.pillOn = true;
    hooks.showPill();
    if (!state.told) { player.announce("sign_waiting_first"); state.told = true; }
  }
  function freezeEnd() {
    if (state.ending || hooks.demo || !state.wait) return;
    state.ending = true;
    state.endStart = performance.now();
    state.internal = true;
    if (!media.paused) rawPause();
    state.internal = false;
  }
  function finishEnd() {
    if (!state.ending) return;
    state.endWait = (performance.now() - state.endStart) / 1000;
    state.ending = false;
    if (!hooks.demo) hooks.hidePill();
    if (state.userPaused) return;
    state.ownPlay = true;
    state.internal = true;
    const tail = Number.isFinite(media.duration) ? media.duration - (media.currentTime || 0) : 1;
    if (tail < 0.05) { state.snap = true; media.currentTime = Math.max(0, media.duration - 0.15); }
    rawPlay().catch(() => {});
    state.internal = false;
    hooks.after?.();
  }
  function consider(time) {
    if (hooks.demo || !state.wait || state.holding || state.ending || media.paused) return;
    const started = signerAt();
    for (let index = 1; index < state.queue.length; index += 1) {
      if (state.decided[index]) continue;
      const boundary = boundaryOf(state.queue[index - 1], state.queue[index]);
      if (boundary == null || time + 0.03 < boundary) break;
      if (boundary < 3 || time > boundary + 0.12) { state.decided[index] = true; continue; }
      state.decided[index] = true;
      if (!holdDecision({ wait: true, time, boundary, started, segment: index - 1 })) break;
      state.holdSegment = index - 1;
      state.signerCue = state.queue[started]?.cue || "";
      startHold(index, boundary);
      break;
    }
  }
  function skip() {
    if (state.ending) { state.userPaused = false; finishEnd(); return; }
    if (state.holdTarget >= 0) state.decided[state.holdTarget] = true;
    state.userPaused = false;
    if (!afterSkip().holding) release(true);
  }
  function clear() {
    state.holding = false;
    state.ending = false;
    player.state.holding = false;
  }
  media.pause = () => {
    if ((state.holding || state.ending) && !state.internal && !state.userPaused) {
      state.userPaused = true;
      hooks.pauseSign();
      paint(true);
      return;
    }
    rawPause();
  };
  player.toggle = () => {
    if ((state.holding || state.ending) && !state.userPaused) {
      state.userPaused = true;
      hooks.pauseSign();
      paint(true);
      return;
    }
    state.userIntent = true;
    rawToggle();
  };
  media.addEventListener("pause", (event) => {
    const quiet = state.internal || state.ownPlay || state.ending || state.holding || !!player.state.holding;
    if (!pauseAffectsSigner({ holding: quiet, userAction: state.userIntent && !quiet })) { event.stopImmediatePropagation(); return; }
    state.userIntent = false;
    state.userPaused = true;
    hooks.pauseSign();
  }, true);
  media.addEventListener("play", (event) => {
    if (state.internal || state.ownPlay) { state.ownPlay = false; event.stopImmediatePropagation(); return; }
    state.userIntent = false;
    state.userPaused = false;
    hooks.playSign();
    const keep = state.ending ? hooks.busy() : state.holding && stillBehind();
    if ((state.holding || state.ending) && keep) {
      event.stopImmediatePropagation();
      state.internal = true;
      if (state.holding) player.state.holding = true;
      rawPause();
      state.internal = false;
      paint(false);
    }
  }, true);
  return { consider, release, freezeEnd, finishEnd, skip, clear, pill, caughtUp: () => !stillBehind() };
}
