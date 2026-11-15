# FR-DEAF-09, FR-DEAF-11, FR-SL-15: Build glossary.json from words that appear in this lesson.
import csv
import json
import re
import sys
from pathlib import Path

from cut_by_pause import duration, read_frames
from sign_motion import absolute_motion, trim_bounds

PREFIXES = ("የሚ", "በሚ", "ለሚ", "የመ", "እንደ", "ስለ", "እን", "እና", "ስን", "የ", "በ", "ለ", "ከ", "ይ", "ያ", "ት", "ታ", "ሲ", "ሚ", "መ")
SUFFIXES = ("ላለች", "ዎችን", "ላሉ", "ዎቹ", "ለን", "ላል", "ለሁ", "ዎች", "ው", "ዋ", "ኡ", "ን", "ም")
SCHEMA = Path(__file__).resolve().parents[1] / "schemas" / "glossary.schema.json"


def consonants(text):
    out = []
    for char in text:
        code = ord(char)
        if 0x1200 <= code <= 0x135F:
            out.append(code - (code - 0x1200) % 8)
    return tuple(out)


def related(text, want):
    got = consonants(text)
    if got == want:
        return True
    return len(want) >= 3 and len(got) >= len(want) and got[:len(want)] == want


def peel(token, lemma):
    word = token
    guard = max(2, len(consonants(lemma)))
    want = consonants(lemma)
    while len(consonants(word)) > guard:
        found = []
        for prefix in PREFIXES:
            rest = word[len(prefix):]
            if word.startswith(prefix) and len(consonants(rest)) >= guard and related(rest, want):
                found.append(rest)
                break
        for suffix in SUFFIXES:
            rest = word[:-len(suffix)]
            if word.endswith(suffix) and len(consonants(rest)) >= guard and related(rest, want):
                found.append(rest)
                break
        if not found:
            break
        word = next((item for item in found if consonants(item) == want), found[0])
    return word


def am_match(token, lemma):
    if not token or not lemma:
        return False
    if token == lemma:
        return True
    stem = peel(token, lemma)
    if stem == lemma or consonants(stem) == consonants(lemma):
        return True
    got, want = consonants(stem), consonants(lemma)
    return len(want) >= 3 and len(got) >= len(want) and got[:len(want)] == want


def en_pattern(word):
    return re.compile(rf"\b{re.escape(word)}(?:es|s)?\b", re.I)


def read_cues(path):
    cues = []
    for block in re.split(r"\n\s*\n", Path(path).read_text(encoding="utf-8").strip()):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) < 3 or "-->" not in lines[1]:
            continue
        text = re.sub(r"<[^>]+>", "", " ".join(lines[2:]))
        cues.append((lines[0], text))
    return cues


def english_hits(text, word):
    return [match.group(0) for match in en_pattern(word).finditer(text)]


def amharic_hits(text, lemma, extras=()):
    extra = {item for item in extras if item}
    return [token for token in re.findall(r"[\u1200-\u135A]+", text) if token in extra or am_match(token, lemma)]


def clip_file(folder, row):
    for name in (row["id"], row["id"].lower(), row["en"].lower()):
        path = Path(folder) / f"{name}.mp4"
        if path.is_file():
            return path
    return None


def clip_bounds(path, label):
    start, end, note, _high, _low = trim_bounds(absolute_motion(read_frames(path)), duration(path))
    if note == "" and abs((end - start) - 0.8) <= 0.02:
        print(f"MIN_KEEP {label} {end - start:.2f}s is the 0.80 s floor")
    return start, end


def keep(group, cues):
    return bool(cues) or group == "core"


def validate(doc):
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    required = schema["properties"]["terms"]["items"]["required"]
    if doc.get("version") != schema["properties"]["version"]["const"]:
        raise SystemExit("glossary version")
    if not isinstance(doc.get("lesson"), str) or not doc["lesson"]:
        raise SystemExit("glossary lesson")
    if not isinstance(doc.get("terms"), list):
        raise SystemExit("glossary terms")
    for term in doc["terms"]:
        missing = [key for key in required if key not in term]
        if missing or not isinstance(term["from"], (int, float)) or not isinstance(term["to"], (int, float)):
            raise SystemExit("glossary term " + ",".join(missing or ["from"]))
        if term["to"] < term["from"]:
            raise SystemExit("glossary range " + term["id"])


def build(words, lexicon, am_path, en_path):
    am_cues, en_cues = read_cues(am_path), read_cues(en_path)
    terms = []
    with Path(words).open(encoding="utf-8", newline="") as handle:
        for raw in csv.DictReader(handle):
            row = {"id": raw.get("id") or raw["gloss"], "en": raw["en"], "am": raw["am"], "group": raw["group"]}
            extras = [part for part in (raw.get("forms_am_extra") or "").split("|") if part]
            forms_en, forms_am, cues = [], [], []
            for cid, text in en_cues:
                hits = english_hits(text, row["en"])
                if hits:
                    cues.append(cid)
                    for hit in hits:
                        if hit.lower() not in [item.lower() for item in forms_en]:
                            forms_en.append(hit)
            for cid, text in am_cues:
                hits = amharic_hits(text, row["am"], extras)
                if not hits:
                    continue
                if cid not in cues:
                    cues.append(cid)
                for hit in hits:
                    if hit not in forms_am:
                        forms_am.append(hit)
            if not keep(row["group"], cues):
                continue
            path = clip_file(lexicon, row)
            start, end = clip_bounds(path, row["id"]) if path else (0, 0)
            start, end = round(float(start), 2), round(float(end), 2)
            sign = f"lexicon/{path.name}" if path else ""
            cues.sort()
            terms.append({
                "id": row["id"], "am": row["am"], "en": row["en"], "group": row["group"],
                "sign": sign, "from": start, "to": end, "forms_am": forms_am, "forms_en": forms_en,
                "cues": cues
            })
    lesson = Path(en_path).stem
    if lesson.endswith(".en") or lesson.endswith(".am"):
        lesson = lesson.rsplit(".", 1)[0]
    return {"version": 1, "lesson": lesson, "terms": terms}


def print_table(doc):
    print("id | am | en | cues | forms found | clip s")
    for term in doc["terms"]:
        forms = " ".join(term["forms_am"] + term["forms_en"]) or "-"
        span = f"{term['to'] - term['from']:.2f}" if term["sign"] else "missing"
        print(f"{term['id']} | {term['am']} | {term['en']} | {' '.join(term['cues']) or '-'} | {forms} | {span}")


def main(argv):
    words, lexicon, am_path, en_path, output = argv[1:6]
    doc = build(words, lexicon, am_path, en_path)
    validate(doc)
    Path(output).write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print_table(doc)


if __name__ == "__main__":
    main(sys.argv)
