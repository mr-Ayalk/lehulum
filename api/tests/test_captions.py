# NFR-QA-01, FR-HOH-09, FR-HOH-11: Caption line rules on synthetic words.
from api.pipeline.captions import cues_from_words, write_vtt


def _word(text, start, end, score=1):
    return {"w": text, "start": start, "end": end, "p": score}


def _span(cues):
    return [(cue["end"] - cue["start"]) for cue in cues]


def test_pause_and_sentence_break_cues():
    paused = cues_from_words([_word("one", 0.0, 1.2), _word("two", 1.6, 2.8)])
    assert len(paused) == 2
    ended = cues_from_words([
        _word("Hello", 0.0, 0.6), _word("there.", 0.6, 1.2), _word("Next", 1.2, 2.5),
    ])
    assert [cue["lines"] for cue in ended] == [["Hello there."], ["Next"]]


def test_length_and_duration_limits():
    long_text = cues_from_words([
        _word("abcdefghij", index * 0.8, (index + 1) * 0.8) for index in range(10)
    ])
    assert len(long_text) >= 2
    assert all(len(cue["lines"]) <= 2 for cue in long_text)
    assert all(len(line) <= 42 for cue in long_text for line in cue["lines"])
    long_time = cues_from_words([_word("w", index, index + 1) for index in range(8)])
    assert all(1 <= end - start <= 7 for start, end in ((cue["start"], cue["end"]) for cue in long_time))
    short = cues_from_words([
        _word("a", 0.0, 0.4), _word("b", 0.4, 0.8), _word("c", 0.8, 1.3),
    ])
    assert len(short) == 1
    assert short[0]["end"] - short[0]["start"] >= 1


def test_low_confidence_tag_and_ids(tmp_path):
    cues = cues_from_words([
        _word("sure", 0.0, 0.6, 0.9),
        _word("maybe", 0.6, 1.2, 0.4),
        _word("blank", 1.2, 1.8, None),
    ])
    assert cues[0]["id"] == "C001"
    text = " ".join(cues[0]["lines"])
    assert "<c.low>maybe</c>" in text
    assert "<c.low>sure</c>" not in text
    assert "<c.low>blank</c>" not in text
    for index in range(len(cues) - 1):
        assert cues[index]["end"] <= cues[index + 1]["start"]
    path = tmp_path / "captions.vtt"
    write_vtt(path, cues)
    body = path.read_text(encoding="utf-8")
    assert body.startswith("WEBVTT")
    assert "<v Teacher>" in body
    assert "<c.low>maybe</c>" in body
