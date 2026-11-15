# FR-BLV-01: Chapter marks from groups of captions. This is not a scene detector.
from pathlib import Path


def _stamp(seconds):
    ms = int(round(float(seconds) * 1000))
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    secs, ms = divmod(ms, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"


def write_chapters(path, cues):
    lines = ["WEBVTT", ""]
    index = 0
    number = 0
    while index < len(cues):
        chunk = cues[index:index + 4]
        number += 1
        title = " ".join(chunk[0].get("lines") or []).strip()[:72] or "Chapter"
        lines.append(f"C{number:02d}")
        lines.append(f"{_stamp(chunk[0]['start'])} --> {_stamp(chunk[-1]['end'])}")
        lines.append(title)
        lines.append("")
        index += 4
    Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")
