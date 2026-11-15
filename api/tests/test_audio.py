# NFR-QA-01, FR-STU-01: Audio extraction from the sample lesson.
import wave
from pathlib import Path

from api.pipeline.audio import extract

LESSON = Path(__file__).resolve().parents[2] / "demo" / "data" / "lesson.mp4"


def test_lesson_wav_is_mono_16k(tmp_path):
    path, duration = extract(LESSON, tmp_path / "lesson.wav")
    assert path.exists()
    assert 40 < duration < 50
    with wave.open(str(path)) as handle:
        assert handle.getnchannels() == 1
        assert handle.getframerate() == 16000
