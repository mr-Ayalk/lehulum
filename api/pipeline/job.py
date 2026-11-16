# FR-STU-01, FR-HOH-08, INT-05: Build caption tracks for one uploaded lesson.
import json

from api.pipeline.align import align_text
from api.pipeline.asr import NoAsr, transcribe
from api.pipeline.audio import extract
from api.pipeline.captions import cues_from_lines, cues_from_words, write_json, write_vtt
from api.pipeline.chapters import scene_starts, write_chapters
from api.pipeline.text_lesson import write_text_lesson
from api.pipeline.renditions import make_light
from api.pipeline.translate import draft
from api.routes.webhooks import notify
from api.settings import data_dir


def lesson_dir(lesson_id):
    return data_dir() / "lessons" / lesson_id


def write_state(folder, status, message=""):
    payload = {"status": status, "message": message}
    (folder / "status.json").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def read_state(folder):
    return json.loads((folder / "status.json").read_text(encoding="utf-8"))


def run_lesson(lesson_id):
    folder = lesson_dir(lesson_id)
    meta = json.loads((folder / "meta.json").read_text(encoding="utf-8"))
    write_state(folder, "running")
    try:
        _build(folder, meta)
        write_state(folder, "done")
        notify("lesson.completed", {"lesson_id": lesson_id})
    except Exception as exc:
        write_state(folder, "failed", str(exc) or "The caption job failed.")


def public_lesson(lesson_id):
    folder = lesson_dir(lesson_id)
    if not (folder / "status.json").exists():
        return None
    state = read_state(folder)
    meta = json.loads((folder / "meta.json").read_text(encoding="utf-8"))
    body = {"id": lesson_id, "status": state["status"], "message": state.get("message", ""),
            "title": meta.get("title", ""), "lang": meta.get("lang", "")}
    manifest_path = folder / "manifest.json"
    if state["status"] == "done" and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        base = f"/api/v1/lessons/{lesson_id}/files/"
        body["manifest"] = manifest
        body["tracks"] = {code: base + name for code, name in manifest["tracks"]["captions"].items()}
    return body


def _build(folder, meta):
    extract(folder / "video.mp4", folder / "audio.wav")
    lang = meta["lang"]
    script_path = folder / "script.txt"
    lines = []
    if script_path.exists():
        lines = [line.strip() for line in script_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    cues = cues_from_lines(align_text(folder / "audio.wav", lines, lang)) if lines else _from_asr(folder / "audio.wav", lang)
    write_vtt(folder / f"lesson.{lang}.vtt", cues)
    write_json(folder / "captions.json", cues)
    starts = scene_starts(folder / "video.mp4")
    write_chapters(folder / "chapters.vtt", cues, starts or None)
    try:
        from api.pipeline.describe import build_blind
        build_blind(folder, cues, starts)
    except Exception:
        pass
    write_text_lesson(folder, cues, meta.get("title") or "Lesson")
    make_light(folder)
    _translate(folder, cues, lang)
    manifest = _manifest(meta, folder)
    (folder / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _from_asr(wav, lang):
    try:
        segments = transcribe(wav, lang)
    except NoAsr:
        raise
    words = [word for segment in segments for word in segment.get("words") or [] if word.get("w")]
    if words:
        return cues_from_words(words)
    texts = [segment["text"] for segment in segments if segment.get("text")]
    if not texts:
        raise RuntimeError("The speech engine returned no text. Upload a script.")
    return cues_from_lines(align_text(wav, texts, lang))


def _translate(folder, cues, lang):
    target = "en" if lang == "am" else "am"
    rows = []
    for cue in cues:
        plain = " ".join(line.replace("<c.low>", "").replace("</c>", "") for line in cue["lines"])
        text = draft(plain, target)
        if text is None:
            return
        rows.append({"text": text, "start": cue["start"], "end": cue["end"]})
    write_vtt(folder / f"lesson.{target}.vtt", cues_from_lines(rows))


def _renditions(folder):
    rows = []
    for name, kind in (("video.mp4", "video"), ("light.mp4", "light"), ("audio.m4a", "audio")):
        path = folder / name
        if path.is_file():
            rows.append({"kind": kind, "url": name, "bytes": path.stat().st_size})
    return rows


def _manifest(meta, folder):
    captions = {code: f"lesson.{code}.vtt" for code in ("am", "en") if (folder / f"lesson.{code}.vtt").exists()}
    return {
        "id": meta["id"], "type": "video", "title": meta["title"], "lang": meta["lang"],
        "tracks": {"captions": captions,
                   "chapters": "chapters.vtt" if (folder / "chapters.vtt").is_file() else "",
                   "descriptions": "descriptions.vtt" if (folder / "descriptions.vtt").is_file() else "",
                   "sign": "sign.json", "screen": "screen.json" if (folder / "screen.json").is_file() else "",
                   "glossary": "glossary.json"},
        "renditions": _renditions(folder),
        "packs": {"text": "text", "light": "light", "full": "full"},
    }
