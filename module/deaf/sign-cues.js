// FR-DEAF-05, FR-DEAF-06: Play the sign queue. Hold the lesson only at a cue boundary.
import { SCHEDULE, afterSeek, boundaryOf, catchUpRate, endWait, itemsOf, lagSeconds, playableSegments, segmentAt } from "./sign-schedule.js";
import { attachHold } from "./sign-hold.js";
import { attachPace } from "./sign-pace.js";
import { attachSignPlay } from "./sign-play.js";
import { attachStatus } from "./sign-status.js";

export function attachCueSync(player, win) {
  const media = player.media;
  const params = new URLSearchParams(location.search);
  const demo = params.get("hold") === "demo";
  const state = { segments: [], queue: [], base: "", index: -1, item: 0, front: 0, play: -1, done: -1, wait: true, holding: false, ending: false, told: false, hitTo: false, userPaused: false, userIntent: false, seen: -1, row: null, log: [], holds: [], decided: [], token: 0, clock: 0, stall: 0, failed: false, internal: false, snap: false, lag: 0, maxLag: 0, lagSum: 0, lagN: 0, holdTarget: -1, holdAt: 0, holdStart: 0, signAt: 0, endStart: 0, endWait: 0 };
  const status = attachStatus(player, win, () => hold.skip());
  const play = attachSignPlay(win, state, {
    items: itemsOf, rate: () => catchUpRate(win.rate, state.lag || 0), paused: () => state.userPaused, started: markStart,
    next() { const at = state.queue.indexOf(state.segments[state.index]); return itemsOf(state.queue[at + 1] || null)[0] || null; },
    fail, ended() { if (state.play < 0) return; state.hitTo = true; state.done = state.play; state.play = -1; if (state.row) state.row.reached = true; tick(); }
  });
  const hold = attachHold(player, state, {
    demo, rate: () => catchUpRate(win.rate, state.lag || 0), video: () => play.active(),
    showPill: () => status.showPill(), hidePill: () => status.hidePill(),
    pauseSign: () => { if (state.play >= 0) play.active().pause(); },
    playSign: () => { if (state.play >= 0 && !state.hitTo) play.active().play().catch(() => {}); },
    busy: () => state.play >= 0 && !state.hitTo,
    after: () => pace.resync()
  });
  const pace = attachPace(player, state, {
    signRate: () => win.rate, mode: () => win.pacing || "smooth", video: () => play.active()
  });

  function markStart() {
    if (!state.row || state.row.lag != null) return;
    state.row.startedAt = media.currentTime || 0;
    state.row.lag = Math.max(0, state.row.startedAt - state.row.lessonStart);
  }
  function fail(why) {
    if (state.failed) return;
    state.failed = true;
    console.warn("sign clip failed", why, state.segments[state.index]?.cue || "");
    state.hitTo = true; state.done = state.play; state.play = -1;
    status.showCard();
    if (state.holding) hold.release(false);
  }
  function begin(segment, point) {
    state.failed = false; state.hitTo = false;
    state.index = state.segments.indexOf(segment);
    state.play = state.queue.indexOf(segment);
    state.done = state.play - 1;
    state.item = point ? point.index : 0;
    state.row = { cue: segment.cue, lessonStart: segment.start, startedAt: null, lag: null, hold: 0, reached: false };
    state.log.push(state.row);
    status.hideCard();
    const item = itemsOf(segment)[state.item];
    play.playItem(item, point ? point.time : item.from);
  }
  function tick() {
    if (state.userPaused && !state.holding && !state.ending) return;
    if (media.paused && !state.holding && !state.ending) return;
    const time = media.currentTime || 0;
    const started = state.play >= 0 ? state.play : state.done;
    state.lag = lagSeconds(state.queue, time, started);
    state.maxLag = Math.max(state.maxLag, state.lag);
    state.lagSum += state.lag; state.lagN += 1;
    const here = segmentAt(state.segments, time);
    if (here && (here.source === "none" || here.cue === params.get("missing"))) status.showCard(player.captions?.cueAt(time)?.text || "");
    const busy = state.play >= 0 && !state.hitTo;
    const atEnd = Number.isFinite(media.duration) && time >= media.duration - 0.08;
    if (state.ending) {
      if (!busy) {
        const next = state.queue[state.done + 1];
        if (next && !state.userPaused) begin(next, null);
        else hold.finishEnd();
      } else if (performance.now() - state.endStart >= SCHEDULE.pillAfter * 1000) status.showPill();
      play.applyRate();
      return;
    }
    if (state.wait && endWait(atEnd, busy)) { hold.freezeEnd(); play.applyRate(); return; }
    if (state.play < 0 && !state.userPaused && (state.holding || !media.paused)) {
      const next = state.queue[state.done + 1];
      if (next && time >= next.start) begin(next, null);
    }
    if (state.holding && !state.userPaused && hold.caughtUp()) hold.release(true);
    if (state.holding) { hold.pill(); play.applyRate(); return; }
    if (!state.wait && state.lag > SCHEDULE.maxLag && !media.paused) {
      const landed = afterSeek(state.segments, time);
      if (landed.segment && state.queue.indexOf(landed.segment) !== state.play) { begin(landed.segment, landed.point); return; }
    }
    hold.consider(time);
    pace.enter(time);
    play.applyRate();
  }
  function onSeek() {
    const user = state.userPaused;
    hold.clear();
    if (!demo) status.hidePill();
    const time = media.currentTime || 0;
    state.decided = [];
    state.queue.forEach((segment, index) => {
      if (!index) return;
      const boundary = boundaryOf(state.queue[index - 1], segment);
      if (boundary != null && time > boundary + 0.05) state.decided[index] = true;
    });
    const landed = afterSeek(state.segments, time);
    if (landed.segment) begin(landed.segment, landed.point);
    else {
      state.play = -1; state.hitTo = true;
      let prev = -1;
      state.queue.forEach((segment, index) => { if (segment.start <= time + 1e-3) prev = index; });
      state.done = prev;
      const place = segmentAt(state.segments, time);
      if (place && (place.source === "none" || place.cue === params.get("missing"))) status.showCard(player.captions?.cueAt(time)?.text || "");
    }
    if (user) play.active().pause();
    else if (media.paused) { state.internal = true; media.play().catch(() => {}); state.internal = false; }
    state.paced = "";
    pace.enter(time, true);
    pace.resync();
  }
  function start(src, opts = {}) {
    stop();
    const mine = state.token;
    state.base = String(src).replace(/[^/]*$/, "");
    state.wait = (win.pacing || "smooth") !== "off";
    fetch(src).then((res) => res.json()).then((doc) => {
      if (mine !== state.token) return;
      state.segments = doc.segments || [];
      state.queue = playableSegments(state.segments).filter((segment) => segment.cue !== params.get("missing"));
      state.play = -1; state.done = -1; state.decided = []; state.holds = [];
      const first = itemsOf(state.queue[0])[0];
      if (first) play.load(play.standby(), first);
      if (demo) status.showPill();
      pace.replan({ from: media.currentTime || 0 });
      state.clock = setInterval(tick, 50);
      if (opts.at) onSeek();
      else tick();
    }).catch((error) => console.warn("sign json failed", error));
  }
  function stop() {
    state.token += 1; clearInterval(state.clock); clearTimeout(state.stall);
    hold.clear(); status.hideCard();
    if (!demo) status.hidePill();
    for (const video of [win.video, win.videoB]) video?.pause();
    state.play = -1; state.index = -1;
  }
  media.addEventListener("timeupdate", () => { state.seen = media.currentTime || 0; });
  media.addEventListener("seeking", () => { if (state.snap) return; state.jump = state.play < 0 || Math.abs((media.currentTime || 0) - state.seen) >= 0.08; });
  media.addEventListener("seeked", () => { if (state.snap) { state.snap = false; state.seen = media.currentTime || 0; return; } if (!state.jump) return; state.jump = false; state.seen = media.currentTime || 0; onSeek(); });
  return {
    start, stop, replan() { state.paced = ""; pace.enter(media.currentTime || 0, true); },
    setPace(mode) { state.wait = mode !== "off"; state.paced = ""; if (!state.wait) { hold.release(true); if (state.ending) hold.finishEnd(); } pace.enter(media.currentTime || 0, true); },
    place: () => status.place(), applyRate: () => play.applyRate(), label: () => status.label(),
    get log() { return state.log; }, get holds() { return state.holds; }, get endWait() { return state.endWait; },
    get maxLag() { return state.maxLag; }, get meanLag() { return state.lagN ? state.lagSum / state.lagN : 0; }
  };
}
