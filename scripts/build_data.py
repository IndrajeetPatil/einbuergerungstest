#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.15"
# dependencies = [
#     "pillow>=13.0.0",
# ]
# ///
"""Build src/data/catalogue.json and public/img/*.webp from the official BAMF catalogue.

Sources (all pinned, so the build is reproducible):

* The BAMF "Gesamtfragenkatalog zum Test Leben in Deutschland und zum Einbürgerungstest"
  (edition 07.05.2025), checked against its SHA-256. Its German wording and option order are
  authoritative and are parsed straight from the PDF.
* lezeroq/lebenindeutschland (MIT): the answer key, taken from the BAMF Online-Testcenter, and
  English translations aligned to the PDF's option order.
* abdullahbutt/leben-in-deutschland-test (MIT): English (and some German) explanations.

The PDF parsing and picture-region detection are adapted from lezeroq/lebenindeutschland
(tools/parse_catalogue.py and tools/pictures.py, MIT licence).

Usage: scripts/build_data.py [--refresh]   (--refresh re-downloads the cached sources)
Needs poppler-utils (pdftotext, pdftoppm) on PATH.
"""

from pathlib import Path
lazy import argparse
lazy import difflib
lazy import hashlib
lazy import json
lazy import re
lazy import subprocess
lazy import sys
lazy import tempfile
lazy import unicodedata
lazy import urllib.request
lazy import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "sources"
OUT_JSON = ROOT / "src" / "data" / "catalogue.json"
OUT_IMG = ROOT / "public" / "img"

EDITION = "07.05.2025"
PDF_URL = (
    "https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/"
    "gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile&v=23"
)
PDF_SHA256 = "edd3ed5e56a35241b6cc61aa0630482dc9e64498db508a7d6892ccee2ec707a9"
LEZEROQ = (
    "https://raw.githubusercontent.com/lezeroq/lebenindeutschland/7852ad664f4f5a05bf447a4b50a2579f8efc55d6"
)
ABDULLAH = "https://raw.githubusercontent.com/abdullahbutt/leben-in-deutschland-test/877812a65d5edae9a8b24e21bce531c32ce65613"
SOURCES = frozendict(
    {
        "katalog.pdf": PDF_URL,
        "lezeroq-questions.json": f"{LEZEROQ}/data/questions.json",
        "lezeroq-en.json": f"{LEZEROQ}/translations/en.json",
        "abdullahbutt-quiz-data.json": f"{ABDULLAH}/quiz-data.json",
    }
)

# Order matches the catalogue.
STATES = (
    ("BW", "Baden-Württemberg", "baden-wuerttemberg"),
    ("BY", "Bayern", "bayern"),
    ("BE", "Berlin", "berlin"),
    ("BB", "Brandenburg", "brandenburg"),
    ("HB", "Bremen", "bremen"),
    ("HH", "Hamburg", "hamburg"),
    ("HE", "Hessen", "hessen"),
    ("MV", "Mecklenburg-Vorpommern", "mecklenburg-vorpommern"),
    ("NI", "Niedersachsen", "niedersachsen"),
    ("NW", "Nordrhein-Westfalen", "nordrhein-westfalen"),
    ("RP", "Rheinland-Pfalz", "rheinland-pfalz"),
    ("SL", "Saarland", "saarland"),
    ("SN", "Sachsen", "sachsen"),
    ("ST", "Sachsen-Anhalt", "sachsen-anhalt"),
    ("SH", "Schleswig-Holstein", "schleswig-holstein"),
    ("TH", "Thüringen", "thueringen"),
)
STATE_EN = frozendict(
    {
        "BY": "Bavaria",
        "HE": "Hesse",
        "NI": "Lower Saxony",
        "NW": "North Rhine-Westphalia",
        "RP": "Rhineland-Palatinate",
        "SN": "Saxony",
        "ST": "Saxony-Anhalt",
        "TH": "Thuringia",
        "MV": "Mecklenburg-Western Pomerania",
    }
)
# The explanation source used an older picture layout; its explanation describes the content (the
# red Brandenburg eagle), not a position, so it still applies.
POSITION_ONLY_CHANGES = frozenset({"BB1"})
BOXES = (chr(0xF0A3), "□")  # checkbox glyphs pdftotext emits before each option
MIN_PICTURE_GAP = 40.0  # points between question text and first option that signal a picture
DPI = 170
MAX_SIZE = 960

# Explanations that the explanation source wrote for an older wording of the question.
EXPLANATION_OVERRIDES = frozendict(
    {
        "HB4": (
            "Bremen lowered the voting age for elections to the Bürgerschaft, its state parliament, "
            "to 16 in 2011 - it was the first German state to do so for a Landtag election.",
            "Seit 2011 darf man in Bremen schon mit 16 Jahren die Bürgerschaft (Landtag) wählen.",
        ),
    }
)


def fetch(refresh: bool) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    for name, url in SOURCES.items():
        path = CACHE / name
        if refresh or not path.exists():
            print(f"downloading {name}")
            req = urllib.request.Request(url, headers={"User-Agent": "einbuergerungstest-trainer"})
            with urllib.request.urlopen(req, timeout=60) as r:
                path.write_bytes(r.read())
    digest = hashlib.sha256((CACHE / "katalog.pdf").read_bytes()).hexdigest()
    if digest != PDF_SHA256:
        sys.exit(
            "The BAMF PDF changed (SHA-256 mismatch): a new catalogue edition was probably published.\n"
            "Review the new edition, then update EDITION, PDF_SHA256 and the pinned sources."
        )


def norm(s: str) -> str:
    """Loose form for comparing wordings: lowercase letters and digits only."""
    s = unicodedata.normalize("NFC", s).lower()
    return re.sub(r"[^a-zäöüß0-9]+", "", s)


def clean(s: str) -> str:
    s = unicodedata.normalize("NFC", " ".join(s.split()))
    return s.replace("...", "…")


def parse_pdf_text(text: str) -> dict[str, dict]:
    by_name = {name: code for code, name, _ in STATES}
    raw: list[dict] = []
    section = "g"
    cur: dict | None = None
    for pno, page in enumerate(text.split("\f"), start=1):
        for line in page.split("\n"):
            s = line.strip()
            if m := re.match(r"Fragen für das Bundesland (.+)$", s):
                section = by_name[m.group(1).strip()]
                cur = None
                continue
            if re.match(r"Seite \d+ von \d+$", s) or s in ("Teil I", "Teil II", "Allgemeine Fragen"):
                continue
            if m := re.match(r"Aufgabe (\d+)$", s):
                cur = {"section": section, "num": int(m.group(1)), "page": pno, "q": [], "opts": []}
                raw.append(cur)
                continue
            if cur is None or not s:
                continue
            if s.startswith(BOXES):
                cur["opts"].append(s[1:].strip())
            elif cur["opts"] and line.startswith("    ") and not re.match(r"^\s*Bild \d", line):
                cur["opts"][-1] += " " + s
            elif not cur["opts"]:
                cur["q"].append(s)
    out = {}
    for q in raw:
        lines = [ln for ln in q["q"] if not re.fullmatch(r"(Bild \d\s*)+", ln)]
        credit = " ".join(ln for ln in lines if ln.startswith(("©", "In Anlehnung an")))
        body = " ".join(ln for ln in lines if not ln.startswith(("©", "In Anlehnung an")))
        body = re.sub(rf"^{q['num']}\.\s*", "", body)
        qid = f"g{q['num']}" if q["section"] == "g" else f"{q['section']}{q['num']}"
        out[qid] = {
            "page": q["page"],
            "num": q["num"],
            "section": q["section"],
            "question": clean(body),
            "credit": clean(credit),
            "options": [clean(o) for o in q["opts"]],
        }
    return out


type Line = tuple[str, float, float]


def layout(pdf: Path) -> dict[int, tuple[float, list[Line]]]:
    ns = "{http://www.w3.org/1999/xhtml}"
    xml = subprocess.run(
        ["pdftotext", "-bbox-layout", str(pdf), "-"], capture_output=True, text=True, check=True
    ).stdout
    pages = {}
    for pno, pg in enumerate(ET.fromstring(xml).iter(f"{ns}page"), start=1):
        lines = [
            (
                " ".join(w.text or "" for w in ln.iter(f"{ns}word")),
                float(ln.get("yMin", 0)),
                float(ln.get("yMax", 0)),
            )
            for ln in pg.iter(f"{ns}line")
        ]
        lines.sort(key=lambda ln: ln[1])
        pages[pno] = (float(pg.get("width", 0)), lines)
    return pages


def picture_region(pages, q: dict) -> tuple[float, float, float] | None:
    """(page width, top, bottom) of the picture between question text and first checkbox."""
    width, lines = pages[q["page"]]
    start = next(i for i, ln in enumerate(lines) if ln[0].strip() == f"Aufgabe {q['num']}")
    qtext = norm(q["question"])
    top = lines[start][2]
    i = start + 1
    while i < len(lines):
        t = lines[i][0].strip()
        if not ((norm(t) and norm(t) in qtext) or re.fullmatch(r"\d+\.|…|\.\.\.", t)):
            break
        top = max(top, lines[i][2])
        i += 1
    bottom = next((ln[1] for ln in lines[i:] if ln[0].strip().startswith(BOXES)), None)
    if bottom is None or bottom - top <= MIN_PICTURE_GAP:
        return None
    return width, top, bottom


def render(pdf: Path, page: int, width: float, top: float, bottom: float, out: Path) -> None:
    from PIL import Image, ImageChops

    s = DPI / 72
    x0, y0 = int(40 * s), int((top + 4) * s)
    w, h = int((width - 80) * s), int((bottom - top - 8) * s)
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "crop"
        subprocess.run(
            [
                "pdftoppm",
                "-png",
                "-singlefile",
                "-r",
                str(DPI),
                "-f",
                str(page),
                "-l",
                str(page),
                "-x",
                str(x0),
                "-y",
                str(y0),
                "-W",
                str(w),
                "-H",
                str(h),
                str(pdf),
                str(png),
            ],
            check=True,
        )
        img = Image.open(f"{png}.png").convert("RGB")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bbox = ImageChops.difference(img, bg).point(lambda p: 255 if p > 12 else 0).getbbox()
        if bbox:
            pad = 14
            img = img.crop(
                (
                    max(bbox[0] - pad, 0),
                    max(bbox[1] - pad, 0),
                    min(bbox[2] + pad, img.width),
                    min(bbox[3] + pad, img.height),
                )
            )
        img.thumbnail((MAX_SIZE, MAX_SIZE))
        img.save(out, "WEBP", quality=84, method=6)


def keep_order(options: list[str]) -> bool:
    """Options whose order carries meaning (picture labels, numbers, years) are not shuffled."""
    return all(re.fullmatch(r"Bild \d", o) for o in options) or all(
        re.fullmatch(r"[\d.,\s%\u2013-]+(Prozent|Jahre|Jahren)?", o) for o in options
    )


def same_answer(text: str, options: list[str], answer: int) -> bool:
    """Whether `text` (another source's correct option) names the official correct option."""
    label = re.fullmatch(r"(?:Bild )?(\d)", text.strip())
    if label and all(re.fullmatch(r"(?:Bild )?\d", o) for o in options):
        return re.sub(r"\D", "", options[answer]) == label.group(1)

    def words(o: str) -> set[str]:
        return set(re.findall(r"[a-zäöüß0-9]+", unicodedata.normalize("NFC", o).lower()))

    if words(text) == words(options[answer]):  # same option, other gender order
        return True

    def ratio(o: str) -> float:
        return difflib.SequenceMatcher(None, norm(text), norm(o)).ratio()

    return max(range(len(options)), key=lambda i: ratio(options[i])) == answer


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--refresh", action="store_true", help="re-download the cached sources")
    args = ap.parse_args()
    fetch(args.refresh)

    pdf = CACHE / "katalog.pdf"
    text = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True, check=True
    ).stdout
    official = parse_pdf_text(text)
    lz = json.loads((CACHE / "lezeroq-questions.json").read_text())
    en = json.loads((CACHE / "lezeroq-en.json").read_text())
    ab = json.loads((CACHE / "abdullahbutt-quiz-data.json").read_text())
    if lz["source"]["pdf_sha256"] != PDF_SHA256:
        sys.exit("lezeroq answer key was built from a different catalogue edition")

    explanations: dict[str, tuple[str, str, str]] = {}
    for q in ab["general"]:
        explanations[f"g{q['id']}"] = (q["exp_en"], q["exp_de"], q["options"][q["correct"]]["de"])
    for code, _, slug in STATES:
        for i, q in enumerate(ab["states"][slug]["questions"], start=1):
            explanations[f"{code}{i}"] = (q["exp_en"], q["exp_de"], q["options"][q["correct"]]["de"])

    keyed = [("g", q) for q in lz["general"]] + [
        (code, q) for code, _, _ in STATES for q in lz["states"][code]["questions"]
    ]
    if len(keyed) != 460 or len(official) != 460:
        sys.exit(f"expected 460 questions, got {len(keyed)} (answer key) and {len(official)} (PDF)")

    pages = layout(pdf)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for old in OUT_IMG.glob("*.webp"):
        old.unlink()

    problems: list[str] = []
    questions = []
    for section, q in keyed:
        qid = q["id"]
        off = official[qid]
        # The PDF is authoritative; the answer key must describe the same question and options.
        if norm(off["question"]) != norm(q["q"]) or [norm(o) for o in off["options"]] != [
            norm(o) for o in q["o"]
        ]:
            problems.append(f"{qid}: answer-key wording differs from the PDF")
        answer = q["a"]
        exp_en, exp_de, exp_correct = explanations[qid]
        if qid not in POSITION_ONLY_CHANGES and not same_answer(exp_correct, off["options"], answer):
            problems.append(f"{qid}: explanation source disagrees on the correct answer ({exp_correct!r})")
        if qid in EXPLANATION_OVERRIDES:
            exp_en, exp_de = EXPLANATION_OVERRIDES[qid]
        if exp_de.startswith("Die richtige Antwort ist"):
            exp_de = ""  # boilerplate that only repeats the answer

        image = None
        region = picture_region(pages, off)
        if (region is not None) != bool(q["img"]):
            problems.append(f"{qid}: picture detection disagrees with the answer key")
        if region is not None:
            name = f"{qid}.webp"
            render(pdf, off["page"], *region, OUT_IMG / name)
            image = f"img/{name}"

        questions.append(
            {
                "id": qid,
                "num": off["num"],
                "state": None if section == "g" else section,
                "de": {"q": off["question"], "o": off["options"]},
                "en": {"q": clean(en[qid]["q"]), "o": [clean(o) for o in en[qid]["o"]]},
                "answer": answer,
                "image": image,
                "credit": off["credit"] or None,
                "explanation": {"en": clean(exp_en), "de": clean(exp_de) or None},
                "keepOrder": keep_order(off["options"]),
            }
        )

    if problems:
        sys.exit("data problems:\n  " + "\n  ".join(problems))

    doc = {
        "source": {
            "title": "Gesamtfragenkatalog zum Test „Leben in Deutschland“ und zum „Einbürgerungstest“",
            "publisher": "Bundesamt für Migration und Flüchtlinge (BAMF)",
            "edition": EDITION,
            "url": PDF_URL,
            "sha256": PDF_SHA256,
        },
        "states": [{"code": c, "de": n, "en": STATE_EN.get(c, n)} for c, n, _ in STATES],
        "questions": questions,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    pics = sum(1 for q in questions if q["image"])
    print(f"wrote {OUT_JSON.relative_to(ROOT)}: {len(questions)} questions, {pics} pictures")


if __name__ == "__main__":
    main()
