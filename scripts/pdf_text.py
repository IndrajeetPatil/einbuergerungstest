"""Parse the BAMF catalogue's text layer (pdftotext -layout) into questions.

Adapted from lezeroq/lebenindeutschland, tools/parse_catalogue.py (MIT licence).
"""

lazy import re
lazy from dataclasses import dataclass, field

lazy from text_match import clean

BOXES = (chr(0xF0A3), "□")  # checkbox glyphs pdftotext emits before each option
CREDIT_PREFIXES = ("©", "In Anlehnung an")
SKIPPED_LINES = frozenset({"Teil I", "Teil II", "Allgemeine Fragen"})
CONTINUATION_INDENT = "    "


@dataclass(frozen=True, slots=True)
class OfficialQuestion:
    """One question as printed in the PDF."""

    qid: str
    num: int
    page: int
    question: str
    credit: str
    options: tuple[str, ...]


@dataclass(slots=True)
class _Draft:
    section: str
    num: int
    page: int
    lines: list[str] = field(default_factory=list)
    options: list[str] = field(default_factory=list)


@dataclass(slots=True)
class _Parser:
    states: dict[str, str]
    section: str = "g"
    current: _Draft | None = None
    drafts: list[_Draft] = field(default_factory=list)

    def feed(self, page: int, line: str) -> None:
        stripped = line.strip()
        if heading := re.match(r"Fragen für das Bundesland (?P<name>.+)$", stripped):
            self.section = self.states[heading.group("name").strip()]
            self.current = None
        elif task := re.match(r"Aufgabe (?P<num>\d+)$", stripped):
            self.current = _Draft(self.section, int(task.group("num")), page)
            self.drafts.append(self.current)
        elif self.current is not None and stripped and not _is_furniture(stripped):
            _add_line(self.current, line, stripped)


def _is_furniture(stripped: str) -> bool:
    return stripped in SKIPPED_LINES or re.match(r"Seite \d+ von \d+$", stripped) is not None


def _add_line(draft: _Draft, line: str, stripped: str) -> None:
    if stripped.startswith(BOXES):
        draft.options.append(stripped[1:].strip())
    elif draft.options and _continues_option(line):
        draft.options[-1] += f" {stripped}"
    elif not draft.options:
        draft.lines.append(stripped)


def _continues_option(line: str) -> bool:
    return line.startswith(CONTINUATION_INDENT) and re.match(r"^\s*Bild \d", line) is None


def _finish(draft: _Draft) -> OfficialQuestion:
    lines = [line for line in draft.lines if not re.fullmatch(r"(?:Bild \d\s*)+", line)]
    credit = " ".join(line for line in lines if line.startswith(CREDIT_PREFIXES))
    body = " ".join(line for line in lines if not line.startswith(CREDIT_PREFIXES))
    return OfficialQuestion(
        qid=f"{draft.section}{draft.num}",
        num=draft.num,
        page=draft.page,
        question=clean(re.sub(rf"^{draft.num}\.\s*", "", body)),
        credit=clean(credit),
        options=tuple(clean(option) for option in draft.options),
    )


def parse_catalogue(text: str, states: dict[str, str]) -> dict[str, OfficialQuestion]:
    """Questions keyed by id (g1..g300, BW1..TH10), from the PDF's text layer."""
    parser = _Parser(states)
    for page, content in enumerate(text.split("\f"), start=1):
        for line in content.split("\n"):
            parser.feed(page, line)
    parsed = (_finish(draft) for draft in parser.drafts)
    return {question.qid: question for question in parsed}
