"""Tests for wording normalisation and cross-source answer matching."""

lazy import pytest

lazy from text_match import clean, keep_order, norm, same_answer

OPTIONS = ["Arbeitnehmerinnen und Arbeitnehmer.", "Jugendlichen.", "Rentner.", "Arbeitgeber."]


def test_norm_keeps_only_lowercase_letters_and_digits() -> None:
    assert norm("Die Bürger-Rechte, Art. 5!") == "diebürgerrechteart5"


def test_clean_collapses_space_and_uses_an_ellipsis() -> None:
    assert clean("  Was   gilt ... ") == "Was gilt …"


@pytest.mark.parametrize(
    ("options", "expected"),
    [
        pytest.param(["Bild 1", "Bild 2", "Bild 3", "Bild 4"], True, id="pictures"),
        pytest.param(["16", "18", "21", "25"], True, id="numbers"),
        pytest.param(["5 Prozent", "10 Prozent", "3 %", "7 %"], True, id="percentages"),
        pytest.param(["ja", "nein", "vielleicht", "nie"], False, id="text"),
    ],
)
def test_keep_order(*, options: list[str], expected: bool) -> None:
    assert keep_order(options) is expected


@pytest.mark.parametrize(
    ("text", "answer", "expected"),
    [
        pytest.param("Arbeitnehmer und Arbeitnehmerinnen.", 0, True, id="gender-order"),
        pytest.param("Jugendliche", 1, True, id="close-wording"),
        pytest.param("Arbeitgeber", 0, False, id="other-option"),
    ],
)
def test_same_answer_for_text(*, text: str, answer: int, expected: bool) -> None:
    assert same_answer(text, OPTIONS, answer) is expected


def test_same_answer_compares_picture_labels_by_digit() -> None:
    labels = ["1", "2", "3", "4"]
    assert same_answer("Bild 2", labels, 1)
    assert not same_answer("Bild 2", labels, 0)
