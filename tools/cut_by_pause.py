#!/usr/bin/env python3
# FR-SL-07, FR-SL-13, FR-SL-14: split a signing take on rest pauses, then compress each clip for 3G.
import argparse, csv, subprocess, sys
from pathlib import Path

import numpy as np

FPS = 20
SIZE = 96
PAD = 0.15
# Seated settle at the head of a take moves a little but is not a sign.
LEAD_PEAK = 0.55


def duration(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(video)],
        capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def read_frames(video):
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(video),
         "-vf", f"fps={FPS},scale={SIZE}:{SIZE},format=gray",
         "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True, check=True).stdout
    n = len(raw) // (SIZE * SIZE)
    return np.frombuffer(raw[:n * SIZE * SIZE], dtype=np.uint8).reshape(n, -1).astype(np.float32)


def motion_curve(frames):
    # Mean absolute frame difference, smoothed over 0.25 s, scaled 0..1 by p5/p95.
    diff = np.mean(np.abs(frames[1:] - frames[:-1]), axis=1)
    win = max(1, int(round(0.25 * FPS)))
    smooth = np.convolve(diff, np.ones(win) / win, mode="same")
    lo, hi = np.percentile(smooth, [5, 95])
    if hi <= lo:
        return np.zeros_like(smooth)
    return np.clip((smooth - lo) / (hi - lo), 0.0, 1.0)


def rests(motion, thr, min_pause):
    need = max(1, int(round(min_pause * FPS)))
    below = motion < thr
    spans, i, n = [], 0, len(below)
    while i < n:
        if not below[i]:
            i += 1
            continue
        j = i + 1
        while j < n and below[j]:
            j += 1
        if j - i >= need:
            spans.append((i, j))
        i = j
    return spans


def clips_from(motion, thr, min_pause, total):
    spans = rests(motion, thr, min_pause)
    bounds, cursor, n = [], 0, len(motion)
    for a, b in spans:
        if a > cursor:
            bounds.append((cursor, a))
        cursor = b
    if cursor < n:
        bounds.append((cursor, n))
    segs = []
    for a, b in bounds:
        if b <= a:
            continue
        start = max(0.0, a / FPS - PAD)
        end = min(total, (b + 1) / FPS + PAD)
        if end > start:
            segs.append((start, end, float(motion[a:b].max())))
    if segs and segs[0][2] < LEAD_PEAK:
        segs = segs[1:]
    return [(s, e) for s, e, _ in segs]


def _grid(thr_lock, pause_lock):
    thrs = [thr_lock] if thr_lock is not None else np.round(np.arange(0.04, 0.601, 0.02), 3)
    pauses = [pause_lock] if pause_lock is not None else np.round(np.arange(0.20, 0.701, 0.05), 3)
    return thrs, pauses


def autotune(motion, total, expected, thr_lock, pause_lock):
    thrs, pauses = _grid(thr_lock, pause_lock)
    scored = []
    for thr in thrs:
        for mp in pauses:
            segs = clips_from(motion, float(thr), float(mp), total)
            scored.append((abs(len(segs) - expected), float(thr), float(mp), segs))
    best_gap = min(row[0] for row in scored)

    def rank(row):
        # Among count matches, keep the split whose shortest clip is longest
        # and whose biggest hole between clips is smallest.
        gap, _thr, _mp, segs = row
        lengths = [e - s for s, e in segs] or [0.0]
        holes = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)] or [0.0]
        return (gap, -min(lengths), max(holes), max(lengths))

    chosen = min((row for row in scored if row[0] == best_gap), key=rank)
    return chosen[1], chosen[2], chosen[3]


def save_plot(path, motion, thr, segs):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        print("matplotlib not available; skipped motion plot", file=sys.stderr)
        return
    t = np.arange(len(motion)) / FPS
    fig, ax = plt.subplots(figsize=(12, 3.2))
    ax.plot(t, motion, color="#1f4e79", lw=0.8, label="motion")
    ax.axhline(thr, color="#c0392b", ls="--", lw=0.8, label=f"threshold {thr:.2f}")
    for s, e in segs:
        ax.axvspan(s, e, color="#1f7a4d", alpha=0.18)
    ax.set_xlim(0, max(float(t[-1]) if len(t) else 1, 1))
    ax.set_ylim(-0.02, 1.05)
    ax.set_xlabel("seconds")
    ax.set_ylabel("motion")
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)


def cut(video, start, end, out):
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-ss", f"{start:.3f}", "-i", str(video), "-t", f"{end - start:.3f}",
         "-vf", "scale=-2:288,fps=20", "-an", "-c:v", "libx264",
         "-preset", "veryfast", "-crf", "30", "-movflags", "+faststart", str(out)],
        check=True)


def load_names(path):
    if not path:
        return []
    return [ln.strip() for ln in Path(path).read_text(encoding="utf-8").splitlines() if ln.strip()]


def main():
    p = argparse.ArgumentParser(description="Cut a signing recording into one clip per rest-bounded phrase.")
    p.add_argument("video")
    p.add_argument("outdir")
    p.add_argument("--names", help="text file, one clip name per line; count is the tuning target")
    p.add_argument("--thr", type=float, help="lock the motion threshold (0.04..0.6); min_pause still tunes")
    p.add_argument("--min-pause", type=float, help="lock the minimum rest length in seconds (0.2..0.7)")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()

    names = load_names(a.names)
    print(f"Reading {a.video} at {FPS} fps, {SIZE}x{SIZE} gray...")
    frames = read_frames(a.video)
    motion = motion_curve(frames)
    total = duration(a.video)
    expected = len(names)
    if expected:
        thr, min_pause, segs = autotune(motion, total, expected, a.thr, a.min_pause)
    else:
        thr = a.thr if a.thr is not None else 0.25
        min_pause = a.min_pause if a.min_pause is not None else 0.40
        segs = clips_from(motion, thr, min_pause, total)
    print(f"Found {len(segs)} clips" + (f" (expected {expected})" if expected else ""))
    print(f"threshold={thr:.2f} min_pause={min_pause:.2f}s")
    if expected and len(segs) != expected:
        print("WARNING: count differs. Clips are named seg### until counts match. "
              "Pass --thr and --min-pause to override the search.", file=sys.stderr)
        names = []

    out = Path(a.outdir)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for i, (s, e) in enumerate(segs, 1):
        name = names[i - 1] if names else f"seg{i:03d}"
        rows.append({"clip": f"{name}.mp4", "start": f"{s:.2f}", "end": f"{e:.2f}", "length": f"{e - s:.2f}"})
        if not a.dry_run:
            cut(a.video, s, e, out / f"{name}.mp4")
            print(f"  {name}.mp4", flush=True)
    with open(out / "_cuts.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["clip", "start", "end", "length"])
        w.writeheader()
        w.writerows(rows)
    save_plot(out / "_motion.png", motion, thr, segs)
    print(f"Wrote {out / '_cuts.csv'}")


if __name__ == "__main__":
    main()
