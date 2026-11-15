#!/usr/bin/env python3
# FR-DEAF-05: Signing onset from the shared ends-only trim.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_by_pause import FPS, read_frames  # noqa: E402
from sign_motion import absolute_motion, trim_bounds  # noqa: E402


def onset_seconds(video, cfg=None):
    frames = read_frames(video)
    motion = absolute_motion(frames)
    dur = len(frames) / FPS if len(frames) else 0.0
    frm, _to, _note, high, low = trim_bounds(motion, dur, cfg)
    return frm, high, low


def main():
    if len(sys.argv) != 2:
        print("usage: sign_onset.py VIDEO", file=sys.stderr)
        return 2
    seconds, high, low = onset_seconds(Path(sys.argv[1]))
    print(f"{seconds:.3f}")
    print(f"high {high:.3f}  low {low:.3f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
