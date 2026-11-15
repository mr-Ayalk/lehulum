# FR-IN-01, FR-NET-02: A text lesson from the caption lines. No video.
from pathlib import Path


def _escape(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;")


def write_text_lesson(folder, cues, title):
    text = Path(folder) / "text"
    text.mkdir(parents=True, exist_ok=True)
    paragraphs = []
    for cue in cues:
        line = " ".join(cue.get("lines") or []).strip()
        if line:
            paragraphs.append("<p>" + _escape(line) + "</p>")
    html = (
        "<!DOCTYPE html>\n<html lang=\"am\"><head><meta charset=\"utf-8\"><title>"
        + _escape(title)
        + "</title></head>\n<body>\n<h1>"
        + _escape(title)
        + "</h1>\n"
        + "\n".join(paragraphs)
        + "\n</body></html>\n"
    )
    (text / "index.html").write_text(html, encoding="utf-8")
