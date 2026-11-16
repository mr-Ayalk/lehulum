# FR-DOC-01, FR-DOC-02, FR-DOC-03: HTML lesson, a text PDF, and English braille.
import json

from api.store import demo_dir


def _read(name):
    path = demo_dir() / name
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _plain(vtt):
    rows = []
    for raw in vtt.splitlines():
        line = raw.strip()
        if not line or line == "WEBVTT" or "-->" in line or line.startswith("audio:"):
            continue
        if len(line) <= 8 and line.isalnum() and line[0].isalpha() and any(ch.isdigit() for ch in line):
            continue
        rows.append("<p>" + _escape(line.replace("<v Teacher>", "").replace("</v>", "")) + "</p>")
    return "\n".join(rows)


def _figures():
    try:
        items = json.loads(_read("screen.json") or "[]")
    except json.JSONDecodeError:
        return ""
    blocks = []
    for item in items:
        blocks.append(
            "<figure><pre><code>" + _escape(item.get("content") or "")
            + "</code></pre><figcaption>" + _escape(item.get("title") or "On screen")
            + "</figcaption></figure>"
        )
    return "\n".join(blocks)


def lesson_html():
    return """<!DOCTYPE html>
<html lang="am"><head><meta charset="utf-8"><title>Python: your first variable</title></head>
<body>
<h1>Python: your first variable</h1>
<h2 lang="am">አማርኛ</h2>
{am}
<h2 lang="en">English</h2>
{en}
<h2>On screen</h2>
{screen}
<h2 lang="am">መግለጫ</h2>
{ad}
</body></html>""".format(
        am=_plain(_read("lesson.am.vtt")),
        en=_plain(_read("lesson.en.vtt")),
        screen=_figures(),
        ad=_plain(_read("descriptions.am.vtt")),
    )


def _escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;")


def _lines(vtt):
    rows = []
    for raw in vtt.splitlines():
        line = raw.strip()
        if not line or line == "WEBVTT" or "-->" in line or line.startswith("audio:"):
            continue
        if len(line) <= 8 and line.isalnum() and line[0].isalpha() and any(ch.isdigit() for ch in line):
            continue
        rows.append(line.replace("<v Teacher>", "").replace("</v>", "").replace("<c.low>", "").replace("</c>", ""))
    return "\n".join(rows)


def lesson_brf():
    from api.braille import to_brf
    try:
        screen = json.loads(_read("screen.json") or "[]")
    except json.JSONDecodeError:
        screen = []
    visual = "\n".join(((item.get("title") or "On screen") + " " + (item.get("content") or "")) for item in screen)
    text = "\n\n".join(part for part in (
        _lines(_read("lesson.am.vtt")),
        _lines(_read("lesson.en.vtt")),
        visual,
        _lines(_read("descriptions.am.vtt")),
        _lines(_read("descriptions.en.vtt")),
    ) if part)
    return to_brf(text)


def lesson_pdf():
    from api.pipeline.pdf_doc import lesson_pdf as build
    blocks = [
        ("h1", "Python: your first variable"),
        ("h2", "አማርኛ"),
        ("p", _lines(_read("lesson.am.vtt"))),
        ("h2", "English"),
        ("p", _lines(_read("lesson.en.vtt"))),
        ("h2", "On screen"),
    ]
    try:
        screen = json.loads(_read("screen.json") or "[]")
    except json.JSONDecodeError:
        screen = []
    for item in screen:
        blocks.append(("p", (item.get("title") or "On screen") + ": " + (item.get("content") or "")))
    blocks.append(("h2", "መግለጫ"))
    blocks.append(("p", _lines(_read("descriptions.am.vtt"))))
    return build(blocks)
