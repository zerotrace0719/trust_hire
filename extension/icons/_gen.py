"""Generate TrustHire icons (16/48/128) — cyan hex shield motif."""
from PIL import Image, ImageDraw
import math
import os

OUT = os.path.dirname(os.path.abspath(__file__))


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")

    # Background rounded square with gradient feel (faked via two rects)
    pad = max(1, size // 16)
    r = max(2, size // 6)
    bg_color = (12, 17, 29, 255)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=r, fill=bg_color, outline=(0, 217, 255, 80), width=max(1, size // 64))

    # Hex shield in center
    cx, cy = size / 2, size / 2
    radius = size * 0.32
    points = []
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 2
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))

    # Outer glow approximation - multiple translucent strokes
    for w, alpha in [(max(1, size // 24), 50), (max(1, size // 48), 130)]:
        d.polygon(points, outline=(0, 217, 255, alpha))

    d.polygon(points, fill=(0, 217, 255, 230))

    # Inner checkmark
    if size >= 32:
        cw = max(2, size // 16)
        c1 = (cx - radius * 0.35, cy)
        c2 = (cx - radius * 0.05, cy + radius * 0.3)
        c3 = (cx + radius * 0.4, cy - radius * 0.25)
        d.line([c1, c2], fill=(7, 10, 18, 255), width=cw)
        d.line([c2, c3], fill=(7, 10, 18, 255), width=cw)
    else:
        # tiny — just a dot
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(7, 10, 18, 255))

    return img


for s in (16, 48, 128):
    p = os.path.join(OUT, f"icon{s}.png")
    make_icon(s).save(p)
    print("wrote", p)
