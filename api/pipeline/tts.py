# FR-BLV-11, FR-IN-05, FR-JOB-02: Speech through one function. espeak-ng when it is installed.
import shutil
import subprocess
from pathlib import Path


def render(text, lang, dest):
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    wav = dest.with_suffix(".wav")
    if not _espeak(text, "am" if lang == "am" else "en", wav):
        return False
    program = shutil.which("ffmpeg")
    if not program:
        return False
    result = subprocess.run(
        [program, "-y", "-i", str(wav), "-c:a", "libopus", "-b:a", "24k", "-ac", "1", str(dest)],
        capture_output=True)
    wav.unlink(missing_ok=True)
    return result.returncode == 0 and dest.is_file() and dest.stat().st_size > 0


def _espeak(text, voice, wav):
    program = shutil.which("espeak-ng") or shutil.which("espeak")
    if not program or not text.strip():
        return False
    result = subprocess.run([program, "-v", voice, "-w", str(wav), text], capture_output=True)
    return result.returncode == 0 and wav.is_file() and wav.stat().st_size > 44
