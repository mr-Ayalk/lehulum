# FR-HOH-08, FR-STU-01, NFR-SUS-01: Speech recognition with a swappable engine.
import wave
from pathlib import Path

from api.settings import asr_am, asr_en, asr_model_am_whisper, model_dir

NO_ASR = "No ASR configured. Upload a script."


class NoAsr(RuntimeError):
    """The Studio should ask for a script instead."""


def transcribe(wav, lang):
    engine = asr_am() if lang == "am" else asr_en()
    if engine == "none":
        raise NoAsr(NO_ASR)
    if engine == "faster_whisper":
        return _faster(wav, "en" if lang != "am" else "am", "small")
    if engine == "omnilingual":
        return _omnilingual(wav)
    if engine == "whisper_am":
        return _whisper_am(wav)
    raise NoAsr(f"Unknown speech engine '{engine}'. Upload a script.")


def _faster(wav, lang, model_name):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8", download_root=str(model_dir()))
    segments, _info = model.transcribe(str(wav), language=lang, word_timestamps=True, vad_filter=True)
    cues = []
    for segment in segments:
        words = []
        for word in segment.words or []:
            words.append({"w": word.word.strip(), "start": float(word.start), "end": float(word.end),
                          "p": None if word.probability is None else float(word.probability)})
        cues.append({"text": segment.text.strip(), "start": float(segment.start),
                     "end": float(segment.end), "words": [word for word in words if word["w"]]})
    return cues


def _whisper_am(wav):
    model_id = asr_model_am_whisper()
    if not model_id:
        raise NoAsr("No commercially licensed Amharic Whisper model is set.")
    try:
        return _faster(wav, "am", model_id)
    except Exception as first:
        return _transformers(wav, model_id, first)


def _transformers(wav, model_id, first):
    try:
        import torch
        from transformers import pipeline
    except ImportError as exc:
        raise NoAsr(
            "faster-whisper is installed, but this checkpoint is not a local CTranslate2 model, "
            "and transformers is not installed. " + str(first)
        ) from exc
    pipe = pipeline("automatic-speech-recognition", model=model_id, device="cpu",
                    model_kwargs={"cache_dir": str(model_dir())})
    result = pipe(str(wav), return_timestamps="word")
    chunks = result.get("chunks") or []
    if not chunks:
        return [{"text": result.get("text", "").strip(), "start": 0.0, "end": _duration(wav), "words": []}]
    words = []
    for chunk in chunks:
        span = chunk.get("timestamp") or (0.0, 0.0)
        words.append({"w": chunk.get("text", "").strip(), "start": float(span[0] or 0),
                      "end": float(span[1] or span[0] or 0), "p": None})
    text = " ".join(word["w"] for word in words)
    return [{"text": text, "start": words[0]["start"], "end": words[-1]["end"], "words": words}]


def _omnilingual(wav):
    from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline
    pipe = ASRInferencePipeline(model_card="omniASR_CTC_300M")
    pieces = []
    for start, end, path in _chunks(wav):
        text = pipe.transcribe([str(path)], batch_size=1)[0].strip()
        pieces.append({"text": text, "start": start, "end": end, "words": []})
        if path != Path(wav):
            Path(path).unlink(missing_ok=True)
    return pieces


def _chunks(wav, limit=30.0):
    total = _duration(wav)
    if total <= 40:
        return [(0.0, total, wav)]
    import subprocess
    out = []
    start = 0.0
    while start < total:
        end = min(total, start + limit)
        path = Path(wav).with_name(f"chunk-{start:.0f}.wav")
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
             "-ss", str(start), "-t", str(end - start), "-ac", "1", "-ar", "16000", str(path)],
            check=True)
        out.append((start, end, path))
        start = end
    return out


def _duration(wav):
    with wave.open(str(wav)) as handle:
        return handle.getnframes() / float(handle.getframerate())
