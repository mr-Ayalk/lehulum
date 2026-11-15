// FR-DEAF-06: Slow the lesson a little, then hold only for what is still left.
import { boundaryOf, itemsOf, mediaUntil, playableSegments, pointInSegment, segmentAt, signSpan } from "./sign-schedule.js";

export const PACE = { maxLag: 2, minLessonRate: 0.85, minHold: 0.5, step: 0.05 };

function consumed(cue, time) {
  const point = pointInSegment(cue, time);
  if (!point) return 0;
  const items = itemsOf(cue);
  let into = 0;
  for (let index = 0; index < point.index; index += 1) into += Math.max(0, items[index].to - items[index].from);
  into += Math.max(0, point.time - Number(items[point.index].from));
  return Math.min(signSpan(cue), Math.max(0, into));
}

export function plan(segments, opts = {}) {
  const signRate = opts.signRate > 0 ? opts.signRate : 1;
  const maxLag = opts.maxLag ?? PACE.maxLag;
  const minRate = opts.minLessonRate ?? PACE.minLessonRate;
  const minHold = opts.minHold ?? PACE.minHold;
  const mode = opts.mode || "smooth";
  const from = Math.max(0, Number(opts.from) || 0);
  const cues = playableSegments(segments);
  const rates = cues.map(() => 1);
  const edgeOf = (index) => (index + 1 < cues.length ? boundaryOf(cues[index], cues[index + 1]) : cues[index].end);

  function play(useRates) {
    let wall = 0;
    let lesson = 0;
    let signerFree = 0;
    let seekUsed = false;
    const rows = cues.map((cue, index) => {
      const edge = edgeOf(index);
      if (edge <= from + 1e-4) return { cue: cue.cue, lessonRate: 1, holdAfter: 0, lag: 0 };
      if (lesson < Math.max(cue.start, from)) { wall += Math.max(cue.start, from) - lesson; lesson = Math.max(cue.start, from); }
      const back = !seekUsed ? Math.max(0, Number(opts.backlog) || 0) : 0;
      const partial = !seekUsed && (back > 0 || from > cue.start + 1e-3);
      let lag;
      if (partial) {
        const into = from > cue.start + 1e-3 ? (opts.into != null ? Number(opts.into) : consumed(cue, from)) : 0;
        lag = back / signRate;
        signerFree = wall + (back + Math.max(0, signSpan(cue) - into)) / signRate;
        seekUsed = true;
      } else {
        const signerStart = Math.max(signerFree, wall);
        lag = Math.max(0, signerStart - wall);
        signerFree = signerStart + signSpan(cue) / signRate;
      }
      const span = Math.max(0, edge - lesson);
      const rate = mode === "smooth" ? useRates(index, wall, signerFree, span) : 1;
      const remain = signerFree - wall - maxLag - span / Math.max(rate, 0.05);
      const holdAfter = mode !== "off" && remain >= minHold - 1e-9 ? remain : 0;
      wall += span / Math.max(rate, 0.05) + holdAfter;
      lesson = edge;
      return { cue: cue.cue, lessonRate: rate, holdAfter, lag };
    });
    rows.wall = wall;
    return rows;
  }

  if (mode === "smooth") {
    const greedy = play((index, wall, signerFree, span) => {
      const need = signerFree - wall - maxLag;
      if (!(need > span)) return 1;
      let rate = Math.max(minRate, Math.min(1, span / need));
      let remain = need - span / rate;
      if (remain > 0.2 && remain < minHold && span / (need - 0.2) >= minRate) rate = Math.max(minRate, span / (need - 0.2));
      return rate;
    });
    greedy.forEach((row, index) => { rates[index] = row.lessonRate; });
    for (let pass = 0; pass < cues.length; pass += 1) {
      for (let index = 0; index < cues.length - 1; index += 1) {
        if (rates[index + 1] > rates[index] + PACE.step) rates[index + 1] = Math.max(minRate, rates[index] + PACE.step);
        if (rates[index] > rates[index + 1] + PACE.step) rates[index] = Math.max(minRate, rates[index + 1] + PACE.step);
      }
    }
  }
  return play((index) => rates[index]);
}

export function attachPace(player, state, hooks) {
  const media = player.media;
  const order = [1, 0.85, 0.75];
  state.userRate = order.includes(media.playbackRate) ? media.playbackRate : 1;
  state.rows = [];
  state.paced = "";
  state.paceTold = false;
  const note = document.createElement("span");
  note.dataset.paceNote = "1";
  note.setAttribute("role", "status");
  note.hidden = true;
  player.shadow.querySelector("[data-id=speed]")?.after(note);
  function near(time) {
    return (state.segments || []).some((cue) => Math.abs(time - cue.start) <= 0.15 || Math.abs(time - cue.end) <= 0.15);
  }
  function resync() {
    player.captions?.refresh?.();
    if (!media.requestVideoFrameCallback) return;
    media.requestVideoFrameCallback((now, meta) => {
      const drift = Math.abs((meta.mediaTime ?? media.currentTime) - (media.currentTime || 0));
      if (drift <= 0.1 || !near(media.currentTime || 0)) return;
      const time = media.currentTime;
      state.snap = true;
      media.currentTime = time;
      setTimeout(() => { if (state.snap && Math.abs((media.currentTime || 0) - time) < 0.001) state.snap = false; }, 300);
    });
  }
  function place(time) {
    const spoken = segmentAt(state.queue, time);
    const index = state.queue.indexOf(spoken);
    const started = state.play >= 0 ? state.play : state.done;
    const video = hooks.video();
    const item = itemsOf(state.queue[state.play] || null)[state.item];
    const into = item && video ? Math.max(0, Math.min(item.to - item.from, (video.currentTime || 0) - item.from)) : 0;
    const backlog = index > started && started >= 0 ? mediaUntil(state.queue, started, state.play >= 0 ? into : signSpan(state.queue[started]), index) : 0;
    return { from: time, backlog, into: started === index ? into : 0 };
  }
  function replan(extra) {
    state.rows = plan(state.queue, { signRate: hooks.signRate(), mode: hooks.mode(), ...(extra || {}) });
  }
  function paintNote(rate) {
    const show = hooks.mode() === "smooth" && rate < 0.95;
    note.hidden = !show;
    if (!show) return;
    note.textContent = player.t("paced_for_signer");
    if (!state.paceTold) { player.announce("paced_for_signer"); state.paceTold = true; }
  }
  function setRate(multiplier) {
    const next = state.userRate * multiplier;
    paintNote(multiplier);
    if (Math.abs((media.playbackRate || 1) - next) >= 0.008) {
      state.ownRate = true;
      media.preservesPitch = media.webkitPreservesPitch = true;
      media.playbackRate = next;
    }
    resync();
  }
  function apply(cue) {
    if (!cue) return;
    state.paced = cue.cue;
    const row = state.rows.find((item) => item.cue === cue.cue);
    setRate(hooks.mode() === "smooth" ? (row?.lessonRate || 1) : 1);
  }
  function enter(time, force) {
    const spoken = segmentAt(state.segments, time);
    if (!spoken || spoken.source === "none") return;
    if (!force && spoken.cue === state.paced) return;
    replan(place(time));
    apply(spoken);
  }
  player.cycleRate = () => {
    state.userRate = order[(Math.max(0, order.indexOf(state.userRate)) + 1) % order.length];
    state.paced = "";
    enter(media.currentTime || 0, true);
    player.emit("ratechange", { rate: state.userRate });
    player.announce("speed", { value: state.userRate + "×" });
    player._paintAll();
  };
  const paint = player._paint.bind(player);
  player._paint = (entry) => {
    paint(entry);
    if (entry.id !== "speed") return;
    entry.el.dataset.rate = state.userRate + "×";
    entry.el.setAttribute("aria-label", player.t("speed", { value: state.userRate + "×" }));
  };
  media.addEventListener("ratechange", (event) => { if (!state.ownRate) return; state.ownRate = false; event.stopImmediatePropagation(); }, true);
  return { enter, replan, resync, note };
}
