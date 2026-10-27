"""Create full-resolution web copies; keep the approved PNG originals untouched.

Development-only: run with a Python environment that provides Pillow.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ROOT / "assets/landing/hotpot-mj-full.png",
    *sorted((ROOT / "assets/direct").glob("*-full.png")),
    *sorted((ROOT / "assets/quiz").glob("*.png")),
]

before = after = 0
for source in SOURCES:
    target = source.with_name(f"{source.stem}-v19.webp")
    with Image.open(source) as image:
        image.save(target, "WEBP", quality=86, method=6)
    before += source.stat().st_size
    after += target.stat().st_size

print(f"{len(SOURCES)} full-resolution images: {before:,} -> {after:,} bytes "
      f"({100 * (1 - after / before):.1f}% smaller)")
