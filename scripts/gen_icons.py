from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
OUT = "public/icons"

def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # rounded square gradient-ish background (flat two-tone approximation)
    pad = max(1, size // 16)
    d.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=size // 4,
        fill=(56, 96, 255, 255),
    )
    d.rounded_rectangle(
        [pad, pad, size - pad, size // 2],
        radius=size // 4,
        fill=(90, 134, 255, 255),
    )

    # simple "document with a split" glyph
    doc_w = size * 0.42
    doc_h = size * 0.6
    doc_x = size * 0.22
    doc_y = size * 0.2
    d.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_w, doc_y + doc_h],
        radius=size * 0.06,
        fill=(255, 255, 255, 235),
    )
    # scissors-like split line
    line_y = doc_y + doc_h * 0.55
    d.line(
        [(doc_x + doc_w * 0.55, doc_y + doc_h * 0.15), (doc_x + doc_w * 1.35, line_y)],
        fill=(56, 96, 255, 255),
        width=max(1, size // 20),
    )

    img.save(f"{OUT}/icon{size}.png")

for s in SIZES:
    make_icon(s)

print("done")
