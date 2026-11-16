# Pitch deck for Accessibility Hackathon 2026. Run: python docs/build_pitch.py
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

W, H = Inches(13.333), Inches(7.5)
GREEN = RGBColor(0x0B, 0x3D, 0x30)
GREEN2 = RGBColor(0x14, 0x6C, 0x43)
INK = RGBColor(0x1C, 0x1B, 0x18)
CREAM = RGBColor(0xF6, 0xF1, 0xE6)
WHITE = RGBColor(0xFF, 0xFC, 0xF7)
GOLD = RGBColor(0xE0, 0xA, 0x2E) if False else RGBColor(0xC4, 0x8A, 0x1A)
GOLD = RGBColor(0xC9, 0x8A, 0x16)
MUTED = RGBColor(0x5C, 0x56, 0x4C)
CARD = RGBColor(0xFF, 0xFC, 0xF6)
RUST = RGBColor(0x8A, 0x3B, 0x2B)
SOFT = RGBColor(0xE7, 0xF2, 0xEC)

prs = Presentation()
prs.slide_width = W
prs.slide_height = H
prs.core_properties.title = "LE HULUM — Accessibility Hackathon 2026"
prs.core_properties.subject = "Track 2 plug-in pitch"
prs.core_properties.author = "LE HULUM"


def rgb(shape, color):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def rect(slide, x, y, w, h, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    rgb(shape, color)
    shape.shadow.inherit = False
    return shape


def rrect(slide, x, y, w, h, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    rgb(shape, color)
    shape.adjustments[0] = 0.08
    shape.shadow.inherit = False
    return shape


def _disable_autofit(tf):
    body = tf._txBody
    fit = body.find(qn("a:bodyPr"))
    if fit is not None:
        for child in list(fit):
            if child.tag.endswith("spAutoFit") or child.tag.endswith("normAutofit"):
                fit.remove(child)


def _face(run, name, amharic):
    run.font.name = name
    rpr = run._r.get_or_add_rPr()
    if amharic:
        rpr.set("lang", "am-ET")
    for tag in ("a:ea", "a:cs"):
        node = rpr.find(qn(tag))
        if node is None:
            node = rpr.makeelement(qn(tag), {})
            rpr.append(node)
        node.set("typeface", name)


def box(slide, x, y, w, h, paragraphs, valign=MSO_ANCHOR.TOP):
    shape = slide.shapes.add_textbox(x, y, w, h)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = Inches(0.04)
    tf.margin_right = Inches(0.04)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = valign
    _disable_autofit(tf)
    for i, item in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = item.get("align", PP_ALIGN.LEFT)
        p.space_before = Pt(item.get("before", 0))
        p.space_after = Pt(item.get("after", 0))
        run = p.add_run()
        run.text = item["text"]
        amharic = any("\u1200" <= ch <= "\u137f" for ch in item["text"])
        font = "Ebrima" if amharic else item.get("font", "Calibri")
        _face(run, font, amharic)
        run.font.size = Pt(item.get("size", 18))
        run.font.bold = item.get("bold", False)
        run.font.color.rgb = item.get("color", INK)
        run.font.italic = item.get("italic", False)
    return shape


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def footer(slide, n, total, dark=False):
    color = RGBColor(0xD5, 0xE6, 0xDE) if dark else MUTED
    box(slide, Inches(0.55), Inches(7.08), Inches(10.5), Inches(0.32), [
        {"text": "LE HULUM  ·  github.com/mr-Ayalk/lehulum", "size": 12, "color": color}
    ])
    box(slide, Inches(11.6), Inches(7.08), Inches(1.2), Inches(0.32), [
        {"text": f"{n}  /  {total}", "size": 12, "color": color, "align": PP_ALIGN.RIGHT}
    ])


def bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def new(color):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bg(slide, color)
    return slide


TOTAL = 18

# 1 Title
s = new(GREEN)
rect(s, Inches(0), Inches(0), Inches(0.18), H, GOLD)
box(s, Inches(0.85), Inches(1.35), Inches(11), Inches(0.4), [
    {"text": "ACCESSIBILITY HACKATHON 2026   ·   TRACK 2", "size": 14, "bold": True, "color": GOLD}
])
box(s, Inches(0.85), Inches(1.85), Inches(11.5), Inches(1.3), [
    {"text": "LE HULUM", "size": 60, "bold": True, "color": WHITE, "font": "Calibri"}
])
box(s, Inches(0.85), Inches(3.15), Inches(11), Inches(0.8), [
    {"text": "ለሁሉም", "size": 40, "color": GOLD, "font": "Ebrima"}
])
box(s, Inches(0.85), Inches(4.15), Inches(11), Inches(1.1), [
    {"text": "Ear to the deaf. Eye for the blind.", "size": 28, "color": WHITE}
])
box(s, Inches(0.85), Inches(5.5), Inches(10.5), Inches(1.1), [
    {"text": "One plug-in for the lesson page a school already has.", "size": 20, "color": RGBColor(0xD5, 0xE6, 0xDE)},
    {"text": "Sign. Captions. Description. Braille. A lesson that still opens on a slow phone.", "size": 20, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 6},
])
notes(s, "Open on the title. Say the name in Amharic: le-hulum, for everyone. One sentence: we did not build another learning site. We built the piece a school drops into the page it already uses.")

# 2 Problem
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.6), Inches(0.35), Inches(12), Inches(1.3), [
    {"text": "The lesson starts.", "size": 36, "bold": True, "color": INK},
    {"text": "Three learners are already outside it.", "size": 36, "bold": True, "color": GREEN, "before": 2},
])
cards = [
    (RUST, "Deaf", "The teacher speaks. The page has no Ethiopian Sign Language, so the lesson is a silent video."),
    (RGBColor(0x8A, 0x5A, 0x12), "Hard of hearing", "Speech is thin on a phone speaker. Captions sit on top of the code the learner needs to read."),
    (GREEN, "Blind", "The teacher says “as you can see.” The code never becomes words, and there is no braille to take away."),
]
for i, (color, title, body) in enumerate(cards):
    x = Inches(0.55 + i * 4.2)
    rrect(s, x, Inches(2.15), Inches(3.95), Inches(3.15), WHITE)
    rect(s, x, Inches(2.15), Inches(0.12), Inches(3.15), color)
    box(s, x + Inches(0.35), Inches(2.4), Inches(3.4), Inches(2.7), [
        {"text": title, "size": 22, "bold": True, "color": color},
        {"text": body, "size": 16, "color": INK, "before": 10},
    ])
box(s, Inches(0.6), Inches(5.55), Inches(12), Inches(1.2), [
    {"text": "And the video is 43 MB. On a slow connection it never arrives, so none of the other help matters.", "size": 20, "bold": True, "color": INK},
])
footer(s, 2, TOTAL)
notes(s, "Pause on the three cards. Then the 43 MB line. The problem is not a missing app. The problem is a lesson that assumes hearing, sight, and a fast network.")

# 3 Choice
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.6), Inches(0.4), Inches(12), Inches(1.5), [
    {"text": "Schools will not throw away their lesson site.", "size": 32, "bold": True, "color": INK},
])
rrect(s, Inches(0.6), Inches(2.1), Inches(12.1), Inches(2.3), GREEN)
box(s, Inches(0.95), Inches(2.35), Inches(11.5), Inches(1.9), [
    {"text": "So the accessible lesson has to land inside the page they already run.", "size": 26, "color": WHITE},
    {"text": "LE HULUM is that piece. A custom element. The host page stays the host page.", "size": 22, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 12},
])
points = [
    ("1", "No new student login."),
    ("2", "No rebuild of Savanna."),
    ("3", "Learner settings stay on the phone."),
]
for i, (n, t) in enumerate(points):
    x = Inches(0.6 + i * 4.2)
    rrect(s, x, Inches(4.7), Inches(3.95), Inches(1.9), WHITE)
    box(s, x + Inches(0.3), Inches(4.95), Inches(3.4), Inches(1.5), [
        {"text": n, "size": 28, "bold": True, "color": GOLD},
        {"text": t, "size": 18, "color": INK, "before": 6},
    ])
footer(s, 3, TOTAL)
notes(s, "Savanna is the host we were given. We were allowed to add the script tag and the element. Nothing else on that page was rewritten.")

# 4 The tag
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.32), Inches(12), Inches(0.7), [
    {"text": "A school adds two lines.", "size": 32, "bold": True, "color": INK},
])
rrect(s, Inches(0.5), Inches(1.2), Inches(7.5), Inches(5.4), INK)
code = """<script type="module"
  src="/module/db-player.js"></script>

<db-player
  src="/lesson.mp4"
  lang="am"
  captions="lesson.am.vtt,lesson.en.vtt"
  sign="sign.json"
  glossary="glossary.json"
  describe="descriptions.am.vtt"
  screen="screen.json"
  chapters="chapters.vtt"
  api="/api/v1"
  lesson-id="python-01">
</db-player>"""
box(s, Inches(0.7), Inches(1.4), Inches(7.15), Inches(5.0), [
    {"text": code, "size": 15, "color": RGBColor(0xF3, 0xF0, 0xE8), "font": "Consolas"}
])
box(s, Inches(8.25), Inches(1.25), Inches(4.6), Inches(5.2), [
    {"text": "What the host controls", "size": 18, "bold": True, "color": GREEN},
    {"text": "Only attributes. Video, language, captions, sign, descriptions, screen text, chapters.", "size": 15, "color": INK, "before": 8},
    {"text": "What comes back", "size": 18, "bold": True, "color": GREEN, "before": 14},
    {"text": "db-player:progress and db-player:complete. They bubble out of the player.", "size": 15, "color": INK, "before": 8},
    {"text": "What stays private", "size": 18, "bold": True, "color": GREEN, "before": 14},
    {"text": "Caption size, hearing, sign position. Stored on the device. Never sent to the school.", "size": 15, "color": INK, "before": 8},
])
footer(s, 4, TOTAL)
notes(s, "api and lesson-id are optional. Without them the player still runs from the files in the attributes. With them the page can download braille, packs, and a certificate.")

# 5 Where it already sits
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.32), Inches(12), Inches(0.8), [
    {"text": "It is already plugged into two pages.", "size": 32, "bold": True, "color": INK},
])
rows = [
    ("Inside Savanna", "savanna/pages/concept-with-navigation.html", "The concept page, under the banner. Savanna’s own CSS is untouched."),
    ("On a blank page", "demo/blank.html", "Same player, no Bootstrap, so the plug-in does not depend on the host theme."),
    ("A text lesson", "demo/lesson-text.html", "for=\"#lesson-text\" attaches to an article that is already on the page."),
    ("Jobs", "demo/jobs.html", "A second element, <db-job-card>, from module/db-job-card.js."),
]
for i, (title, path, body) in enumerate(rows):
    y = Inches(1.3 + i * 1.35)
    rrect(s, Inches(0.55), y, Inches(12.2), Inches(1.22), WHITE)
    rect(s, Inches(0.55), y, Inches(0.1), Inches(1.22), GREEN)
    box(s, Inches(0.9), y + Inches(0.12), Inches(11.6), Inches(1.0), [
        {"text": title, "size": 18, "bold": True, "color": GREEN},
        {"text": path + "   —   " + body, "size": 15, "color": INK, "before": 2},
    ])
footer(s, 5, TOTAL)
notes(s, "Fonts load from /module/fonts/. A host serves the module folder at that path. There is no public CDN. The install sample on the demo home page is text, not a live content network.")

# 6 Four doors
s = new(GREEN)
box(s, Inches(0.6), Inches(0.4), Inches(12), Inches(1.3), [
    {"text": "One sample lesson. Four ways in.", "size": 34, "bold": True, "color": WHITE},
    {"text": "Python: your first variable. About 47 seconds.", "size": 18, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 6},
])
doors = [
    ("Sign", "A recorded signer stays with each caption line."),
    ("Clear voice", "Speech is lifted, slowed, and can be said again."),
    ("Read", "The screen, the code, and braille are text."),
    ("Save data", "Text, a light lesson, or the full video. The size is shown first."),
]
for i, (title, body) in enumerate(doors):
    x = Inches(0.5 + (i % 4) * 3.2)
    rrect(s, x, Inches(2.3), Inches(3.0), Inches(3.6), RGBColor(0x0E, 0x4A, 0x3A))
    box(s, x + Inches(0.2), Inches(2.55), Inches(2.6), Inches(3.1), [
        {"text": f"0{i+1}", "size": 20, "bold": True, "color": GOLD},
        {"text": title, "size": 24, "bold": True, "color": WHITE, "before": 12},
        {"text": body, "size": 16, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 12},
    ])
footer(s, 6, TOTAL, dark=True)
notes(s, "Same lesson id, python-01. The next slides walk sign first, because that is the part judges ask about most.")

# 7 Sign recording
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.3), Inches(12), Inches(1.15), [
    {"text": "The signs are filmed. They are not drawn.", "size": 32, "bold": True, "color": INK},
])
steps = [
    ("1  Record", "A signer records a continuous take. Face and hands stay in frame. Ethiopian Sign Language grammar lives in the face, so we keep the video."),
    ("2  Mark", "A cut sheet stores each sign as a file name, a start, and an end. See lexicon/_cuts.csv and phrases/_cuts.csv."),
    ("3  Cut", "Each marked span becomes its own clip: a word, a reusable phrase, or one whole lesson line."),
]
for i, (title, body) in enumerate(steps):
    y = Inches(1.6 + i * 1.65)
    rrect(s, Inches(0.55), y, Inches(12.2), Inches(1.5), WHITE)
    box(s, Inches(0.85), y + Inches(0.18), Inches(11.6), Inches(1.2), [
        {"text": title, "size": 20, "bold": True, "color": GREEN},
        {"text": body, "size": 16, "color": INK, "before": 4},
    ])
footer(s, 7, TOTAL)
notes(s, "Example from the phrase sheet: B01.mp4 starts at 1.80 seconds and ends at 3.65. That span is the sign for እንጀምር, Let's start. Word signs such as variable.mp4 are cut the same way from the lexicon take.")

# 8 Pairing
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.28), Inches(12), Inches(0.7), [
    {"text": "Every clip is paired with words.", "size": 32, "bold": True, "color": INK},
])
pairs = [
    ("Whole line", "sign.json", "Cue A03, lesson time 5.281–8.397, plays memory/A03.mp4. The caption and the sign share one id."),
    ("Reusable phrase", "phrases.csv", "B01 is እንጀምር / Let's start, and the file is phrases/B01.mp4. Twenty-five phrases are cut this way."),
    ("One word", "glossary.json", "VARIABLE lists ተለዋዋጭ, ተለዋዋጮች, የተለዋዋጩ, and the English “variable”. The clip is lexicon/variable.mp4."),
]
for i, (title, file, body) in enumerate(pairs):
    x = Inches(0.45 + i * 4.25)
    rrect(s, x, Inches(1.25), Inches(4.05), Inches(4.0), WHITE)
    rect(s, x, Inches(1.25), Inches(4.05), Inches(0.12), GOLD)
    box(s, x + Inches(0.22), Inches(1.55), Inches(3.6), Inches(3.5), [
        {"text": title, "size": 22, "bold": True, "color": GREEN},
        {"text": file, "size": 14, "bold": True, "color": GOLD, "font": "Consolas", "before": 8},
        {"text": body, "size": 15, "color": INK, "before": 10},
    ])
box(s, Inches(0.55), Inches(5.5), Inches(12.2), Inches(1.3), [
    {"text": "The lesson lines A01–A14 each have a filmed sign in demo/data/memory/. The player does not guess those. The cue id is the join.", "size": 16, "color": INK},
])
footer(s, 8, TOTAL)
notes(s, "Open demo/data/sign.json and show one segment. Then glossary.json for VARIABLE. The forms list is how Amharic word shapes still find the same clip.")

# 9 Match logic
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.28), Inches(12), Inches(0.65), [
    {"text": "How a line finds its sign.", "size": 32, "bold": True, "color": INK},
])
logic = [
    ("1", "Play the filmed line", "When the lesson clock enters cue A03, sign.json already names memory/A03.mp4. That clip plays in the sign window, from its in-point to its out-point."),
    ("2", "Longest word wins", "For a term inside the caption, the matcher sorts glossary forms by length. ተለዋዋጮች is kept whole. A shorter word inside it is not signed a second time."),
    ("3", "Word edges", "English must match a whole word, so “name” does not fire inside “named”. Amharic matches the listed forms, including prefixes the glossary stored."),
    ("4", "Say what it is", "A glossary hit is labelled machine. POST /api/v1/sign/translate with {\"text\":\"ተለዋዋጭ\"} returns the gloss VARIABLE and the clip path."),
]
for i, (n, title, body) in enumerate(logic):
    y = Inches(1.1 + (i % 4) * 1.4)
    rrect(s, Inches(0.5), y, Inches(12.3), Inches(1.28), WHITE)
    box(s, Inches(0.7), y + Inches(0.15), Inches(0.6), Inches(0.9), [
        {"text": n, "size": 26, "bold": True, "color": GOLD}
    ])
    box(s, Inches(1.45), y + Inches(0.12), Inches(11.1), Inches(1.05), [
        {"text": title, "size": 18, "bold": True, "color": GREEN},
        {"text": body, "size": 14, "color": INK, "before": 2},
    ])
footer(s, 9, TOTAL)
notes(s, "The code is module/deaf/gloss-match.js and the same rules in api/routes/sign.py. If a line has no clip, the window shows the caption words so the learner is not left with a blank. Fingerspelling video for each letter is not filmed yet.")

# 10 On screen
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.3), Inches(12), Inches(0.7), [
    {"text": "The signer stays with the lesson.", "size": 32, "bold": True, "color": INK},
])
items = [
    ("Follow the clock", "Play, pause, and seek move the sign to the caption that owns that time."),
    ("Wait for the signer", "If the hands are still moving when the caption ends, the lesson can hold and resume when the clip finishes."),
    ("A window, not a takeover", "Drag, arrow keys, or the four corner buttons. Larger and smaller keep the shape. Opacity 100, 80, or 60 percent."),
    ("Speed", "The signer can play at 1, 0.85, or 0.75. The lesson stays in step."),
    ("A word you can tap", "A glossary term in the caption opens a dialog with the looping clip, in Amharic and English. Focus returns to the word."),
    ("Try it", "Open the video lesson and press S. The same control is a labelled button."),
]
for i, (title, body) in enumerate(items):
    col = i % 3
    row = i // 3
    x = Inches(0.5 + col * 4.2)
    y = Inches(1.25 + row * 2.7)
    rrect(s, x, y, Inches(4.0), Inches(2.5), WHITE)
    box(s, x + Inches(0.22), y + Inches(0.2), Inches(3.55), Inches(2.1), [
        {"text": title, "size": 18, "bold": True, "color": GREEN},
        {"text": body, "size": 15, "color": INK, "before": 8},
    ])
footer(s, 10, TOTAL)
notes(s, "Keyboard: S opens sign. The window position is saved on the device. Light mode still plays only the clip for the current line, so the full sign video is not downloaded.")

# 11 Hearing
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.28), Inches(12), Inches(0.85), [
    {"text": "Hard of hearing: make the speech usable.", "size": 30, "bold": True, "color": INK},
])
hear = [
    ("Clear voice", "Off, Clear, or Extra clear. The chain is a 100 Hz high-pass, a lift at 2.5 kHz, a lift at 4 kHz, then a compressor. It is built on the first Play."),
    ("Louder, still shaped", "Boost is 100, 150, or 200 percent. The compressor is there so the boost does not turn into a rattle."),
    ("Slower, same pitch", "1, 0.85, or 0.75. Pitch is preserved, so a voice does not drop into a drone."),
    ("One ear or both", "Mono mixes both channels into both ears. A balance slider moves the voice toward the better ear."),
    ("Say that again", "R replays the last line from 0.2 seconds before it started, with the caption larger. A second press within 2 seconds steps one line back. Hold, or Shift+R, plays it at 0.75."),
    ("Captions you can trust", "They sit below the video by default. An unsure word is dotted. Marking the line checked removes that mark and shows the percent a person has checked."),
]
for i, (title, body) in enumerate(hear):
    col = i % 3
    row = i // 3
    x = Inches(0.45 + col * 4.25)
    y = Inches(1.3 + row * 2.7)
    rrect(s, x, y, Inches(4.05), Inches(2.5), WHITE)
    box(s, x + Inches(0.2), y + Inches(0.18), Inches(3.65), Inches(2.15), [
        {"text": title, "size": 18, "bold": True, "color": GREEN},
        {"text": body, "size": 14, "color": INK, "before": 6},
    ])
footer(s, 11, TOTAL)
notes(s, "Press H. The hearing panel also holds caption size, colour, and position, so it is one place. The sample word name is marked uncertain on purpose so a judge can see the dotted underline.")

# 12 Blind
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.28), Inches(12), Inches(0.8), [
    {"text": "Blind: the screen becomes language.", "size": 32, "bold": True, "color": INK},
])
blind = [
    ("What is on screen", "W pauses the lesson and opens “On screen at” the clock time. Code is in a real code block, with Copy. Escape returns to the button."),
    ("Descriptions", "At a “look at this” moment the lesson pauses, a short tone plays, then the description. Voice, or the learner’s own screen reader. Two volume sliders."),
    ("A document, not a list", "The transcript has a chapter navigation and a heading per chapter. Each line seeks. It downloads as plain text."),
    ("Braille", "GET /api/v1/lessons/python-01/document.brf is Ethiopic grade-1 braille and English uncontracted, 40 cells, from the captions, the screen, and the descriptions."),
]
for i, (title, body) in enumerate(blind):
    y = Inches(1.25 + i * 1.35)
    rrect(s, Inches(0.5), y, Inches(12.3), Inches(1.25), WHITE)
    box(s, Inches(0.75), y + Inches(0.12), Inches(11.8), Inches(1.05), [
        {"text": title, "size": 18, "bold": True, "color": GREEN},
        {"text": body, "size": 15, "color": INK, "before": 2},
    ])
footer(s, 12, TOTAL)
notes(s, "Descriptions in the sample are written text. The phone speaks them if it has a voice. espeak-ng is not installed, so the Opus files are not generated on this machine. Say that plainly if asked.")

# 13 Offline
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.28), Inches(12), Inches(0.7), [
    {"text": "The size is shown before the tap.", "size": 32, "bold": True, "color": INK},
])
sizes = [
    ("3 KB", "Text only", "The lesson as HTML. Headings, both languages, the code, the descriptions."),
    ("402 KB", "Light lesson", "The same HTML, plus the speech audio and four scene slides inside one file."),
    ("43 MB", "Video", "The full picture. Saved in 256 KB pieces so a dropped download can continue."),
]
for i, (n, title, body) in enumerate(sizes):
    x = Inches(0.5 + i * 4.25)
    rrect(s, x, Inches(1.2), Inches(4.05), Inches(2.7), GREEN if i == 1 else WHITE)
    title_c = WHITE if i == 1 else GREEN
    body_c = RGBColor(0xD5, 0xE6, 0xDE) if i == 1 else INK
    num_c = GOLD if i == 1 else GOLD
    box(s, x + Inches(0.25), Inches(1.4), Inches(3.6), Inches(2.3), [
        {"text": n, "size": 32, "bold": True, "color": num_c},
        {"text": title, "size": 20, "bold": True, "color": title_c, "before": 4},
        {"text": body, "size": 15, "color": body_c, "before": 8},
    ])
box(s, Inches(0.55), Inches(4.15), Inches(12.2), Inches(2.6), [
    {"text": "On a slow link the lighter choice is offered first, and the choice is remembered.", "size": 18, "color": INK},
    {"text": "Light mode plays the audio as the clock. The slide changes at each scene, and the next slide is loaded ahead.", "size": 18, "color": INK, "before": 6},
    {"text": "Share sends the text lesson as a file, or a link. Progress waits on the phone and sends when the network returns. A repeated event is stored once.", "size": 18, "color": INK, "before": 6},
])
footer(s, 13, TOTAL)
notes(s, "Numbers are the live pack sizes for python-01: text 2,799 bytes, light 411,824 bytes, video 45,266,332 bytes. GET /api/v1/lessons/python-01/packs returns them.")

# 14 Career
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.3), Inches(12), Inches(0.8), [
    {"text": "The lesson ends. The path does not.", "size": 32, "bold": True, "color": INK},
])
rrect(s, Inches(0.5), Inches(1.35), Inches(6.0), Inches(5.2), WHITE)
box(s, Inches(0.75), Inches(1.55), Inches(5.5), Inches(4.8), [
    {"text": "Job cards", "size": 24, "bold": True, "color": GREEN},
    {"text": "Six test employers. Each card can be listened to, and terms can open in sign.", "size": 16, "color": INK, "before": 10},
    {"text": "Dates show in the Gregorian calendar and the Ethiopian calendar.", "size": 16, "color": INK, "before": 8},
    {"text": "Each job is also schema.org JobPosting data.", "size": 16, "color": INK, "before": 8},
    {"text": "An application is test data. The card never sends the learner’s access settings.", "size": 16, "color": INK, "before": 8},
])
rrect(s, Inches(6.75), Inches(1.35), Inches(6.0), Inches(5.2), GREEN)
box(s, Inches(7.0), Inches(1.55), Inches(5.5), Inches(4.8), [
    {"text": "A certificate that can be checked", "size": 24, "bold": True, "color": WHITE},
    {"text": "Finishing the lesson asks the server for an Open Badges 3.0 credential.", "size": 16, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 10},
    {"text": "The proof is Ed25519, eddsa-jcs-2022. The key stays on the server.", "size": 16, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 8},
    {"text": "demo/verify.html says valid or not valid, in words. It shows no disability information.", "size": 16, "color": RGBColor(0xD5, 0xE6, 0xDE), "before": 8},
])
footer(s, 14, TOTAL)
notes(s, "Job listen uses the phone voice when the Opus file is missing. Say the employers are invented.")

# 15 Judge path
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.25), Inches(12), Inches(0.6), [
    {"text": "How to check it from GitHub.", "size": 32, "bold": True, "color": INK},
])
rrect(s, Inches(0.45), Inches(1.05), Inches(6.3), Inches(5.6), INK)
box(s, Inches(0.65), Inches(1.2), Inches(5.95), Inches(5.3), [
    {"text": "git clone https://github.com/mr-Ayalk/lehulum", "size": 13, "color": GOLD, "font": "Consolas"},
    {"text": "cd lehulum", "size": 13, "color": WHITE, "font": "Consolas", "before": 4},
    {"text": "python serve.py", "size": 13, "color": WHITE, "font": "Consolas", "before": 4},
    {"text": "Then open", "size": 14, "bold": True, "color": GOLD, "before": 14, "font": "Calibri"},
    {"text": "127.0.0.1:8080/demo/lesson-video.html", "size": 13, "color": WHITE, "font": "Consolas", "before": 4},
    {"text": "127.0.0.1:8080/demo/lesson-text.html", "size": 13, "color": WHITE, "font": "Consolas", "before": 2},
    {"text": "127.0.0.1:8080/demo/jobs.html", "size": 13, "color": WHITE, "font": "Consolas", "before": 2},
    {"text": "127.0.0.1:8080/demo/blank.html", "size": 13, "color": WHITE, "font": "Consolas", "before": 2},
    {"text": "127.0.0.1:8080/pages/concept-with-navigation.html", "size": 12, "color": WHITE, "font": "Consolas", "before": 2},
    {"text": "127.0.0.1:8080/api/docs", "size": 13, "color": WHITE, "font": "Consolas", "before": 2},
])
checks = [
    ("S", "Open the sign window."),
    ("H", "Open hearing. Try Extra clear."),
    ("R", "Say the line again."),
    ("W", "Read what is on screen."),
    ("D", "Hear the description."),
    ("C", "Turn captions Amharic or English."),
]
box(s, Inches(7.0), Inches(1.05), Inches(5.8), Inches(0.4), [
    {"text": "Keys, while focus is in the player", "size": 16, "bold": True, "color": GREEN}
])
for i, (k, label) in enumerate(checks):
    y = Inches(1.55 + i * 0.72)
    rrect(s, Inches(7.0), y, Inches(5.85), Inches(0.64), WHITE)
    box(s, Inches(7.15), y + Inches(0.08), Inches(5.5), Inches(0.48), [
        {"text": k + "    " + label, "size": 16, "color": INK}
    ])
footer(s, 15, TOTAL)
notes(s, "Docker is in the repo as docker compose up --build. On a machine whose virtualization is off, python serve.py is the same site. Do not promise a public hosted URL. The GitHub repo is the source of truth.")

# 16 API checks
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.55), Inches(0.25), Inches(12), Inches(0.55), [
    {"text": "Four calls that prove the server.", "size": 30, "bold": True, "color": INK},
])
calls = [
    ("Sign match", "POST /api/v1/sign/translate", "{\"text\":\"ተለዋዋጭ\"}", "Returns gloss VARIABLE, the lexicon clip, and the label machine."),
    ("Braille", "GET /api/v1/lessons/python-01/document.brf", "", "A .brf file. Ethiopic grade 1 and English. The header names the tables."),
    ("Sizes", "GET /api/v1/lessons/python-01/packs", "", "Text, light, and full, in bytes, before anyone downloads."),
    ("Score", "GET /api/v1/lessons/python-01/score", "", "Captions checked, sign coverage, descriptions, offline pack ready. Also on demo/studio.html."),
]
for i, (title, path, body, why) in enumerate(calls):
    y = Inches(1.0 + i * 1.4)
    rrect(s, Inches(0.45), y, Inches(12.4), Inches(1.28), WHITE)
    box(s, Inches(0.65), y + Inches(0.1), Inches(12.0), Inches(1.1), [
        {"text": title + "    " + path, "size": 16, "bold": True, "color": GREEN, "font": "Calibri"},
        {"text": (body + "    " if body else "") + why, "size": 14, "color": INK, "before": 3},
    ])
footer(s, 16, TOTAL)
notes(s, "Swagger is at /api/docs. openapi.yaml is in the repo. A repeated progress event_id is stored once. That is FR-NET-14.")

# 17 Where the work lives
s = new(CREAM)
rect(s, Inches(0), Inches(0), W, Inches(0.12), GREEN)
box(s, Inches(0.5), Inches(0.22), Inches(12), Inches(0.5), [
    {"text": "Where each part of the promise lives.", "size": 28, "bold": True, "color": INK},
])
table = [
    ("Plug-in", "module/db-player.js", "One tag. Shadow DOM. Attributes only."),
    ("Sign clips and pairing", "demo/data/sign.json, glossary.json", "Cue id to clip. Word forms to a lexicon file."),
    ("Match", "module/deaf/gloss-match.js", "Longest form first. Labelled machine."),
    ("Hearing", "module/hearing/audio-chain.js", "Chain, boost, speed, mono, balance, say again."),
    ("Blind", "module/blind/ and api braille", "On screen, descriptions, .brf export."),
    ("Slow link", "module/net/choose.js, packs API", "Text, light, video, with byte sizes."),
    ("Jobs and badge", "module/db-job-card.js, api/pipeline/badge.py", "JobPosting. Open Badges 3.0."),
    ("Host page", "savanna/.../concept-with-navigation.html", "The plug-in sitting in the real page."),
]
for i, (a, b, c) in enumerate(table):
    y = Inches(0.85 + i * 0.72)
    color = WHITE if i % 2 == 0 else SOFT
    rect(s, Inches(0.4), y, Inches(12.5), Inches(0.72), color)
    box(s, Inches(0.5), y + Inches(0.12), Inches(2.3), Inches(0.5), [
        {"text": a, "size": 14, "bold": True, "color": GREEN}
    ])
    box(s, Inches(2.8), y + Inches(0.12), Inches(5.3), Inches(0.5), [
        {"text": b, "size": 12, "color": INK, "font": "Consolas"}
    ])
    box(s, Inches(8.2), y + Inches(0.12), Inches(4.5), Inches(0.5), [
        {"text": c, "size": 13, "color": INK}
    ])
footer(s, 17, TOTAL)
notes(s, "If a judge wants a requirement id: the first comment line of each source file names the FR ids that file implements.")

# 18 Close + honest
s = new(GREEN)
rect(s, Inches(0), Inches(0), Inches(0.18), H, GOLD)
box(s, Inches(0.7), Inches(0.4), Inches(12), Inches(0.9), [
    {"text": "ለሁሉም", "size": 36, "color": GOLD, "font": "Ebrima"},
])
box(s, Inches(0.7), Inches(1.3), Inches(12), Inches(1.3), [
    {"text": "The page they already have.", "size": 32, "bold": True, "color": WHITE},
    {"text": "The sense the lesson left out.", "size": 32, "bold": True, "color": WHITE, "before": 2},
])
honest = [
    "What a judge can run today: the sample lesson in sign, captions, hearing, description, braille, light mode, jobs, and a checkable badge.",
    "What still needs a tool or a person: automatic speech recognition, picture reading, recorded description audio, fingerspelling clips, a tagged PDF/UA file, and an NVDA or TalkBack pass.",
    "LTI 1.3 is documented. It waits for a school’s client id, deployment id, and login URL.",
]
for i, line in enumerate(honest):
    box(s, Inches(0.7), Inches(3.0 + i * 0.95), Inches(12), Inches(0.9), [
        {"text": line, "size": 16, "color": RGBColor(0xE7, 0xF2, 0xEC)}
    ])
box(s, Inches(0.7), Inches(6.15), Inches(12), Inches(0.7), [
    {"text": "github.com/mr-Ayalk/lehulum", "size": 20, "bold": True, "color": GOLD},
])
notes(s, "End here. Do not claim the missing models are running. The strength is the plug-in and the filmed signs paired to the words. Offer to open the lesson and press S.")

out = r"C:\Users\teket\Desktop\le_hulum\docs\LE-HULUM-pitch.pptx"
prs.save(out)
print(out, len(prs.slides))
