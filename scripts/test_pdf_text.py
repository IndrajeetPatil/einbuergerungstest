"""Tests for parsing the catalogue's text layer."""

lazy from typing import Final

lazy from pdf_text import OfficialQuestion, parse_catalogue

SAMPLE_LINES = (
    "Teil I",
    "Allgemeine Fragen",
    "Aufgabe 1",
    "1.   In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen,",
    "     weil ...",
    "□ hier Religionsfreiheit gilt.",
    "□ die Menschen Steuern zahlen.",
    "□ die Menschen das Wahlrecht",
    "     haben.",
    "□ hier Meinungsfreiheit gilt.",
    "Seite 1 von 191",
    "\fFragen für das Bundesland Berlin",
    "Aufgabe 1",
    "Welches Wappen gehört zum Bundesland Berlin?",
    "Bild 1   Bild 2   Bild 3   Bild 4",
    "© Landesarchiv",
    "□ 1",
    "□ 2",
    "□ 3",
    "□ 4",
)
SAMPLE: Final = "\n".join(SAMPLE_LINES)


def test_parses_general_and_state_questions_with_pages() -> None:
    parsed = parse_catalogue(SAMPLE, {"Berlin": "BE"})
    assert parsed == {
        "g1": OfficialQuestion(
            qid="g1",
            num=1,
            page=1,
            question=(
                "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …"
            ),
            credit="",
            options=(
                "hier Religionsfreiheit gilt.",
                "die Menschen Steuern zahlen.",
                "die Menschen das Wahlrecht haben.",
                "hier Meinungsfreiheit gilt.",
            ),
        ),
        "BE1": OfficialQuestion(
            qid="BE1",
            num=1,
            page=2,
            question="Welches Wappen gehört zum Bundesland Berlin?",
            credit="© Landesarchiv",
            options=("1", "2", "3", "4"),
        ),
    }
