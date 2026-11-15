#!/usr/bin/env python3
# NFR-QA-02, FR-HOH-08, NFR-LIC-02: Score configured Amharic engines on the sample lesson.
import csv
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from api.pipeline.asr import transcribe  # noqa: E402
from api.pipeline.audio import extract  # noqa: E402

PHRASES = ROOT / "demo/data/phrases.csv"
VIDEO = ROOT / "demo/data/lesson.mp4"
OUT = ROOT / "docs/asr-eval.md"
HOMO = str.maketrans({
    "ሃ": "ሀ", "ሐ": "ሀ", "ሓ": "ሀ", "ኀ": "ሀ", "ኃ": "ሀ", "ኻ": "ሀ",
    "ኣ": "አ", "ዐ": "አ", "ዓ": "አ",
    "ሠ": "ሰ", "ሡ": "ሱ", "ሢ": "ሲ", "ሣ": "ሳ", "ሤ": "ሴ", "ሥ": "ስ", "ሦ": "ሶ",
    "ፀ": "ጸ", "ፁ": "ጹ", "ፂ": "ጺ", "ፃ": "ጻ", "ፄ": "ጼ", "ፅ": "ጽ", "ፆ": "ጾ",
})
PUNCT = set("።፣፤፥፦፧፡፨.,?!;:\"'()[]«»“”‘’-/")
ENGINES = [
    ("omnilingual", "omniASR_CTC_300M", "Apache-2.0"),
    ("whisper_am", "waxal-benchmarking/whisper-tiny-waxal-amh", "CC-BY-4.0"),
]


def reference():
    lines = []
    with PHRASES.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row["id"].startswith("A"):
                lines.append(row["text_am"])
    return lines[:14]


def normalise(text):
    text = text.translate(HOMO)
    text = "".join(ch for ch in text if ch not in PUNCT)
    return " ".join(text.split())


def edits(left, right):
    previous = list(range(len(right) + 1))
    for i, item in enumerate(left, 1):
        current = [i]
        for j, other in enumerate(right, 1):
            current.append(min(previous[j] + 1, current[-1] + 1, previous[j - 1] + (item != other)))
        previous = current
    return previous[-1]


def rate(ref, hyp, split):
    left, right = split(ref), split(hyp)
    if not left:
        return 0.0
    return edits(left, right) / len(left)


def run_engine(wav, name):
    import os
    os.environ["ASR_AM"] = name
    started = time.perf_counter()
    try:
        segments = transcribe(wav, "am")
        seconds = time.perf_counter() - started
        text = " ".join(segment.get("text", "") for segment in segments).strip()
        return text, seconds, ""
    except Exception as exc:
        return "", time.perf_counter() - started, str(exc)


def main():
    lines = reference()
    ref = normalise(" ".join(lines))
    wav, _duration = extract(VIDEO, Path("/tmp/lehulum-eval.wav"))
    rows, examples = [], []
    for name, model, licence in ENGINES:
        text, seconds, error = run_engine(wav, name)
        if error or not text:
            rows.append((name, model, licence, "n/a", "n/a", f"{seconds:.1f}", error or "empty transcript"))
            examples.append((name, error or "empty transcript"))
            continue
        hyp = normalise(text)
        wer = rate(ref, hyp, str.split)
        cer = rate(ref, hyp, list)
        rows.append((name, model, licence, f"{wer:.3f}", f"{cer:.3f}", f"{seconds:.1f}", ""))
        hyp_bits = hyp.split()
        step = max(1, len(hyp_bits) // 3)
        examples.append((name, [(lines[i], " ".join(hyp_bits[i * step:(i + 1) * step])) for i in range(3)]))
    lines_out = [
        "# Amharic ASR on demo/data/lesson.mp4",
        "",
        "Scored against phrases.csv A01–A14 after removing punctuation and folding common homophone letters (ሀ/ሃ/ሐ/ኀ, አ/ኣ/ዐ, ሰ/ሠ, ጸ/ፀ). That normalisation is for the score only.",
        "",
        "| Engine | Model | Licence | WER | CER | Seconds | Note |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        lines_out.append("| " + " | ".join(row) + " |")
    lines_out += ["", "## Examples", ""]
    for name, payload in examples:
        lines_out.append(f"### {name}")
        lines_out.append("")
        if isinstance(payload, str):
            lines_out.append(payload)
            lines_out.append("")
            continue
        for index, (gold, guess) in enumerate(payload, 1):
            lines_out.append(f"{index}. Reference: {gold}")
            lines_out.append(f"   Engine: {guess or '(no words)'}")
            lines_out.append("")
    OUT.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    print(OUT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
