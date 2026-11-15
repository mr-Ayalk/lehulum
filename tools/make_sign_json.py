#!/usr/bin/env python3
# FR-DEAF-05, FR-SL-07: Build sign.json and trim idle from each memory clip.
import argparse, json, os, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_by_pause import duration, read_frames  # noqa: E402
from sign_motion import absolute_motion, trim_bounds  # noqa: E402
from sign_sheet import save_sheet  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schemas" / "sign.schema.json"


def parse_ts(value):
    parts = value.strip().split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    if len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return float(parts[0])


def parse_vtt(text):
    cues = []
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    for index, line in enumerate(lines):
        if "-->" not in line:
            continue
        start, end = [parse_ts(part.strip().split()[0]) for part in line.split("-->")]
        cue = lines[index - 1].strip() if index and lines[index - 1].strip() else f"C{len(cues) + 1:02d}"
        cues.append((cue, start, end))
    return cues


def measure_file(path):
    return duration(path), absolute_motion(read_frames(path))


def assemble(cues, present, json_path, folder, measure):
    segments, rows = [], []
    for cue, start, end in cues:
        lesson = round(end - start, 3)
        if cue not in present:
            segments.append({"cue": cue, "start": round(start, 3), "end": round(end, 3), "source": "none"})
            rows.append((cue, lesson, 0.0, None, None, 0.0, "missing", None, None, None))
            continue
        total, motion = measure(folder / f"{cue}.mp4")
        frm, to, note, high, low = trim_bounds(motion, total)
        signing = round(to - frm, 3)
        src = Path(os.path.relpath(folder / f"{cue}.mp4", json_path.parent)).as_posix()
        segments.append({
            "cue": cue, "start": round(start, 3), "end": round(end, 3), "source": "memory",
            "src": src, "from": frm, "to": to, "duration": signing
        })
        rows.append((cue, lesson, round(total, 3), frm, to, signing, note, motion, high, low))
    return {"version": 1, "lesson": "lesson.mp4", "lang": "am", "segments": segments}, rows


def check_type(value, rule):
    kind = rule.get("type")
    if kind == "string":
        return isinstance(value, str)
    if kind == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if kind == "array":
        return isinstance(value, list)
    return isinstance(value, dict) if kind == "object" else True


def validate(doc, schema=None):
    schema = schema or json.loads(SCHEMA.read_text(encoding="utf-8"))
    errors = []
    if not isinstance(doc, dict):
        return ["document is not an object"]
    for key in doc:
        if key not in schema["properties"]:
            errors.append(f"unexpected {key}")
    for key in schema["required"]:
        if key not in doc:
            errors.append(f"missing {key}")
    if doc.get("version") != 1:
        errors.append("version")
    seg_rule = schema["$defs"]["segment"]
    for index, seg in enumerate(doc.get("segments") or []):
        label = f"segments[{index}]"
        if not isinstance(seg, dict):
            errors.append(label)
            continue
        for key in seg:
            if key not in seg_rule["properties"]:
                errors.append(f"{label}.{key}")
        for key in ("cue", "start", "end", "source"):
            if key not in seg:
                errors.append(f"{label} missing {key}")
        if seg.get("source") not in ("memory", "engine", "none"):
            errors.append(f"{label} source")
        if seg.get("source") == "memory":
            for key in ("src", "from", "to", "duration"):
                if key not in seg:
                    errors.append(f"{label} missing {key}")
            if "playlist" in seg:
                errors.append(f"{label} playlist")
        elif seg.get("source") == "engine":
            if not seg.get("playlist") or "duration" not in seg:
                errors.append(f"{label} playlist")
        elif "src" in seg or "playlist" in seg:
            errors.append(f"{label} extra")
        for key, rule in seg_rule["properties"].items():
            if key in seg and not check_type(seg[key], rule):
                errors.append(f"{label}.{key} type")
    return errors


def report_text(rows, old):
    head = "| cue | lesson s | old from | new from | old to | new to | old signing | new signing |"
    line = "|---|---:|---:|---:|---:|---:|---:|---:|"
    body, totals = [], [0.0, 0.0, 0.0]
    for cue, lesson, _raw, frm, to, signing, note, _motion, _high, _low in rows:
        prev = old.get(cue, {})
        totals[0] += lesson
        totals[1] += float(prev.get("duration") or 0)
        totals[2] += signing
        mark = f" {note}" if note else ""
        body.append(
            f"| {cue}{mark} | {lesson:.2f} | {prev.get('from', '')} | {'' if frm is None else f'{frm:.2f}'} | "
            f"{prev.get('to', '')} | {'' if to is None else f'{to:.2f}'} | {prev.get('duration', '')} | {signing:.2f} |")
    body.append(f"| total | {totals[0]:.2f} |  |  |  |  | {totals[1]:.2f} | {totals[2]:.2f} |")
    intro = "Ends-only trim. Each clip sets high and low from its own 10th and 90th percentiles. Interior pauses stay. A clip with no clear signing is marked flagged."
    return "\n".join(["# Sign trim", "", intro, "", head, line, *body, ""])


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("vtt")
    parser.add_argument("folder")
    parser.add_argument("output")
    parser.add_argument("--report", default=str(ROOT / "docs" / "sign-trim-report.md"))
    parser.add_argument("--frames", default=str(ROOT / "docs" / "sign-trim"))
    args = parser.parse_args(argv)
    vtt, folder, output = Path(args.vtt), Path(args.folder), Path(args.output)
    old = {}
    if output.exists():
        old = {seg["cue"]: seg for seg in json.loads(output.read_text(encoding="utf-8")).get("segments", [])}
    cues = parse_vtt(vtt.read_text(encoding="utf-8"))
    present = {cue for cue, _start, _end in cues if (folder / f"{cue}.mp4").is_file()}
    doc, rows = assemble(cues, present, output, folder, measure_file)
    errors = validate(doc)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 2
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    frames = Path(args.frames)
    for cue, _lesson, raw, frm, to, _signing, note, motion, high, low in rows:
        if note == "missing" or frm is None or motion is None:
            continue
        save_sheet(folder / f"{cue}.mp4", motion, high, low, frm, to, frames / f"{cue}-sheet.png", raw, cue)
    text = report_text(rows, old)
    Path(args.report).write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
