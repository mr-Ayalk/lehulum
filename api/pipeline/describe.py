# FR-BLV-05, FR-BLV-06, FR-BLV-07, FR-BLV-11: Flag moments, draft descriptions, then make the voice files.
import json
from pathlib import Path

from api.pipeline.tts import render
from api.pipeline.vttio import load, save

POINTING = ("as you can see", "look at", "like this", "እዚህ", "ይህን", "እንደምታዩት", "ተመልከቱ")


def author_note():
    return "Descriptions are written by a person. The draft only marks moments that need checking."


def find_moments(cues, starts=None):
    moments = []
    for cue in cues:
        text = cue.get("text") or " ".join(cue.get("lines") or [])
        folded = text.lower()
        if any(phrase in folded or phrase in text for phrase in POINTING):
            moments.append({"start": float(cue["start"]), "end": float(cue["end"]), "reason": "pointing", "text": text})
    ordered = sorted(cues, key=lambda cue: float(cue["start"]))
    scene = [float(mark) for mark in (starts or [])]
    for cue, nxt in zip(ordered, ordered[1:]):
        gap_start = float(cue.get("end") or cue["start"])
        gap_end = float(nxt["start"])
        if gap_end - gap_start < 3:
            continue
        if not any(gap_start <= mark <= gap_end for mark in scene):
            continue
        moments.append({"start": gap_start, "end": gap_end, "reason": "silence", "text": ""})
    return moments


def build_blind(folder, cues, starts=None):
    folder = Path(folder)
    moments = find_moments(cues, starts)
    (folder / "moments.json").write_text(json.dumps(moments, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not (folder / "screen.json").is_file():
        from api.pipeline.screen_ocr import write_screen
        write_screen(folder / "video.mp4", folder / "screen.json", starts or [])
    _draft_if_missing(folder, moments)
    speak_descriptions(folder)


def _draft_if_missing(folder, moments):
    if (folder / "descriptions.am.vtt").is_file():
        return
    screen = []
    if (folder / "screen.json").is_file():
        screen = json.loads((folder / "screen.json").read_text(encoding="utf-8"))
    rows = []
    for index, moment in enumerate(moments, 1):
        seen = next((item for item in screen if item["start"] <= moment["end"] and item.get("end", moment["end"]) >= moment["start"]), None)
        if seen:
            text = "On screen: " + (seen.get("content") or seen.get("text") or "")
        else:
            text = "A person needs to describe this moment."
        rows.append({"id": f"AD{index:02d}", "start": moment["start"], "end": moment["end"], "text": text})
    if rows:
        save(folder / "descriptions.am.vtt", rows)
        save(folder / "descriptions.en.vtt", rows)


def speak_descriptions(folder):
    folder = Path(folder)
    for name, lang in (("descriptions.am.vtt", "am"), ("descriptions.en.vtt", "en")):
        path = folder / name
        cues = load(path)
        changed = False
        for cue in cues:
            if not cue.get("id") or not cue.get("text"):
                continue
            rel = f"ad/{cue['id']}.{lang}.opus"
            dest = folder / rel
            if not dest.is_file():
                render(cue["text"], lang, dest)
            if dest.is_file() and cue.get("audio") != rel:
                cue["audio"] = rel
                changed = True
        if changed:
            save(path, cues)
