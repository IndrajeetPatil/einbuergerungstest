"""Tests for finding picture regions in the bounding-box layout."""

lazy import pytest

lazy from pdf_layout import Region, parse_layout, picture_region
lazy from pdf_text import OfficialQuestion

LAYOUT = """<html xmlns="http://www.w3.org/1999/xhtml"><body><doc>
<page width="595" height="842">
  <flow><block>
    <line yMin="100" yMax="110"><word>Aufgabe</word><word>21</word></line>
    <line yMin="112" yMax="122"><word>Welches</word><word>Wappen?</word></line>
    <line yMin="300" yMax="310"><word>□</word><word>Bild</word><word>1</word></line>
    <line yMin="400" yMax="410"><word>Aufgabe</word><word>22</word></line>
    <line yMin="412" yMax="422"><word>Was</word><word>gilt?</word></line>
    <line yMin="430" yMax="440"><word>□</word><word>ja</word></line>
  </block></flow>
</page>
</doc></body></html>"""


def question(num: int, text: str) -> OfficialQuestion:
    return OfficialQuestion(f"g{num}", num, 1, text, "", ("a", "b", "c", "d"))


def test_parses_lines_sorted_from_top() -> None:
    page = parse_layout(LAYOUT)[1]
    assert page.width == pytest.approx(595)
    assert [line.text for line in page.lines[:2]] == ["Aufgabe 21", "Welches Wappen?"]


def test_finds_the_gap_of_a_picture_question() -> None:
    pages = parse_layout(LAYOUT)
    assert picture_region(pages, question(21, "Welches Wappen?")) == Region(1, 595.0, 122.0, 300.0)


def test_ignores_text_only_questions() -> None:
    pages = parse_layout(LAYOUT)
    assert picture_region(pages, question(22, "Was gilt?")) is None
