# FR-STU-01, FR-HOH-08: Extract mono 16 kHz speech from an uploaded video.
import subprocess
import wave
from pathlib import Path


def extract(source, dest):
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
         "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(dest)],
        capture_output=True, text=True)
    if proc.returncode != 0 or not dest.exists():
        raise RuntimeError("Could not read the audio from that video.")
    with wave.open(str(dest)) as handle:
        if handle.getnchannels() != 1 or handle.getframerate() != 16000:
            raise RuntimeError("The extracted audio is not mono 16 kHz.")
        duration = handle.getnframes() / float(handle.getframerate())
    return dest, duration
