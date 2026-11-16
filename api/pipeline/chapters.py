# FR-BLV-01: Scene chapters when ffmpeg can see them, otherwise groups of captions.
import shutil
import subprocess
from pathlib import Path

from api.pipeline.vttio import dump


def _group_starts(cues):
    return [float(cues[index]["start"]) for index in range(0, len(cues), 4)]


def _title(cues, start):
    chosen = cues[-1]
    for cue in cues:
        if float(cue["start"]) >= start - 0.05:
            chosen = cue
            break
    words = " ".join(chosen.get("lines") or [chosen.get("text") or ""]).split()
    return " ".join(words[:6]) or "Chapter"


def scene_starts(video):
    program = shutil.which("ffmpeg")
    path = Path(video)
    if not program or not path.is_file():
        return []
    result = subprocess.run(
        [program, "-hide_banner", "-i", str(path), "-filter:v", "select='gt(scene,0.3)',showinfo", "-f", "null", "-"],
        capture_output=True, text=True, timeout=180)
    times = [0.0]
    for line in (result.stderr or "").splitlines():
        if "pts_time:" not in line:
            continue
        raw = line.split("pts_time:", 1)[1].split()[0]
        try:
            times.append(float(raw))
        except ValueError:
            continue
    merged = [times[0]]
    for mark in times[1:]:
        if mark - merged[-1] >= 20:
            merged.append(mark)
    return merged


def write_chapters(path, cues, starts=None):
    if not cues:
        Path(path).write_text("WEBVTT\n\n", encoding="utf-8")
        return
    marks = list(starts or _group_starts(cues))
    end_all = float(cues[-1]["end"])
    rows = []
    for number, start in enumerate(marks, 1):
        nxt = marks[number] if number < len(marks) else end_all
        rows.append({
            "id": f"C{number:02d}",
            "start": start,
            "end": max(nxt, start + 0.1),
            "text": _title(cues, start),
        })
    Path(path).write_text(dump(rows), encoding="utf-8")
