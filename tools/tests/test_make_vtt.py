# FR-CAP-01, FR-HOH-09: Dynamic-programming boundary selection.
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import vtt_align as align


class AlignTests(unittest.TestCase):
    def test_syllables_ignore_punctuation(self):
        self.assertEqual(align.syllables("ሰላም"), 3)
        self.assertEqual(align.syllables("ሰላም፣ እንኳን።"), 7)
        self.assertAlmostEqual(align.syllables("name"), 4 / 3)
        self.assertAlmostEqual(align.syllables("ሀ name"), 1 + 4 / 3)
        self.assertEqual(align.syllables(" ,."), 0)

    def test_dp_skips_false_pauses(self):
        pauses = [(1.00, 1.12), (2.80, 3.30), (4.90, 5.04), (5.80, 5.95), (7.20, 7.80)]
        texts = ["ሀ" * 6, "ሀ" * 9, "ሀ" * 9]
        expected = align.expected_durations(texts, 12)
        chosen = align.choose_boundaries(pauses, 0, 12, expected, True)
        self.assertEqual(chosen, [1, 4])
        cues = align.cue_times(pauses, chosen, 0, 12, 12)
        self.assertEqual(len(cues), 3)
        for i in range(len(cues) - 1):
            self.assertLessEqual(cues[i][1], cues[i + 1][0])
        self.assertAlmostEqual(cues[0][0], 0.0)
        self.assertAlmostEqual(cues[0][1], 2.95)
        self.assertAlmostEqual(cues[1][0], 3.25)

    def test_hard_limit_rejects_short_line(self):
        pauses = [(0.90, 1.10)]
        self.assertIsNone(align.choose_boundaries(pauses, 0, 10, [5, 5], True))
        self.assertEqual(align.choose_boundaries(pauses, 0, 10, [5, 5], False), [0])

    def test_short_pause_does_not_overlap(self):
        cues = align.cue_times([(2.00, 2.10)], [0], 0, 5, 6)
        self.assertLessEqual(cues[0][1], cues[1][0])
        self.assertAlmostEqual(cues[1][0], 2.05)


if __name__ == "__main__":
    unittest.main()
