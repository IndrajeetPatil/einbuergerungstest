"""Render a picture region of the catalogue PDF, or a replacement photo, to a WebP."""

lazy import subprocess
lazy import tempfile
lazy from pathlib import Path

lazy from PIL import Image, ImageChops

lazy from pdf_layout import Region, tool

DPI = 170
POINTS_PER_INCH = 72
MARGIN = 40  # points cut from each side of the page
INSET = 4  # points kept clear of the text above and the checkbox below
TRIM_THRESHOLD = 12  # colour difference from white that counts as content
PADDING = 14  # pixels of white kept around the trimmed picture
MAX_SIZE = 960
WEBP_QUALITY = 84
WEBP_METHOD = 6
WHITE = (255, 255, 255)


def _crop_box(region: Region) -> tuple[int, int, int, int]:
    """Left, top, width and height in pixels at the rendering resolution."""
    scale = DPI / POINTS_PER_INCH
    return (
        int(MARGIN * scale),
        int((region.top + INSET) * scale),
        int((region.width - 2 * MARGIN) * scale),
        int((region.bottom - region.top - 2 * INSET) * scale),
    )


def _rasterise(pdf: Path, region: Region, target: Path) -> Path:
    left, top, width, height = _crop_box(region)
    page = str(region.page)
    geometry = ["-x", str(left), "-y", str(top), "-W", str(width), "-H", str(height)]
    subprocess.run(
        [
            tool("pdftoppm"),
            *("-png", "-singlefile", "-r", str(DPI), "-f", page, "-l", page),
            *geometry,
            str(pdf),
            str(target),
        ],
        check=True,
    )
    return target.with_suffix(".png")


def _content(value: int) -> int:
    return 255 if value > TRIM_THRESHOLD else 0


def trim(image: Image.Image) -> Image.Image:
    """Crop surrounding white space, keeping a small even border."""
    box = ImageChops.difference(image, Image.new("RGB", image.size, WHITE)).point(_content)
    bounds = box.getbbox()
    if bounds is None:
        return image
    left, top, right, bottom = bounds
    return image.crop((
        max(left - PADDING, 0),
        max(top - PADDING, 0),
        min(right + PADDING, image.width),
        min(bottom + PADDING, image.height),
    ))


def _save(image: Image.Image, out: Path) -> None:
    image.thumbnail((MAX_SIZE, MAX_SIZE))
    image.save(out, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)


def render(pdf: Path, region: Region, out: Path) -> None:
    """Render, trim and save a picture region as WebP."""
    with tempfile.TemporaryDirectory() as tmp:
        png = _rasterise(pdf, region, Path(tmp) / "crop")
        with Image.open(png) as source:
            image = trim(source.convert("RGB"))
    _save(image, out)


def convert(photo: Path, crop: tuple[int, int, int, int] | None, out: Path) -> None:
    """Crop a photo, if asked, and save it as WebP."""
    with Image.open(photo) as source:
        image = source.convert("RGB")
    _save(image if crop is None else image.crop(crop), out)
