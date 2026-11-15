# FR-HOH-08, FR-HOH-11: Align known text to audio. Fall back to the pause DP.
import importlib.util
import subprocess
from pathlib import Path

_TOOLS = Path(__file__).resolve().parents[2] / "tools" / "vtt_align.py"


def align_text(wav, texts, lang):
    lines = [text.strip() for text in texts if text and text.strip()]
    if not lines:
        raise RuntimeError("The script is empty.")
    try:
        return _ctc_align(wav, lines, lang)
    except Exception:
        return _dp_align(wav, lines)


def _vtt_align():
    spec = importlib.util.spec_from_file_location("lehulum_vtt_align", _TOOLS)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _silences(wav, noise, pause):
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(wav),
         "-af", f"silencedetect=noise={noise}dB:d={pause}", "-f", "null", "-"],
        capture_output=True, text=True)
    starts, spans = [], []
    for line in proc.stderr.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].strip()))
        elif "silence_end:" in line and starts:
            end = float(line.split("silence_end:")[1].split("|")[0].strip())
            spans.append((starts.pop(0), end))
    return spans


def _duration(wav):
    import wave
    with wave.open(str(wav)) as handle:
        return handle.getnframes() / float(handle.getframerate())


def _dp_align(wav, lines):
    module = _vtt_align()
    found = module.align_cues(_silences(wav, module.DP_NOISE, module.DP_PAUSE), _duration(wav), lines)
    if not found or len(found["cues"]) != len(lines):
        raise RuntimeError("Could not align the script to the pauses in the audio.")
    return [{"text": text, "start": start, "end": end, "words": []}
            for text, (start, end) in zip(lines, found["cues"])]


def _romanise(text):
    try:
        from uroman import Uroman
    except ImportError as exc:
        raise RuntimeError("uroman is not installed.") from exc
    return Uroman().romanize_string(text)


def _ctc_align(wav, lines, lang):
    """Use torchaudio forced_align when an Apache-2.0 CTC model is installed."""
    import torchaudio.functional as audio_fn
    if not hasattr(audio_fn, "forced_align"):
        raise RuntimeError("This torchaudio build has no forced aligner.")
    try:
        from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline
    except ImportError as exc:
        raise RuntimeError("Omnilingual CTC is not installed.") from exc
    pipe = ASRInferencePipeline(model_card="omniASR_CTC_300M")
    if not hasattr(pipe, "forced_align"):
        raise RuntimeError("Omnilingual has no public forced-align method.")
    script = "\n".join(lines)
    aligned = pipe.forced_align(str(wav), _romanise(script) if lang == "am" else script)
    return aligned
