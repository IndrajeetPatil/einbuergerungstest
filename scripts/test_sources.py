"""Tests for reading and verifying the pinned sources."""

lazy import hashlib
lazy from pathlib import Path

lazy import pytest

lazy from sources import (
    PDF_SHA256,
    SourceError,
    Translation,
    answer_key,
    as_int,
    explanations,
    translations,
    verify_pdf,
)


def test_verify_pdf_accepts_the_pinned_edition_only(tmp_path: Path) -> None:
    pdf = tmp_path / "katalog.pdf"
    pdf.write_bytes(b"catalogue")
    verify_pdf(pdf, hashlib.sha256(b"catalogue").hexdigest())
    with pytest.raises(SourceError, match="new catalogue edition"):
        verify_pdf(pdf)


def test_answer_key_rejects_another_edition() -> None:
    with pytest.raises(SourceError, match="different catalogue edition"):
        answer_key({"source": {"pdf_sha256": "other"}, "general": [], "states": {}})


def test_answer_key_reads_general_questions() -> None:
    entry = {"id": "g1", "q": "Frage?", "o": ["a", "b", "c", "d"], "a": 3, "img": None}
    states = {
        code: {"questions": []}
        for code in ([
            "BW",
            "BY",
            "BE",
            "BB",
            "HB",
            "HH",
            "HE",
            "MV",
            "NI",
            "NW",
            "RP",
            "SL",
            "SN",
            "ST",
            "SH",
            "TH",
        ])
    }
    key = answer_key({"source": {"pdf_sha256": PDF_SHA256}, "general": [entry], "states": states})
    assert [(item.qid, item.answer, item.has_picture) for item in key] == [("g1", 3, False)]


def test_translations_are_keyed_by_id() -> None:
    assert translations({"g1": {"q": "Question?", "o": ["a", "b"]}}) == {
        "g1": Translation("Question?", ("a", "b")),
    }


def test_explanations_record_the_correct_option() -> None:
    general = {
        "id": 7,
        "exp_en": "Because.",
        "exp_de": "Weil.",
        "options": [{"de": "nein"}, {"de": "ja"}],
        "correct": 1,
    }
    slugs = [
        "baden-wuerttemberg",
        "bayern",
        "berlin",
        "brandenburg",
        "bremen",
        "hamburg",
        "hessen",
        "mecklenburg-vorpommern",
        "niedersachsen",
        "nordrhein-westfalen",
        "rheinland-pfalz",
        "saarland",
        "sachsen",
        "sachsen-anhalt",
        "schleswig-holstein",
        "thueringen",
    ]
    data = {"general": [general], "states": {slug: {"questions": []} for slug in slugs}}
    assert explanations(data)["g7"].correct_option == "ja"


@pytest.mark.parametrize("value", [True, "1", 1.0])
def test_as_int_rejects_non_integers(value: object) -> None:
    with pytest.raises(SourceError, match="expected an integer"):
        as_int(value)
