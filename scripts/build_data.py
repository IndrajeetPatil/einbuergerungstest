"""Build src/data/catalogue.json and public/img/*.webp from the official BAMF catalogue.

Sources (all pinned, so the build is reproducible; see sources.py):

* The BAMF "Gesamtfragenkatalog zum Test Leben in Deutschland und zum Einbürgerungstest"
  (edition 07.05.2025), checked against its SHA-256. Its German wording and option order are
  authoritative and are parsed straight from the PDF.
* lezeroq/lebenindeutschland (MIT): the answer key, taken from the BAMF Online-Testcenter, and
  English translations aligned to the PDF's option order.
* abdullahbutt/leben-in-deutschland-test (MIT): English (and some German) explanations.

The build stops, listing every problem, when the sources disagree.

Usage: uv run build_data.py [--refresh]   (--refresh re-downloads the cached sources)
Needs poppler-utils (pdftotext, pdftoppm) on PATH.
"""

lazy import argparse
lazy import json
lazy import subprocess
lazy import sys
lazy from dataclasses import dataclass
lazy from pathlib import Path
lazy from typing import Final

lazy from pdf_layout import Page, picture_region, read_layout, tool
lazy from pdf_text import OfficialQuestion, parse_catalogue
lazy from pictures import render
lazy from sources import (
    CACHE,
    EDITION,
    PDF_SHA256,
    PDF_URL,
    ROOT,
    STATES,
    ExplanationEntry,
    KeyEntry,
    SourceError,
    Translation,
    answer_key,
    explanations,
    fetch,
    read_json,
    translations,
)
lazy from text_match import clean, keep_order, norm, same_answer

OUT_JSON: Final = ROOT / "src" / "data" / "catalogue.json"
OUT_IMG: Final = ROOT / "public" / "img"
EXPECTED_QUESTIONS: Final = 460
BOILERPLATE: Final = "Die richtige Antwort ist"
CATALOGUE_TITLE: Final = (
    "Gesamtfragenkatalog zum Test „Leben in Deutschland“ und zum „Einbürgerungstest“"
)
STATE_EN: Final = frozendict({
    "BY": "Bavaria",
    "HE": "Hesse",
    "NI": "Lower Saxony",
    "NW": "North Rhine-Westphalia",
    "RP": "Rhineland-Palatinate",
    "SN": "Saxony",
    "ST": "Saxony-Anhalt",
    "TH": "Thuringia",
    "MV": "Mecklenburg-Western Pomerania",
})
# The explanation source used an older picture layout; its explanation describes the content
# (the red Brandenburg eagle), not a position, so it still applies.
POSITION_ONLY_CHANGES: Final = frozenset({"BB1"})
# Explanations the explanation source wrote for an older wording of the question.
EXPLANATION_OVERRIDES: Final = frozendict({
    "HB4": (
        (
            "Bremen lowered the voting age for elections to the Bürgerschaft, its state "
            "parliament, to 16 in 2011 - it was the first German state to do so for a "
            "Landtag election."
        ),
        "Seit 2011 darf man in Bremen schon mit 16 Jahren die Bürgerschaft (Landtag) wählen.",
    ),
})

type Record = dict[str, object]


@dataclass(frozen=True, slots=True)
class Inputs:
    """Everything the build reads, parsed and typed."""

    pdf: Path
    official: dict[str, OfficialQuestion]
    key: list[KeyEntry]
    english: dict[str, Translation]
    notes: dict[str, ExplanationEntry]
    pages: dict[int, Page]


def load_inputs(pdf: Path) -> Inputs:
    """Parse the PDF and the cached JSON sources."""
    text = subprocess.run(
        [tool("pdftotext"), "-layout", str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return Inputs(
        pdf=pdf,
        official=parse_catalogue(text, {name: code for code, name, _ in STATES}),
        key=answer_key(read_json("lezeroq-questions.json")),
        english=translations(read_json("lezeroq-en.json")),
        notes=explanations(read_json("abdullahbutt-quiz-data.json")),
        pages=read_layout(pdf),
    )


def wording_problems(entry: KeyEntry, official: OfficialQuestion) -> list[str]:
    """The answer key must describe the PDF's question and options."""
    same_question = norm(official.question) == norm(entry.question)
    same_options = [norm(o) for o in official.options] == [norm(o) for o in entry.options]
    return [] if same_question and same_options else [f"{entry.qid}: wording differs from the PDF"]


def explanation_problems(
    entry: KeyEntry, official: OfficialQuestion, note: ExplanationEntry
) -> list[str]:
    """The explanation must be written for the official correct answer."""
    if entry.qid in POSITION_ONLY_CHANGES:
        return []
    if same_answer(note.correct_option, list(official.options), entry.answer):
        return []
    return [f"{entry.qid}: explanation names another answer ({note.correct_option!r})"]


def explanation_texts(qid: str, note: ExplanationEntry) -> tuple[str, str | None]:
    """English and German explanation, dropping German boilerplate."""
    english, german = EXPLANATION_OVERRIDES.get(qid, (note.english, note.german))
    if german.startswith(BOILERPLATE):
        german = ""
    return clean(english), clean(german) or None


def picture(
    entry: KeyEntry, official: OfficialQuestion, inputs: Inputs
) -> tuple[str | None, list[str]]:
    """Render the question's picture, if it has one, and check detection."""
    region = picture_region(inputs.pages, official)
    problems = (
        []
        if (region is not None) == entry.has_picture
        else [
            f"{entry.qid}: picture detection disagrees with the answer key",
        ]
    )
    if region is None:
        return None, problems
    name = f"{entry.qid}.webp"
    render(inputs.pdf, region, OUT_IMG / name)
    return f"img/{name}", problems


def record(entry: KeyEntry, inputs: Inputs) -> tuple[Record, list[str]]:
    """One catalogue entry plus any cross-validation problems."""
    official = inputs.official[entry.qid]
    note = inputs.notes[entry.qid]
    english = inputs.english[entry.qid]
    image, picture_issues = picture(entry, official, inputs)
    explanation_en, explanation_de = explanation_texts(entry.qid, note)
    problems = [
        *wording_problems(entry, official),
        *explanation_problems(entry, official, note),
        *picture_issues,
    ]
    return {
        "id": entry.qid,
        "num": official.num,
        "state": None if entry.section == "g" else entry.section,
        "de": {"q": official.question, "o": list(official.options)},
        "en": {"q": clean(english.question), "o": [clean(o) for o in english.options]},
        "answer": entry.answer,
        "image": image,
        "credit": official.credit or None,
        "explanation": {"en": explanation_en, "de": explanation_de},
        "keepOrder": keep_order(list(official.options)),
    }, problems


def build(inputs: Inputs) -> list[Record]:
    """All catalogue entries, failing with every problem found."""
    counts = (len(inputs.key), len(inputs.official))
    if counts != (EXPECTED_QUESTIONS, EXPECTED_QUESTIONS):
        msg = f"expected {EXPECTED_QUESTIONS} questions, got {counts[0]} (key), {counts[1]} (PDF)"
        raise SourceError(msg)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for old in OUT_IMG.glob("*.webp"):
        old.unlink()
    built = [record(entry, inputs) for entry in inputs.key]
    problems = [problem for _, issues in built for problem in issues]
    if problems:
        raise SourceError("data problems:\n  " + "\n  ".join(problems))
    return [entry for entry, _ in built]


def document(questions: list[Record]) -> Record:
    """The catalogue file's content."""
    return {
        "source": {
            "title": CATALOGUE_TITLE,
            "publisher": "Bundesamt für Migration und Flüchtlinge (BAMF)",
            "edition": EDITION,
            "url": PDF_URL,
            "sha256": PDF_SHA256,
        },
        "states": [{"code": c, "de": name, "en": STATE_EN.get(c, name)} for c, name, _ in STATES],
        "questions": questions,
    }


def main() -> int:
    """Fetch, cross-validate and write the catalogue; returns the exit status."""
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--refresh", action="store_true", help="re-download the cached sources")
    args = parser.parse_args()
    try:
        fetch(refresh=bool(args.refresh))
        questions = build(load_inputs(CACHE / "katalog.pdf"))
    except SourceError as error:
        print(error, file=sys.stderr)
        return 1
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(document(questions), ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    pictures = sum(1 for question in questions if question["image"] is not None)
    print(f"wrote {OUT_JSON.relative_to(ROOT)}: {len(questions)} questions, {pictures} pictures")
    return 0


if __name__ == "__main__":
    sys.exit(main())
