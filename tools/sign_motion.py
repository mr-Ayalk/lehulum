# FR-DEAF-05, FR-SL-07: Ends-only trim from each clip's own motion.
import json
from pathlib import Path

import numpy as np

from cut_by_pause import FPS

CONFIG = Path(__file__).resolve().parent / "sign_trim_config.json"
SMOOTH = 0.15
MAX_HEAD = 6.0
MAX_TAIL = 3.0
MIN_KEEP = 0.8
CLEAR = 1.5


def absolute_motion(frames):
    """Mean absolute frame difference, smoothed over 0.15 s."""
    if frames is None or len(frames) < 2:
        return np.zeros(0, dtype=np.float32)
    diff = np.mean(np.abs(frames[1:] - frames[:-1]), axis=1)
    win = max(1, int(round(SMOOTH * FPS)))
    return np.convolve(diff, np.ones(win) / win, mode="same")


def load_config(path=CONFIG):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return {key: float(data[key]) for key in ("high", "low", "sustain", "lead", "tail")}


def levels(motion, cfg):
    floor = float(np.percentile(motion, 10))
    peak = float(np.percentile(motion, 90))
    span = peak - floor
    return floor, peak, floor + cfg["high"] * span, floor + cfg["low"] * span


def _clear_run(motion, high, low, _peak, sustain, fps):
    """First run that crosses high and holds above low. A later, faster move is not the start."""
    need = max(1, int(round(sustain * fps)))
    index, count = 0, len(motion)
    while index < count:
        if motion[index] <= high:
            index += 1
            continue
        end = index
        while end < count and motion[end] > low:
            end += 1
        if end - index >= need:
            return index, need
        index = max(end, index + 1)
    return None, need


def _onset_time(motion, high, low, peak, sustain, fps):
    found, need = _clear_run(motion, high, low, peak, sustain, fps)
    if found is None:
        return None
    start = found
    while start > 0 and motion[start - 1] > low:
        start -= 1
    probe = start - 1
    while probe >= 0 and motion[probe] <= low:
        probe -= 1
    gap = start - 1 - probe
    if probe < 0 or gap <= 0 or gap >= need:
        return found / fps
    bout = probe
    while bout > 0 and motion[bout - 1] > low:
        bout -= 1
    # A faint stir just above low is still the head rest. A near-high bout is the gesture.
    if float(np.max(motion[bout:probe + 1])) < (low + high) / 2:
        return found / fps
    return bout / fps


def _offset(motion, high, low, fps):
    last = -1
    for index, value in enumerate(motion):
        if value > high:
            last = index
    if last < 0:
        return None
    end = last + 1
    while end < len(motion) and motion[end] > low:
        end += 1
    return end / fps


def trim_bounds(motion, dur, cfg=None, fps=FPS):
    """Return from, to, note, high, low. Only a still head and a still tail are cut."""
    length = float(dur or 0)
    cfg = cfg or load_config()
    if motion is None or len(motion) == 0 or length <= 0:
        return 0.0, round(length, 3), "flagged", None, None
    series = np.asarray(motion, dtype=np.float64)
    floor, peak, high, low = levels(series, cfg)
    if not np.isfinite(peak) or peak < CLEAR * floor:
        return 0.0, round(length, 3), "flagged", high, low
    onset = _onset_time(series, high, low, peak, cfg["sustain"], fps)
    offset = _offset(series, high, low, fps)
    if onset is None or offset is None:
        return 0.0, round(length, 3), "flagged", high, low
    start = max(0.0, onset - cfg["lead"])
    end = min(length, offset + cfg["tail"])
    if start > MAX_HEAD:
        start = MAX_HEAD
    if length - end > MAX_TAIL:
        end = max(start, length - MAX_TAIL)
    if end - start < MIN_KEEP:
        deficit = MIN_KEEP - (end - start)
        grow = min(deficit, max(0.0, length - end))
        end += grow
        start = max(0.0, start - (deficit - grow))
    if end <= start:
        return 0.0, round(length, 3), "flagged", high, low
    return round(start, 3), round(end, 3), "", high, low
