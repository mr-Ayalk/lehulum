# FR-BLV-07: Read and write description and chapter WebVTT files.
from pathlib import Path


def _seconds(stamp):
    parts = [float(part) for part in stamp.strip().split(":")]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return parts[0] if parts else 0


def stamp(seconds):
    ms = int(round(float(seconds) * 1000))
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    secs, ms = divmod(ms, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"


def read_cues(text):
    cues = []
    for block in text.replace("\r", "").split("\n\n"):
        lines = [line for line in block.split("\n") if line and not line.startswith("WEBVTT") and not line.startswith("NOTE")]
        time_at = next((index for index, line in enumerate(lines) if "-->" in line), -1)
        if time_at < 0:
            continue
        start, end = lines[time_at].split("-->", 1)
        audio = ""
        body = []
        for line in lines[time_at + 1:]:
            if line.startswith("audio:"):
                audio = line[6:].strip()
            else:
                body.append(line)
        cues.append({
            "id": lines[0].strip() if time_at else "",
            "start": _seconds(start),
            "end": _seconds(end.split()[0]),
            "audio": audio,
            "text": "\n".join(body).strip(),
        })
    return cues


def dump(cues):
    lines = ["WEBVTT", ""]
    for cue in cues:
        if cue.get("id"):
            lines.append(cue["id"])
        lines.append(f"{stamp(cue['start'])} --> {stamp(cue['end'])}")
        if cue.get("audio"):
            lines.append("audio:" + cue["audio"])
        if cue.get("text"):
            lines.append(cue["text"])
        lines.append("")
    return "\n".join(lines) + "\n"


def load(path):
    file = Path(path)
    if not file.is_file():
        return []
    return read_cues(file.read_text(encoding="utf-8"))


def save(path, cues):
    Path(path).write_text(dump(cues), encoding="utf-8")


def replace_text(path, cue_id, text):
    cues = load(path)
    found = False
    for cue in cues:
        if cue["id"] == cue_id:
            cue["text"] = text.strip()
            found = True
    if found:
        save(path, cues)
    return found
