// FR-DEAF-05: Two alternating sign videos, each played from its in-point to its out-point.

export function attachSignPlay(win, state, hooks) {
  function pair() {
    if (!win.videoB) {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("aria-hidden", "true");
      video.dataset.sign = "1";
      video.style.visibility = "hidden";
      win.video.after(video);
      win.videoB = video;
      for (const node of [win.video, video]) watch(node);
    }
    return [win.video, win.videoB];
  }
  function active() { return pair()[state.front] || pair()[0]; }
  function standby() { const nodes = pair(); return nodes[1 - nodes.indexOf(active())]; }
  function items(segment) { return hooks.items(segment); }
  function current() { return items(state.segments[state.index] || null)[state.item] || null; }
  function upcoming() {
    const list = items(state.segments[state.index] || null);
    if (state.item + 1 < list.length) return list[state.item + 1];
    return hooks.next?.() || null;
  }
  function applyRate() {
    const rate = hooks.rate();
    for (const video of pair()) if (Math.abs(video.playbackRate - rate) > 0.01) video.playbackRate = rate;
  }
  function load(video, item, at) {
    const url = state.base + item.src;
    const target = Number(at == null ? item.from : at);
    video.preload = "auto";
    const seek = () => { if (Math.abs((video.currentTime || 0) - target) > 0.04) video.currentTime = target; };
    if (video.getAttribute("src") !== url) { video.src = url; video.addEventListener("loadedmetadata", seek, { once: true }); }
    else if (video.readyState >= 1) seek();
  }
  function playItem(item, at) {
    const nodes = pair();
    const url = state.base + item.src;
    const video = nodes.find((node) => node.getAttribute("src") === url) || active();
    state.front = nodes.indexOf(video);
    const other = nodes[1 - state.front];
    state.armed = false;
    state.want = at;
    load(video, item, at);
    const go = () => {
      if (Math.abs((video.currentTime || 0) - at) > 0.04) video.currentTime = at;
      else state.armed = true;
      applyRate();
      const show = () => { video.style.visibility = "visible"; video.style.zIndex = "1"; other.style.visibility = "hidden"; other.style.zIndex = "0"; };
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => show());
      else show();
      video.addEventListener("playing", () => hooks.started(), { once: true });
      clearTimeout(state.stall);
      state.stall = setTimeout(() => hooks.fail("stall"), 4000);
      if (hooks.paused()) { show(); return; }
      video.play().catch(() => {});
    };
    if (video.readyState >= 1 && video.getAttribute("src") === url) go();
    else video.addEventListener("loadedmetadata", go, { once: true });
    const next = upcoming();
    if (next) load(other, next);
    else other.preload = "none";
  }
  function watch(video) {
    function reached() {
      const item = current();
      if (!item || video !== active()) return false;
      if (video.ended || video.currentTime + 0.02 >= item.to) return true;
      const dur = video.duration;
      return Number.isFinite(dur) && item.to >= dur - 0.05 && video.currentTime >= dur - 0.08;
    }
    function finish() {
      if (state.hitTo || !reached()) return;
      clearTimeout(state.stall);
      video.pause();
      const list = items(state.segments[state.index]);
      if (state.item + 1 < list.length) { state.item += 1; playItem(list[state.item], list[state.item].from); return; }
      hooks.ended();
    }
    video.addEventListener("seeked", () => {
      if (video === active() && Math.abs((video.currentTime || 0) - state.want) < 0.2) state.armed = true;
    });
    const step = () => {
      if (!state.armed || video !== active()) return;
      if (reached()) { finish(); return; }
      if (video.requestVideoFrameCallback && !video.paused) video.requestVideoFrameCallback(() => step());
    };
    video.addEventListener("timeupdate", () => {
      if (video === active() && !video.paused) {
        const now = video.currentTime || 0;
        if (Math.abs(now - (state.stamp || -1)) > 0.02) {
          state.stamp = now;
          clearTimeout(state.stall);
          state.stall = setTimeout(() => hooks.fail("stall"), 4000);
        }
      }
      step();
    });
    video.addEventListener("playing", () => step());
    video.addEventListener("ended", () => finish());
    video.addEventListener("error", () => { if (video === active()) hooks.fail("load"); });
  }
  return { pair, active, standby, load, playItem, applyRate };
}
