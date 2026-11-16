# FR-BLV-03: OCR a frame at each scene and every 5 seconds. A person checks the words.
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


def write_screen(video, dest, starts):
    ffmpeg = shutil.which("ffmpeg")
    tesseract = shutil.which("tesseract")
    path = Path(video)
    if not ffmpeg or not tesseract or not path.is_file():
        return False
    times = _times(path, starts, ffmpeg)
    rows = []
    last = ""
    with tempfile.TemporaryDirectory() as tmp:
        for mark in times:
            image = Path(tmp) / "frame.png"
            shot = subprocess.run(
                [ffmpeg, "-y", "-ss", f"{mark:.3f}", "-i", str(path), "-frames:v", "1", str(image)],
                capture_output=True)
            if shot.returncode != 0 or not image.is_file():
                continue
            text = _read(tesseract, image)
            if not text or text == last:
                continue
            last = text
            kind = "code" if any(token in text for token in ("=", "print", "def ", "()")) else "slide"
            rows.append({"start": mark, "end": mark + 5, "kind": kind, "text": text, "content": text, "needs_check": True})
    if not rows:
        return False
    for index, row in enumerate(rows[:-1]):
        row["end"] = rows[index + 1]["start"]
    Path(dest).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return True


def _times(video, starts, ffmpeg):
    marks = {0.0}
    for mark in starts or []:
        marks.add(float(mark))
    probe = subprocess.run(
        [ffmpeg, "-i", str(video)], capture_output=True, text=True)
    duration = 0.0
    for line in (probe.stderr or "").splitlines():
        if "Duration:" in line:
            clock = line.split("Duration:", 1)[1].split(",")[0].strip()
            hours, minutes, seconds = clock.split(":")
            duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
            break
    step = 0.0
    while duration and step <= duration:
        marks.add(step)
        step += 5
    return sorted(marks)


def _read(tesseract, image):
    for lang in ("eng+amh", "eng"):
        result = subprocess.run(
            [tesseract, str(image), "stdout", "-l", lang, "--psm", "6"],
            capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    return ""
