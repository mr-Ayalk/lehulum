# NFR-QA-01: Shared pytest fixtures. No network and no real learner data.
import pytest


@pytest.fixture()
def data_root(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("ASR_AM", "none")
    monkeypatch.setenv("ASR_EN", "none")
    monkeypatch.setenv("TRANSLATE", "none")
    return tmp_path
