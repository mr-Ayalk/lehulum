#!/usr/bin/env python3
# FR-CAP-01, FR-CAP-04, FR-HOH-09: Build lesson WebVTT. Default alignment is DP; --method=count keeps the old cutter.
import argparse
import csv
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

from vtt_align import DP_NOISE, DP_PAUSE, align_cues

ROOT = Path(__file__).resolve().parents[1]
VIDEO = ROOT / "demo/data/lesson.mp4"
PHRASES = ROOT / "demo/data/phrases.csv"
WAV = Path("/tmp/lehulum-lesson.wav")
PAD = 0.1
NOISES = list(range(-45, -24))
PAUSES = [round(0.2 + i * 0.02, 2) for i in range(21)]


def phrases():
    rows = []
    with PHRASES.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row["id"].startswith("A"):
                rows.append(row)
    return rows[:14]


def wav_audio():
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(VIDEO),
         "-ac", "1", "-ar", "16000", str(WAV)], check=True)
    with wave.open(str(WAV)) as handle:
        rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())
    return np.frombuffer(frames, dtype=np.int16), rate


def silences(noise, pause):
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(WAV),
         "-af", f"silencedetect=noise={noise}dB:d={pause}", "-f", "null", "-"],
        capture_output=True, text=True)
    starts, spans = [], []
    for line in proc.stderr.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].strip()))
        elif "silence_end:" in line and starts:
            end = float(line.split("silence_end:")[1].split("|")[0].strip())
            spans.append((starts.pop(0), end))
    return spans


def speech(spans, total):
    segs, cursor = [], 0.0
    for start, end in spans:
        if start > cursor + 0.02:
            segs.append([cursor, start])
        cursor = max(cursor, end)
    if total - cursor > 0.02:
        segs.append([cursor, total])
    return segs


def loudness(samples, rate, start, end):
    a, b = int(start * rate), max(int(start * rate) + 1, int(end * rate))
    chunk = samples[a:b].astype(np.float64)
    if chunk.size == 0:
        return -99.0
    rms = float(np.sqrt(np.mean(chunk * chunk)))
    return -99.0 if rms < 1 else 20 * np.log10(rms / 32768.0)


def drop_noise(segs, samples, rate):
    def noise(seg):
        return seg[1] - seg[0] < 0.35 or loudness(samples, rate, seg[0], seg[1]) < -38
    while len(segs) > 14 and segs and noise(segs[0]):
        segs = segs[1:]
    while len(segs) > 14 and segs and noise(segs[-1]):
        segs = segs[:-1]
    return segs


def pad(segs, total):
    out = []
    for i, (start, end) in enumerate(segs):
        prev = segs[i - 1][1] if i else 0.0
        nxt = segs[i + 1][0] if i + 1 < len(segs) else total
        out.append((max(0.0, start - min(PAD, (start - prev) / 2)), min(total, end + min(PAD, (nxt - end) / 2))))
    return out


def stamp(seconds):
    ms = int(round(max(seconds, 0) * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def write_vtt(path, rows, segs, key, sound):
    lines = ["WEBVTT", ""]
    for row, (start, end) in zip(rows, segs):
        lines += [row["id"], f"{stamp(start)} --> {stamp(end)}", f"<v Teacher>{row[key]}"]
        if row["id"] == "A11":
            lines.append(sound)
        lines.append("")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def by_count(rows, samples, rate, total):
    best, closest = None, None
    for noise in NOISES:
        for pause in PAUSES:
            segs = drop_noise(speech(silences(noise, pause), total), samples, rate)
            if not segs:
                continue
            short = min(end - start for start, end in segs)
            rank = (abs(len(segs) - 14), -short)
            if closest is None or rank < closest[0]:
                closest = (rank, noise, pause, segs)
            if len(segs) == 14 and (best is None or short > best[0]):
                best = (short, noise, pause, segs)
    if not best:
        noise, pause, segs = closest[1], closest[2], closest[3]
        print(f"Could not find 14 segments. Closest is {len(segs)} at noise={noise}dB pause={pause}s.")
        for i, (start, end) in enumerate(segs, 1):
            print(f"{i:02d}  {start:7.2f}  {end:7.2f}  {end - start:6.2f}")
        return None
    short, noise, pause, segs = best
    segs = pad(segs, total)
    print(f"method=count  noise={noise}dB  min_silence={pause}s  shortest={short:.2f}s")
    print(f"{'id':4} {'start':>8} {'end':>8} {'duration':>8}  text_en")
    for row, (start, end) in zip(rows, segs):
        print(f"{row['id']:4} {start:8.2f} {end:8.2f} {end - start:8.2f}  {row['text_en']}")
    return segs


def by_dp(rows, total):
    found = align_cues(silences(DP_NOISE, DP_PAUSE), total, [row["text_am"] for row in rows])
    if not found or len(found["cues"]) != len(rows):
        spans = silences(DP_NOISE, DP_PAUSE)
        print(f"Could not place 13 boundaries at noise={DP_NOISE}dB pause={DP_PAUSE}s ({len(spans)} silences).")
        for start, end in spans:
            print(f"  {start:7.2f}  {end:7.2f}  {end - start:6.2f}")
        return None
    print(f"method=dp  noise={DP_NOISE}dB  min_silence={DP_PAUSE}s  "
          f"speech={found['t0']:.2f}..{found['t1']:.2f}  pauses={found['npauses']}  limits={found['mode']}")
    print(f"{'id':4} {'start':>8} {'end':>8} {'duration':>8} {'expected':>8} {'ratio':>6} {'pause':>7}  text_en")
    flagged = []
    for row, (start, end), exp, gap in zip(rows, found["cues"], found["expected"], found["pause_before"]):
        dur, ratio = end - start, (end - start) / exp if exp else 0
        flag = " CHECK" if ratio < 0.6 or ratio > 1.6 else ""
        if flag:
            flagged.append(row["id"])
        print(f"{row['id']:4} {start:8.2f} {end:8.2f} {dur:8.2f} {exp:8.2f} {ratio:6.2f} {gap:7.2f}  {row['text_en']}{flag}")
    print("CHECK rows:", " ".join(flagged) if flagged else "none")
    return found["cues"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--method", choices=("dp", "count"), default="dp")
    args = parser.parse_args()
    rows = phrases()
    samples, rate = wav_audio()
    total = len(samples) / rate
    segs = by_count(rows, samples, rate, total) if args.method == "count" else by_dp(rows, total)
    if not segs:
        return 1
    write_vtt(ROOT / "demo/data/lesson.en.vtt", rows, segs, "text_en", "[error sound]")
    write_vtt(ROOT / "demo/data/lesson.am.vtt", rows, segs, "text_am", "[የስህተት ድምፅ]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
