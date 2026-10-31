"""Tests for the cross-validation and record helpers of the build."""

lazy from typing import Final

lazy from build_data import (
    document,
    explanation_problems,
    explanation_texts,
    wording_problems,
)
lazy from pdf_text import OfficialQuestion
lazy from sources import ExplanationEntry, KeyEntry

OFFICIAL: Final = OfficialQuestion("g9", "g", 9, 3, "Was gilt?", "", ("ja", "nein", "nie", "oft"))
KEY: Final = KeyEntry("g9", "g", "Was gilt?", ("ja", "nein", "nie", "oft"), 0, has_picture=False)


def test_wording_must_match_the_pdf() -> None:
    assert wording_problems(KEY, OFFICIAL) == []
    other = KeyEntry("g9", "g", "Was gilt nicht?", KEY.options, 0, has_picture=False)
    assert wording_problems(other, OFFICIAL) == ["g9: wording differs from the PDF"]


def test_explanation_must_name_the_official_answer() -> None:
    right = ExplanationEntry("Yes.", "Ja.", "ja")
    wrong = ExplanationEntry("No.", "Nein.", "nein")
    assert explanation_problems(KEY, OFFICIAL, right) == []
    assert explanation_problems(KEY, OFFICIAL, wrong) == [
        "g9: explanation names another answer ('nein')",
    ]


def test_explanation_texts_drop_boilerplate_and_apply_overrides() -> None:
    boilerplate = ExplanationEntry("Because.", "Die richtige Antwort ist: ja", "ja")
    assert explanation_texts("g9", boilerplate) == ("Because.", None)
    english, german = explanation_texts("HB4", boilerplate)
    assert english.startswith("Bremen lowered the voting age")
    assert german is not None


def test_document_lists_all_sixteen_states() -> None:
    states = document([])["states"]
    assert isinstance(states, list)
    assert len(states) == 16
