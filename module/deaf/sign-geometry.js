// FR-DEAF-02: Free placement, edge magnet, and 3:4 resize. No DOM.
export const MIN_SCALE = 0.18;
export const MAX_SCALE = 0.55;
export const ASPECT = 3 / 4;

export function clampBox(box, sw, sh) {
  let w = Math.min(Math.max(1, box.w), sw);
  let h = Math.min(Math.max(1, box.h), sh);
  if (Math.abs(w / h - ASPECT) > 0.02) h = w / ASPECT;
  if (h > sh) { h = sh; w = h * ASPECT; }
  if (w > sw) { w = sw; h = w / ASPECT; }
  return {
    w, h,
    x: Math.max(0, Math.min(box.x, sw - w)),
    y: Math.max(0, Math.min(box.y, sh - h))
  };
}

export function magnet(box, sw, sh, reach = 12) {
  let { x, y, w, h } = clampBox(box, sw, sh);
  if (x <= reach) x = 0;
  if (y <= reach) y = 0;
  if (sw - (x + w) <= reach) x = Math.max(0, sw - w);
  if (sh - (y + h) <= reach) y = Math.max(0, sh - h);
  return { x, y, w, h };
}

export function resizeScale(scale, direction, step = 0.04) {
  const next = Math.round((Number(scale) + direction * step) * 1000) / 1000;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
}

export function sized(scale, sw, sh) {
  let w = sw * Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  let h = w / ASPECT;
  if (h > sh) { h = sh; w = h * ASPECT; }
  return { w, h };
}

export function toFractions(box, sw, sh) {
  return { x: box.x / sw, y: box.y / sh, w: box.w / sw };
}

export function fromFractions(frac, sw, sh) {
  const size = sized(frac.w, sw, sh);
  return clampBox({ x: frac.x * sw, y: frac.y * sh, w: size.w, h: size.h }, sw, sh);
}

export function pictureRect(frameW, frameH, mediaW, mediaH) {
  const mediaRatio = (mediaW || 16) / (mediaH || 9);
  const frameRatio = frameW / Math.max(frameH, 1);
  const w = mediaRatio > frameRatio ? frameW : frameH * mediaRatio;
  const h = mediaRatio > frameRatio ? frameW / mediaRatio : frameH;
  return { x: (frameW - w) / 2, y: (frameH - h) / 2, w, h };
}

export function defaultPlace(sw, sh, picture) {
  const left = Math.max(0, picture.x);
  const right = Math.max(0, sw - (picture.x + picture.w));
  const band = Math.max(left, right);
  if (band < sw * MIN_SCALE) {
    const size = sized(0.28, sw, sh);
    return clampBox({ x: sw - size.w - 16, y: sh - size.h - 16, w: size.w, h: size.h }, sw, sh);
  }
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (band - 12) / sw));
  const size = sized(scale, sw, sh);
  const x = right >= left ? picture.x + picture.w + (right - size.w) / 2 : (left - size.w) / 2;
  return clampBox({ x, y: (sh - size.h) / 2, w: size.w, h: size.h }, sw, sh);
}

export function intersects(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function placeBox(box, sw, sh) {
  const w = Math.min(Math.max(1, box.w), sw);
  const h = Math.min(Math.max(1, box.h), sh);
  return { w, h, x: Math.max(0, Math.min(box.x, sw - w)), y: Math.max(0, Math.min(box.y, sh - h)) };
}

export function captionSpot(stage, picture, chip, sign) {
  const w = Math.min(chip.w, stage.w);
  const h = chip.h;
  const spots = [
    { x: picture.x + (picture.w - w) / 2, y: picture.y + picture.h - h - 12 },
    { x: picture.x + (picture.w - w) / 2, y: picture.y + 12 },
    { x: 8, y: picture.y + picture.h - h - 12 },
    { x: stage.w - w - 8, y: 8 }
  ];
  for (const spot of spots) {
    const box = placeBox({ ...spot, w, h }, stage.w, stage.h);
    if (!intersects(box, sign)) return { ...box, below: false };
  }
  return { below: true };
}
