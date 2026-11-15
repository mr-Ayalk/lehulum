// FR-DEAF-05: Map lesson time onto a continuous sign video, skipping its idle head.
const RATES = [1, 0.85, 0.75];

export function nextRate(current) {
  const index = RATES.indexOf(Number(current));
  return RATES[(index + 1) % RATES.length];
}

export function fragmentOffset(src) {
  const match = /[#&]t=([0-9.]+)/.exec(String(src || ""));
  return match ? Number(match[1]) : 0;
}

export function mapSignTime(lessonTime, offset, cueStart, signRate) {
  const start = Number(cueStart) || 0;
  if (lessonTime < start) return offset;
  return Math.max(offset, offset + (lessonTime - start) * (Number(signRate) || 1));
}

export function attachSignSync(player, getVideo, getRate) {
  const media = player.media;
  let timer = 0;

  function node() {
    const video = getVideo();
    return video && video.getAttribute("src") ? video : null;
  }

  function target(video) {
    const cues = player.captions?.getCues?.("am") || player.captions?.getCues?.() || [];
    const cueStart = cues.length ? cues[0].start : 0.781;
    return mapSignTime(media.currentTime || 0, fragmentOffset(video.getAttribute("src")), cueStart, getRate());
  }

  function copy(force) {
    const video = node();
    if (!video) return;
    const speed = (media.playbackRate || 1) * (Number(getRate()) || 1);
    if (Math.abs(video.playbackRate - speed) > 0.01) video.playbackRate = speed;
    const next = target(video);
    if (force || Math.abs((video.currentTime || 0) - next) > 0.3) video.currentTime = next;
  }

  function follow() {
    copy(true);
    const video = node();
    if (!video) return;
    if (media.paused) video.pause();
    else video.play().catch(() => {});
  }

  function start() {
    follow();
    if (!timer) timer = setInterval(() => copy(false), 1000);
  }

  function stop() {
    clearInterval(timer);
    timer = 0;
    node()?.pause();
  }

  for (const type of ["play", "pause", "seeked", "ratechange"]) media.addEventListener(type, follow);
  return { start, stop, follow };
}
