# NFR-PRIV-06, NFR-LIC-02, FR-HOH-08: Provider switches. Nothing is downloaded here.
import os
from pathlib import Path


def _env(name, default):
    return os.environ.get(name, default).strip()


def asr_am():
    return _env("ASR_AM", "none")


def asr_en():
    return _env("ASR_EN", "faster_whisper")


def asr_model_am_whisper():
    # Apache-2.0 Amharic fine-tune. See docs/models.md.
    return _env("ASR_MODEL_AM_WHISPER", "waxal-benchmarking/whisper-tiny-waxal-amh")


def translate_engine():
    return _env("TRANSLATE", "none")


def data_dir():
    return Path(_env("DATA_DIR", "data"))


def model_dir():
    path = data_dir() / "models"
    path.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(path))
    return path
