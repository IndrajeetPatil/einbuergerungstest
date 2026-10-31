"""Find picture regions in the catalogue from pdftotext's bounding-box layout.

A question has a picture when the gap between the end of its text and its first
answer checkbox is large. Adapted from lezeroq/lebenindeutschland,
tools/pictures.py (MIT licence).
"""

lazy import re
lazy import shutil
lazy import subprocess
lazy from dataclasses import dataclass
lazy from pathlib import Path
lazy from xml.etree import ElementTree as ET

lazy from pdf_text import BOXES, OfficialQuestion
lazy from text_match import norm

XHTML = "{http://www.w3.org/1999/xhtml}"
MIN_PICTURE_GAP = 40.0  # points; plain questions have about 19


@dataclass(frozen=True, slots=True)
class Line:
    """A text line with its vertical extent in points."""

    text: str
    top: float
    bottom: float


@dataclass(frozen=True, slots=True)
class Page:
    """A page's width and its lines from top to bottom."""

    width: float
    lines: tuple[Line, ...]


@dataclass(frozen=True, slots=True)
class Region:
    """Where a picture sits on its page, in points."""

    page: int
    width: float
    top: float
    bottom: float


def tool(name: str) -> str:
    """Absolute path of a poppler tool, failing clearly when it is missing."""
    found = shutil.which(name)
    if found is None:
        msg = f"{name} not found: install poppler-utils"
        raise FileNotFoundError(msg)
    return found


def _line(element: ET.Element) -> Line:
    words = " ".join(word.text or "" for word in element.iter(f"{XHTML}word"))
    return Line(words, float(element.get("yMin", "0")), float(element.get("yMax", "0")))


def parse_layout(xml: str) -> dict[int, Page]:
    """Pages of a `pdftotext -bbox-layout` document, numbered from 1."""
    root = ET.fromstring(xml)
    pages: dict[int, Page] = {}
    for number, page in enumerate(root.iter(f"{XHTML}page"), start=1):
        lines = sorted((_line(line) for line in page.iter(f"{XHTML}line")), key=lambda ln: ln.top)
        pages[number] = Page(float(page.get("width", "0")), tuple(lines))
    return pages


def read_layout(pdf: Path) -> dict[int, Page]:
    """Run pdftotext in bounding-box mode on a local, checksum-verified PDF."""
    result = subprocess.run(
        [tool("pdftotext"), "-bbox-layout", str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    return parse_layout(result.stdout)


def _is_question_text(text: str, question: str) -> bool:
    folded = norm(text)
    return bool(folded and folded in question) or re.fullmatch(r"\d+\.|…|\.\.\.", text) is not None


def _text_end(lines: tuple[Line, ...], start: int, question: str) -> tuple[float, int]:
    """Bottom of the question text and the index of the first line after it."""
    end = lines[start].bottom
    index = start + 1
    while index < len(lines) and _is_question_text(lines[index].text.strip(), question):
        end = max(end, lines[index].bottom)
        index += 1
    return end, index


def picture_region(pages: dict[int, Page], question: OfficialQuestion) -> Region | None:
    """The picture between a question's text and its first checkbox, if any."""
    page = pages[question.page]
    marker = f"Aufgabe {question.num}"
    start = next(i for i, line in enumerate(page.lines) if line.text.strip() == marker)
    top, after = _text_end(page.lines, start, norm(question.question))
    boxes = (line.top for line in page.lines[after:] if line.text.strip().startswith(BOXES))
    bottom = next(boxes, None)
    if bottom is None or bottom - top <= MIN_PICTURE_GAP:
        return None
    return Region(question.page, page.width, top, bottom)
