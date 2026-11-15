# FR-DOC-02: A bilingual lesson PDF. Amharic and English use separate fonts.
import os
from io import BytesIO
from pathlib import Path

import pymupdf
from fontTools.ttLib import TTFont


def _ttf(name):
    chosen = os.environ.get("FONT_ETHIOPIC", "").strip() if "ethiopic" in name else ""
    path = Path(chosen) if chosen else Path(__file__).resolve().parents[2] / "module" / "fonts" / name
    font = TTFont(path)
    font.flavor = None
    buf = BytesIO()
    font.save(buf)
    return buf.getvalue()


def lesson_pdf(blocks):
    folder = Path(os.environ.get("DATA_DIR", "data")) / "fonts"
    folder.mkdir(parents=True, exist_ok=True)
    eth = folder / "eth.ttf"
    lat = folder / "lat.ttf"
    if not eth.exists():
        eth.write_bytes(_ttf("noto-sans-ethiopic-400.woff2"))
    if not lat.exists():
        lat.write_bytes(_ttf("atkinson-hyperlegible-400.woff2"))
    parts = []
    for kind, text in blocks:
        tag = "h1" if kind == "h1" else "h2" if kind == "h2" else "p"
        klass = "am" if any("\u1200" <= ch <= "\u137f" for ch in text) else "en"
        safe = str(text).replace("&", "&amp;").replace("<", "&lt;")
        parts.append(f'<{tag} class="{klass}">{safe}</{tag}>')
    html = "<html><body>" + "".join(parts) + "</body></html>"
    css = """
@font-face { font-family: eth; src: url(eth.ttf); }
@font-face { font-family: lat; src: url(lat.ttf); }
body { font-family: lat, eth; font-size: 12pt; }
.am { font-family: eth, lat; }
h1 { font-size: 18pt; } h2 { font-size: 14pt; }
"""
    story = pymupdf.Story(html, user_css=css, archive=str(folder))
    out = BytesIO()
    writer = pymupdf.DocumentWriter(out)
    area = pymupdf.Rect(48, 48, 547, 800)
    more = True
    while more:
        device = writer.begin_page(pymupdf.paper_rect("a4"))
        more, _ = story.place(area)
        story.draw(device)
        writer.end_page()
    writer.close()
    doc = pymupdf.open(stream=out.getvalue(), filetype="pdf")
    doc.set_metadata({"title": "Python: your first variable", "author": "LE HULUM"})
    doc.xref_set_key(doc.pdf_catalog(), "Lang", "(am)")
    doc.xref_set_key(doc.pdf_catalog(), "ViewerPreferences", "<</DisplayDocTitle true>>")
    return doc.tobytes()
