# FR-HOH-09, FR-HOH-11, INT-10: Turn timed words into WebVTT caption cues.
import json
from pathlib import Path

PAUSE = 0.35
LINE = 42
MIN_S = 1.0
MAX_S = 7.0
PUNCT = set(".?!።፧")


def cues_from_words(words):
    groups = _merge_short(_breaks([word for word in words if word.get("w")]))
    pieces = []
    for group in groups:
        pieces.extend(_fit(group))
    return _number(_pack(_merge_short(pieces)))


def cues_from_lines(rows):
    cues = []
    for row in rows:
        text = " ".join(str(row.get("text", "")).split())
        if not text:
            continue
        start, end = float(row["start"]), float(row["end"])
        if end < start:
            end = start
        if end - start <= MAX_S and len(text) <= LINE * 2:
            cues.append(_bare(start, end, _wrap_text(text)))
        else:
            cues.extend(_split_line(text, start, end))
    return _number(_touch(cues))


def write_vtt(path, cues):
    lines = ["WEBVTT", ""]
    for cue in cues:
        lines.append(cue["id"])
        lines.append(f"{_stamp(cue['start'])} --> {_stamp(cue['end'])}")
        lines.extend("<v Teacher>" + line for line in cue["lines"])
        lines.append("")
    Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_json(path, cues):
    payload = {"cues": [
        {"id": cue["id"], "start": cue["start"], "end": cue["end"], "status": "auto",
         "text": "\n".join(cue["lines"])} for cue in cues]}
    Path(path).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _breaks(words):
    groups, buf = [], []
    for word in words:
        if buf and word["start"] - buf[-1]["end"] >= PAUSE:
            groups.append(buf)
            buf = []
        buf.append(word)
        if str(word["w"]).rstrip()[-1:] in PUNCT:
            groups.append(buf)
            buf = []
    if buf:
        groups.append(buf)
    return groups


def _merge_short(groups):
    out = []
    for group in groups:
        if out and _dur(out[-1]) < MIN_S and _ok(out[-1] + group):
            out[-1] = out[-1] + group
        else:
            out.append(list(group))
    if len(out) >= 2 and _dur(out[-1]) < MIN_S and _ok(out[-2] + out[-1]):
        out[-2] = out[-2] + out[-1]
        out.pop()
    return out


def _ok(group):
    lines = _wrap_tokens(group)
    return _dur(group) <= MAX_S and len(lines) <= 2 and all(
        len(_visible(line)) <= LINE or " " not in _visible(line) for line in lines)


def _fit(group):
    if len(group) <= 1 or _ok(group):
        return [group]
    cut = 1
    for index in range(1, len(group)):
        if _ok(group[:index]):
            cut = index
        else:
            break
    if cut >= len(group):
        cut = max(1, len(group) // 2)
    return _fit(group[:cut]) + _fit(group[cut:])


def _plain(group):
    return " ".join(word["w"] for word in group).strip()


def _dur(group):
    return group[-1]["end"] - group[0]["start"] if group else 0.0


def _token(word):
    text = word["w"]
    score = word.get("p")
    if score is not None and score < 0.5:
        return f"<c.low>{text}</c>"
    return text


def _visible(text):
    return text.replace("<c.low>", "").replace("</c>", "")


def _wrap_tokens(group):
    lines, current = [], ""
    for word in group:
        piece = _token(word)
        trial = (current + " " + piece).strip()
        if current and len(_visible(trial)) > LINE:
            lines.append(current)
            current = piece
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def _wrap_text(text):
    return _wrap_tokens([{"w": word, "p": None} for word in text.split()])


def _pack(groups):
    cues = []
    for group in groups:
        if not group:
            continue
        cues.append(_bare(group[0]["start"], group[-1]["end"], _wrap_tokens(group)))
    return _touch(cues)


def _bare(start, end, lines):
    return {"start": float(start), "end": float(end), "lines": lines or [""], "status": "auto"}


def _touch(cues):
    for index in range(len(cues) - 1):
        if cues[index]["end"] > cues[index + 1]["start"]:
            cues[index]["end"] = cues[index + 1]["start"]
    for cue in cues:
        if cue["end"] < cue["start"]:
            cue["end"] = cue["start"]
    return cues


def _number(cues):
    for index, cue in enumerate(cues, 1):
        cue["id"] = f"C{index:03d}"
    return cues


def _split_line(text, start, end):
    words, chunks, current = text.split(), [], []
    for word in words:
        trial = " ".join(current + [word])
        if current and len(trial) > LINE * 2:
            chunks.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        chunks.append(" ".join(current))
    span = max(end - start, 0.01)
    total = sum(len(chunk) for chunk in chunks) or 1
    cursor, cues = start, []
    for chunk in chunks:
        piece = min(MAX_S, span * len(chunk) / total)
        cues.append(_bare(cursor, min(end, cursor + piece), _wrap_text(chunk)))
        cursor = cues[-1]["end"]
    if cues:
        cues[-1]["end"] = max(cues[-1]["start"], end)
    return cues


def _stamp(seconds):
    ms = int(round(max(seconds, 0) * 1000))
    hours, ms = divmod(ms, 3600000)
    minutes, ms = divmod(ms, 60000)
    secs, ms = divmod(ms, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"
