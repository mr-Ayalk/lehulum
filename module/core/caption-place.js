// FR-CAP-02, FR-DEAF-02: Keep captions on the visible lesson picture, clear of the signer.
import { captionSpot, intersects, pictureRect } from "../deaf/sign-geometry.js";

function park(player, box) {
  box.dataset.pos = "below";
  box.style.position = "static";
  box.style.left = box.style.top = box.style.bottom = box.style.width = box.style.height = "";
  if (box.parentElement !== player.slots.below) player.slots.below.append(box);
}

function shift(rect, frame) {
  return { x: frame.x + rect.x, y: frame.y + rect.y, w: rect.w, h: rect.h };
}

export function layoutChip(player, box) {
  const stage = player.shadow.querySelector(".stage");
  const lesson = stage?.querySelector("video:not([data-sign])");
  if (!stage || !lesson || box.hidden) { nudge(player); return; }
  const stageBox = stage.getBoundingClientRect();
  const lessonBox = lesson.getBoundingClientRect();
  const frame = {
    x: lessonBox.left - stageBox.left, y: lessonBox.top - stageBox.top,
    w: lessonBox.width, h: lessonBox.height
  };
  const picture = shift(pictureRect(frame.w, frame.h, lesson.videoWidth || frame.w, lesson.videoHeight || frame.h), frame);
  const sign = stage.querySelector(".sign-window:not([hidden])");
  const signBox = sign ? {
    x: sign.offsetLeft, y: sign.offsetTop, w: sign.offsetWidth, h: sign.offsetHeight
  } : null;
  if (box.dataset.force === "below") { park(player, box); nudge(player); return; }
  if (box.dataset.force === "top") {
    if (box.parentElement !== player.slots.overlay) player.slots.overlay.append(box);
    box.dataset.pos = "picture";
    box.style.position = "absolute";
    box.style.left = picture.x + "px";
    box.style.top = picture.y + "px";
    box.style.width = Math.max(40, picture.w * 0.9) + "px";
    nudge(player);
    return;
  }
  box.style.position = "absolute";
  box.style.bottom = "auto";
  box.style.height = "auto";
  box.style.transform = "none";
  const style = getComputedStyle(box);
  const line = parseFloat(style.lineHeight) || 28;
  const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  const limit = line * 2 + pad + 4;
  let width = Math.max(40, picture.w * 0.9);
  const widest = Math.max(width, stageBox.width * 0.9);
  box.style.width = width + "px";
  while (box.scrollHeight > limit && width < widest) {
    width = Math.min(widest, width + 32);
    box.style.width = width + "px";
  }
  const chip = { w: box.offsetWidth || width, h: box.offsetHeight || 48 };
  const spot = captionSpot({ w: stageBox.width, h: stageBox.height }, picture, chip, signBox);
  if (spot.below) { park(player, box); nudge(player); return; }
  if (box.parentElement !== player.slots.overlay) player.slots.overlay.append(box);
  box.dataset.pos = "picture";
  box.style.left = spot.x + "px";
  box.style.top = spot.y + "px";
  box.style.bottom = "auto";
  box.style.width = spot.w + "px";
  nudge(player);
}

function nudge(player) {
  const pill = player.shadow.querySelector(".sign-wait:not([hidden])");
  if (pill) layoutPill(player, pill);
}

function fit(box, sw, sh) {
  const w = Math.min(box.w, sw);
  const h = Math.min(box.h, sh);
  return { w, h, x: Math.max(0, Math.min(box.x, Math.max(0, sw - w))), y: Math.max(0, Math.min(box.y, Math.max(0, sh - h))) };
}

export function layoutPill(player, pill) {
  const stage = player.shadow.querySelector(".stage");
  const sign = stage?.querySelector(".sign-window:not([hidden])");
  if (!stage || !sign || pill.hidden) return;
  if (pill.parentElement !== player.slots.overlay) player.slots.overlay.append(pill);
  pill.style.position = "absolute";
  const w = pill.offsetWidth || 180;
  const h = pill.offsetHeight || 48;
  const signBox = { x: sign.offsetLeft, y: sign.offsetTop, w: sign.offsetWidth, h: sign.offsetHeight };
  const cap = player.shadow.querySelector(".captions");
  const capBox = cap && !cap.hidden && cap.dataset.pos !== "below" ? { x: cap.offsetLeft, y: cap.offsetTop, w: cap.offsetWidth, h: cap.offsetHeight } : null;
  const spots = [
    { x: signBox.x, y: signBox.y + signBox.h + 8 },
    { x: signBox.x, y: signBox.y - h - 8 },
    { x: signBox.x - w - 8, y: signBox.y },
    { x: signBox.x + signBox.w + 8, y: signBox.y }
  ];
  for (const spot of spots) {
    const box = fit({ ...spot, w, h }, stage.clientWidth || 1, stage.clientHeight || 1);
    if (intersects(box, signBox) || intersects(box, capBox)) continue;
    pill.style.left = box.x + "px";
    pill.style.top = box.y + "px";
    return;
  }
  park(player, pill);
}
