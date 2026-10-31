"""Normalising and comparing catalogue wordings across sources."""

lazy import difflib
lazy import re
lazy import unicodedata

LABEL_OPTION = r"(?:Bild )?\d"
NUMERIC_OPTION = r"[\d.,\s%\u2013-]+(?:Prozent|Jahre|Jahren)?"


def norm(text: str) -> str:
    """Loose form for comparing wordings: lowercase letters and digits only."""
    return re.sub(r"[^a-zäöüß0-9]+", "", unicodedata.normalize("NFC", text).lower())


def clean(text: str) -> str:
    """Collapse whitespace and use a typographic ellipsis."""
    return unicodedata.normalize("NFC", " ".join(text.split())).replace("...", "…")


def keep_order(options: list[str]) -> bool:
    """Options whose order carries meaning (picture labels, numbers) are never shuffled."""
    pictures = all(re.fullmatch(r"Bild \d", option) for option in options)
    numbers = all(re.fullmatch(NUMERIC_OPTION, option) for option in options)
    return pictures or numbers


def _words(text: str) -> set[str]:
    return set(re.findall(r"[a-zäöüß0-9]+", unicodedata.normalize("NFC", text).lower()))


def _label_answer(text: str, options: list[str], answer: int) -> bool | None:
    """Compare picture or number labels by their digit; None when not labels."""
    label = re.fullmatch(r"(?:Bild )?(?P<digit>\d)", text.strip())
    if label is None or not all(re.fullmatch(LABEL_OPTION, option) for option in options):
        return None
    return re.sub(r"\D", "", options[answer]) == label.group("digit")


def _closest(text: str, options: list[str]) -> int:
    def ratio(index: int) -> float:
        return difflib.SequenceMatcher(None, norm(text), norm(options[index])).ratio()

    return max(range(len(options)), key=ratio)


def same_answer(text: str, options: list[str], answer: int) -> bool:
    """Whether `text`, another source's correct option, names the official correct option."""
    by_label = _label_answer(text, options, answer)
    if by_label is not None:
        return by_label
    # Same words in another gender order, or else the closest wording.
    return _words(text) == _words(options[answer]) or _closest(text, options) == answer
