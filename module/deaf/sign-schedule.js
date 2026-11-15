// FR-DEAF-05, FR-DEAF-06: Queue the signer. Hold the lesson only at a cue boundary.
export const SCHEDULE = { maxLag: 3, catchUpLag: 0.8, catchUp: 1.1, pillAfter: 0.6, minHold: 0.5 };

export function signMode(src) {
  return /\.json(?:$|[?#])/i.test(String(src || "")) ? "cues" : "continuous";
}

export function itemsOf(segment) {
  if (!segment || segment.source === "none") return [];
  if (segment.playlist && segment.playlist.length) return segment.playlist;
  if (segment.src) return [{ src: segment.src, from: Number(segment.from) || 0, to: Number(segment.to) }];
  return [];
}

export function segmentAt(segments, time) {
  let found = null;
  for (const segment of segments || []) {
    if (time + 1e-3 >= segment.start) found = segment;
    else break;
  }
  return found;
}

export function pointInSegment(segment, lessonTime) {
  const items = itemsOf(segment);
  if (!items.length) return null;
  const span = Math.max(0.001, segment.end - segment.start);
  const lengths = items.map((item) => Math.max(0, Number(item.to) - Number(item.from)));
  const total = lengths.reduce((sum, length) => sum + length, 0) || 0.001;
  const frac = Math.min(1, Math.max(0, (lessonTime - segment.start) / span));
  let remain = frac * total;
  for (let index = 0; index < items.length; index += 1) {
    if (remain <= lengths[index] + 1e-6 || index === items.length - 1) {
      const time = Number(items[index].from) + Math.min(Math.max(0, remain), lengths[index]);
      return { index, time };
    }
    remain -= lengths[index];
  }
  return { index: 0, time: Number(items[0].from) || 0 };
}

export function playableSegments(segments) {
  return (segments || []).filter((segment) => segment && segment.source !== "none" && itemsOf(segment).length);
}

export function signSpan(segment) {
  return itemsOf(segment).reduce((sum, item) => sum + Math.max(0, Number(item.to) - Number(item.from)), 0);
}

export function queueStart(segments, index, previousDoneAt) {
  const segment = segments[index];
  if (!segment) return 0;
  if (index <= 0 || previousDoneAt == null) return segment.start;
  return Math.max(segment.start, previousDoneAt);
}

export function dueIndex(segments, lessonTime, started) {
  for (let index = started + 1; index < (segments || []).length; index += 1) {
    if (lessonTime + 1e-3 >= segments[index].start) return index;
  }
  return -1;
}

export function lagSeconds(segments, lessonTime, started) {
  const index = dueIndex(segments, lessonTime, started);
  if (index < 0) return 0;
  return Math.max(0, lessonTime - segments[index].start);
}

export function boundaryOf(prev, next) {
  if (!prev || !next) return null;
  return next.start > prev.end + 0.02 ? prev.end : next.start;
}

export function mediaUntil(cues, started, into, target) {
  if (!cues?.length || target <= 0) return 0;
  let remain = 0;
  let from = Math.max(0, started + 1);
  if (started >= 0 && started < target) {
    const span = signSpan(cues[started]);
    if (into < span - 1e-6) remain += Math.max(0, span - into);
    else from = started + 1;
  }
  for (let index = from; index < target && index < cues.length; index += 1) remain += signSpan(cues[index]);
  return remain;
}

export function holdDecision({ wait, time, boundary, started, segment }) {
  if (!wait || boundary == null || time < 3 || boundary < 3) return false;
  if (time + 1e-3 < boundary || Math.abs(time - boundary) > 0.1) return false;
  return started < segment;
}

export function pauseAffectsSigner({ holding, userAction }) {
  return !holding || !!userAction;
}

export function afterSkip() {
  return { holding: false };
}

export function countsAsHold(kind) {
  return kind === "boundary";
}

export function catchUpRate(signRate, lag) {
  const base = Number(signRate) || 1;
  const rate = lag > SCHEDULE.catchUpLag ? base * SCHEDULE.catchUp : base;
  return Math.min(rate, base * SCHEDULE.catchUp);
}

export function endWait(lessonEnded, signerBusy) {
  return !!(lessonEnded && signerBusy);
}

export function afterSeek(segments, time) {
  const segment = segmentAt(segments, time);
  const queue = playableSegments(segments);
  const playable = segment && queue.includes(segment);
  return { segment: playable ? segment : null, lag: 0, point: playable ? pointInSegment(segment, time) : null };
}
