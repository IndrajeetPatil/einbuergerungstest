"""Freely licensed stand-ins for the catalogue's third-party press photos.

The BAMF catalogue credits five photos to the Bundesregierung or the Deutscher Bundestag. They are
not covered by this repository's licence, so the published app shows the Wikimedia Commons photos
below instead, each pinned by URL and SHA-256 like every other source. A question with no free
photo of the same scene is shown without a picture; its text is enough to answer it.

The build stops when a photo credited to a third party ("©") has no entry here, so a new catalogue
edition cannot slip one in. Attribution and licences are listed in THIRD-PARTY-NOTICES.md.
"""

lazy from dataclasses import dataclass
lazy from typing import Final

COMMONS: Final = "https://upload.wikimedia.org/wikipedia/commons"
THIRD_PARTY_MARK: Final = "©"


@dataclass(frozen=True, slots=True)
class Photo:
    """A pinned replacement photo and the credit shown under it."""

    url: str
    sha256: str
    credit: str
    # Left, top, right and bottom in pixels of the downloaded file, or None for all of it.
    crop: tuple[int, int, int, int] | None = None


REPLACEMENTS: Final = frozendict({
    "g55": Photo(
        url=(
            f"{COMMONS}/thumb/2/24/West_facade_of_the_Reichstag_building%2C_Berlin.jpg/"
            "960px-West_facade_of_the_Reichstag_building%2C_Berlin.jpg"
        ),
        sha256="712b25bb5ea5bd00cb6a410cd1d309e85b6f7706e480799651ac54a8c8f9e6f8",
        credit="Christian David / Wikimedia Commons, CC BY-SA 4.0",
    ),
    "g181": Photo(
        url=f"{COMMONS}/4/42/Kniefall.jpg",
        sha256="e4d60fa73145d0b471b4e342b0e43bced5fe4e4fadb0f9d5927ed7a6435f0da5",
        credit=(
            "Ghetto-Ehrenmal in Warschau · Ghetto Heroes Monument, Warsaw — "
            "Raymond / Wikimedia Commons, CC BY-SA 3.0"
        ),
    ),
    "g216": Photo(
        url=(
            f"{COMMONS}/thumb/5/5d/Berlin%2C_Reichstagsgeb%C3%A4ude%2C_Plenarsaal_2014-07_%2811%29.jpg/"
            "960px-Berlin%2C_Reichstagsgeb%C3%A4ude%2C_Plenarsaal_2014-07_%2811%29.jpg"
        ),
        sha256="299b09f3e5798fd401f529d67897cc45284ae644e1280878251f022c41413e26",
        credit="HerrAdams / Wikimedia Commons, CC BY-SA 4.0",
    ),
    "g235": Photo(
        url=f"{COMMONS}/3/3f/KAS-Kohl%2C_Helmut-Bild-14083-2.jpg",
        sha256="ad5c46771a17381aaff834b2e0d16e4bd9f5b3b6989348e6e3b5353dc125b94e",
        credit=(
            "Ausschnitt eines Wahlplakats · Detail of an election poster — "
            "CDU / Konrad-Adenauer-Stiftung, KAS/ACDP 10-001: 14083, CC BY-SA 3.0 DE"
        ),
        # Only the photo: the poster's slogan would give the answer away.
        crop=(34, 198, 405, 474),
    ),
})

# No freely licensed photo of the same scene exists.
WITHOUT_PICTURE: Final = frozenset({"g70"})


def cache_name(qid: str) -> str:
    """File name of a replacement photo in the source cache."""
    return f"photo-{qid}"


def unreplaced(qid: str, credit: str) -> bool:
    """Whether a picture is credited to a third party but has no replacement."""
    return (
        credit.startswith(THIRD_PARTY_MARK)
        and qid not in REPLACEMENTS
        and qid not in WITHOUT_PICTURE
    )
