# FR-SL-07: Contact sheet of a raw clip with the trim and the motion curve.
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from cut_by_pause import FPS

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
THUMB_W, THUMB_H = 88, 66
PLOT_H = 46


def _frames(clip, dur):
    count = int(dur / 0.5) + 1
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(clip),
         "-vf", f"fps=2,scale={THUMB_W}:{THUMB_H}", "-frames:v", str(count),
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    frame = THUMB_W * THUMB_H * 3
    total = len(raw) // frame
    pics = np.frombuffer(raw[:total * frame], dtype=np.uint8).reshape(total, THUMB_H, THUMB_W, 3)
    return pics


def save_sheet(clip, motion, high, low, frm, to, dest, dur, cue):
    pics = _frames(clip, dur)
    if len(pics) == 0:
        return
    font = ImageFont.truetype(FONT, 11)
    width = THUMB_W * len(pics)
    image = Image.new("RGB", (width, THUMB_H + 16 + PLOT_H + 14), (20, 19, 15))
    draw = ImageDraw.Draw(image)
    for index, pic in enumerate(pics):
        at = index * 0.5
        view = pic.copy()
        if at < frm or at > to:
            view = (view.astype(np.float32) * 0.35).astype(np.uint8)
        image.paste(Image.fromarray(view), (index * THUMB_W, 0))
        draw.text((index * THUMB_W + 3, THUMB_H + 1), f"{at:.1f}", fill=(243, 240, 232), font=font)
    x0 = int(round(frm / 0.5)) * THUMB_W
    x1 = int(round(min(to, (len(pics) - 1) * 0.5) / 0.5)) * THUMB_W + THUMB_W
    draw.rectangle((max(0, x0), THUMB_H + 14, min(width - 1, x1), THUMB_H + 18), fill=(255, 179, 0))
    top = THUMB_H + 20
    series = np.asarray(motion, dtype=np.float32)
    hi, lo = float(high or 0), float(low or 0)
    peak = max(float(series.max()) if len(series) else 1.0, hi * 1.15, 1.0)

    def y_of(value):
        return top + PLOT_H - int(round(min(max(value, 0.0), peak) / peak * (PLOT_H - 2)))

    points = [(int(round(i / max(1, len(series) - 1) * (width - 1))), y_of(v)) for i, v in enumerate(series)]
    if len(points) > 1:
        draw.line(points, fill=(120, 190, 255), width=1)
    draw.line((0, y_of(hi), width, y_of(hi)), fill=(255, 80, 80))
    draw.line((0, y_of(lo), width, y_of(lo)), fill=(80, 210, 120))
    draw.text((4, top + PLOT_H + 1), f"{cue}  from {frm:.2f}  to {to:.2f}  red high  green low", fill=(243, 240, 232), font=font)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, format="PNG", optimize=True)
    if dest.stat().st_size > 300_000:
        image.resize((width // 2, image.height // 2), Image.Resampling.BOX).save(dest, format="PNG", optimize=True)
