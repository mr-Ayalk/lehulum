# FR-DEAF-09, FR-DEAF-11: Affixed Amharic, whole English words, and a missing clip.
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import make_glossary as gloss


class GlossaryMatchTests(unittest.TestCase):
    def test_amharic_affixes(self):
        self.assertTrue(gloss.am_match("ተለዋዋጮች", "ተለዋዋጭ"))
        self.assertTrue(gloss.am_match("የተለዋዋጩ", "ተለዋዋጭ"))
        self.assertTrue(gloss.am_match("ክፈቱ", "ክፈት"))
        self.assertTrue(gloss.am_match("በስክሪን", "ስክሪን"))
        self.assertEqual(gloss.peel("በስክሪን", "ስክሪን"), "ስክሪን")
        self.assertEqual(gloss.amharic_hits("የተለዋዋጩ ስም", "ተለዋዋጭ"), ["የተለዋዋጩ"])
        self.assertTrue(gloss.am_match("እንጀምር", "ጀምር"))
        self.assertTrue(gloss.am_match("ጀምሩ", "ጀምር"))
        self.assertTrue(gloss.am_match("በሚቀጥለው", "ቀጥሎ"))
        self.assertEqual(gloss.amharic_hits("እናሳያለን", "አሳይ", ["እናሳያለን"]), ["እናሳያለን"])

    def test_english_whole_word(self):
        self.assertEqual(gloss.english_hits("we will learn about variables.", "variable"), ["variables"])
        self.assertEqual(gloss.english_hits("the variable name is name", "name"), ["name", "name"])
        self.assertEqual(gloss.english_hits("a database of data", "data"), ["data"])
        self.assertEqual(gloss.english_hits("created a variable", "create"), [])

    def test_missing_clip_is_kept(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "words.csv").write_text(
                "gloss,en,am,group\nMISSING,missing,የለም,core\nABSENT,database,መረጃ,tech\n",
                encoding="utf-8")
            (root / "en.vtt").write_text("WEBVTT\n\nA01\n00:00:00.000 --> 00:00:01.000\nHello.\n", encoding="utf-8")
            (root / "am.vtt").write_text("WEBVTT\n\nA01\n00:00:00.000 --> 00:00:01.000\nሰላም።\n", encoding="utf-8")
            doc = gloss.build(root / "words.csv", root / "lexicon", root / "am.vtt", root / "en.vtt")
        self.assertEqual([term["id"] for term in doc["terms"]], ["MISSING"])
        self.assertEqual(doc["terms"][0]["sign"], "")
        self.assertEqual(doc["terms"][0]["from"], 0)
        self.assertEqual(doc["terms"][0]["to"], 0)


if __name__ == "__main__":
    unittest.main()
