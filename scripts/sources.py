"""Pinned sources of the question data: download, verify and read them."""

lazy import hashlib
lazy import json
lazy import urllib.request
lazy from dataclasses import dataclass
lazy from pathlib import Path
lazy from typing import Final

lazy from photos import REPLACEMENTS, cache_name

ROOT: Final = Path(__file__).resolve().parent.parent
CACHE: Final = ROOT / ".cache" / "sources"

EDITION: Final = "07.05.2025"
PDF_URL: Final = (
    "https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/"
    "gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile&v=23"
)
PDF_SHA256: Final = "edd3ed5e56a35241b6cc61aa0630482dc9e64498db508a7d6892ccee2ec707a9"
LEZEROQ: Final = (
    "https://raw.githubusercontent.com/lezeroq/lebenindeutschland/"
    "7852ad664f4f5a05bf447a4b50a2579f8efc55d6"
)
ABDULLAH: Final = (
    "https://raw.githubusercontent.com/abdullahbutt/leben-in-deutschland-test/"
    "877812a65d5edae9a8b24e21bce531c32ce65613"
)
SOURCES: Final = frozendict({
    "katalog.pdf": PDF_URL,
    "lezeroq-questions.json": f"{LEZEROQ}/data/questions.json",
    "lezeroq-en.json": f"{LEZEROQ}/translations/en.json",
    "abdullahbutt-quiz-data.json": f"{ABDULLAH}/quiz-data.json",
})
DOWNLOAD_TIMEOUT: Final = 60

# Order matches the catalogue: code, German name, slug of the explanation source.
STATES: Final = (
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


class SourceError(Exception):
    """A source is missing, changed or malformed."""


@dataclass(frozen=True, slots=True)
class KeyEntry:
    """A question in the answer key."""

    qid: str
    section: str
    question: str
    options: tuple[str, ...]
    answer: int
    has_picture: bool


@dataclass(frozen=True, slots=True)
class Translation:
    """English wording of a question."""

    question: str
    options: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class ExplanationEntry:
    """Explanations and the correct option as the explanation source knows them."""

    english: str
    german: str
    correct_option: str


def as_dict(value: object) -> dict[str, object]:
    """Narrow a JSON value to an object, failing on anything else."""
    if not isinstance(value, dict):
        msg = f"expected a JSON object, got {type(value).__name__}"
        raise SourceError(msg)
    return {str(key): item for key, item in value.items()}


def as_list(value: object) -> list[object]:
    """Narrow a JSON value to an array."""
    if not isinstance(value, list):
        msg = f"expected a JSON array, got {type(value).__name__}"
        raise SourceError(msg)
    return list(value)


def as_str(value: object) -> str:
    """Narrow a JSON value to a string."""
    if not isinstance(value, str):
        msg = f"expected a string, got {type(value).__name__}"
        raise SourceError(msg)
    return value


def as_int(value: object) -> int:
    """Narrow a JSON value to an integer."""
    if isinstance(value, bool) or not isinstance(value, int):
        msg = f"expected an integer, got {type(value).__name__}"
        raise SourceError(msg)
    return value


def _download(url: str, path: Path) -> None:
    if not url.startswith("https://"):
        msg = f"refusing to download from a non-HTTPS URL: {url}"
        raise SourceError(msg)
    # Wikimedia asks automated clients for a descriptive User-Agent with a contact URL.
    agent = "einbuergerungstest-trainer (https://github.com/IndrajeetPatil/einbuergerungstest)"
    request = urllib.request.Request(url, headers={"User-Agent": agent})
    with urllib.request.urlopen(request, timeout=DOWNLOAD_TIMEOUT) as response:
        path.write_bytes(response.read())


def verify_pdf(pdf: Path, expected: str = PDF_SHA256) -> None:
    """Stop when the catalogue PDF is not the pinned edition."""
    if hashlib.sha256(pdf.read_bytes()).hexdigest() != expected:
        msg = (
            "The BAMF PDF changed (SHA-256 mismatch): a new catalogue edition was probably "
            "published. Review it, then update EDITION, PDF_SHA256 and the pinned sources."
        )
        raise SourceError(msg)


def verify_photo(qid: str, path: Path, expected: str) -> None:
    """Stop when a replacement photo is not the pinned file."""
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        msg = (
            f"{qid}: the replacement photo changed (SHA-256 mismatch). Check it still shows "
            "the scene and carries the same licence, then update its hash in photos.py."
        )
        raise SourceError(msg)


def fetch(*, refresh: bool) -> None:
    """Download missing (or, with refresh, all) sources and verify the pinned files."""
    CACHE.mkdir(parents=True, exist_ok=True)
    downloads = {**SOURCES, **{cache_name(qid): p.url for qid, p in REPLACEMENTS.items()}}
    for name, url in downloads.items():
        path = CACHE / name
        if refresh or not path.exists():
            print(f"downloading {name}")
            _download(url, path)
    verify_pdf(CACHE / "katalog.pdf")
    for qid, photo in REPLACEMENTS.items():
        verify_photo(qid, CACHE / cache_name(qid), photo.sha256)


def read_json(name: str) -> object:
    """A cached JSON source."""
    value: object = json.loads((CACHE / name).read_text(encoding="utf-8"))
    return value


def _key_entry(section: str, raw: object) -> KeyEntry:
    entry = as_dict(raw)
    return KeyEntry(
        qid=as_str(entry["id"]),
        section=section,
        question=as_str(entry["q"]),
        options=tuple(as_str(option) for option in as_list(entry["o"])),
        answer=as_int(entry["a"]),
        has_picture=entry.get("img") is not None,
    )


def answer_key(raw: object) -> list[KeyEntry]:
    """General then state questions of the answer key, in catalogue order."""
    data = as_dict(raw)
    if as_str(as_dict(data["source"])["pdf_sha256"]) != PDF_SHA256:
        msg = "the answer key was built from a different catalogue edition"
        raise SourceError(msg)
    states = as_dict(data["states"])
    general = [_key_entry("g", entry) for entry in as_list(data["general"])]
    local = [
        _key_entry(code, entry)
        for code, _, _ in STATES
        for entry in as_list(as_dict(states[code])["questions"])
    ]
    return general + local


def translations(raw: object) -> dict[str, Translation]:
    """English wording keyed by question id."""
    result: dict[str, Translation] = {}
    for qid, value in as_dict(raw).items():
        entry = as_dict(value)
        options = tuple(as_str(option) for option in as_list(entry["o"]))
        result[qid] = Translation(as_str(entry["q"]), options)
    return result


def _explanation(raw: object) -> ExplanationEntry:
    entry = as_dict(raw)
    options = as_list(entry["options"])
    correct = as_dict(options[as_int(entry["correct"])])
    return ExplanationEntry(as_str(entry["exp_en"]), as_str(entry["exp_de"]), as_str(correct["de"]))


def explanations(raw: object) -> dict[str, ExplanationEntry]:
    """Explanations keyed by question id."""
    data = as_dict(raw)
    result = {
        f"g{as_int(as_dict(entry)['id'])}": _explanation(entry)
        for entry in as_list(data["general"])
    }
    states = as_dict(data["states"])
    for code, _, slug in STATES:
        entries = as_list(as_dict(states[slug])["questions"])
        result |= {f"{code}{number}": _explanation(e) for number, e in enumerate(entries, 1)}
    return result
