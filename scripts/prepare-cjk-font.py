#!/usr/bin/env python3
"""
Builds the shipped CJK font pack, `public/fonts/NotoSansSC-Regular.ttf`.

Why this script exists rather than committing an upstream file unchanged:

1. **TrueType outlines, not CFF.** We previously shipped Noto Sans SC as an
   OTF, which carries CFF outlines. `@pdf-lib/fontkit` cannot subset CFF — the
   bytes it produces are not a parseable font at all — so every CJK PDF had an
   unusable embedded font and viewers fell back, drawing `! " #`.

2. **Glyph data padded to even lengths.** fontkit writes short-format `loca`,
   which stores each glyph offset halved, so only even offsets can be
   represented. A glyph whose data length is odd pushes the next one to an odd
   offset that gets truncated, and every glyph after it is read from the wrong
   place. About half of Noto Sans SC's 31,036 glyphs had odd lengths, so about
   half of any CJK document was destroyed. Padding every glyph to an even
   length makes the conversion lossless.

Requires fontTools:  python3 -m pip install fonttools brotli

Usage:
    python3 scripts/prepare-cjk-font.py [--source <variable.ttf>] [--out <path>]

With no source it downloads the Google Fonts variable build, which is the
upstream we track. Licence is unchanged: SIL Open Font License 1.1, and
`public/fonts/OFL.txt` continues to cover it.
"""
import argparse
import os
import struct
import subprocess
import sys
import tempfile

SOURCE_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/"
    "NotoSansSC%5Bwght%5D.ttf"
)
OUT = os.path.join("public", "fonts", "NotoSansSC-Regular.ttf")

# Fixed so the build is reproducible: fontTools otherwise stamps the
# current time into `head`, and no two runs would agree.
TIMESTAMP = 3879705600  # 2026-11-05T00:00:00Z in Mac font epoch seconds


def verify(path):
    """Fails loudly rather than leaving a quietly broken font in place."""
    data = open(path, "rb").read()
    num_tables = struct.unpack(">H", data[4:6])[0]
    tables = {}
    for i in range(num_tables):
        rec = 12 + i * 16
        tag = data[rec : rec + 4].decode("latin1")
        off, length = struct.unpack(">II", data[rec + 8 : rec + 16])
        tables[tag] = (off, length)

    if "glyf" not in tables:
        raise SystemExit("written font has no glyf table - CFF outlines are not usable")

    head_off = tables["head"][0]
    fmt = struct.unpack(">h", data[head_off + 50 : head_off + 52])[0]
    loca_off, loca_len = tables["loca"]
    if fmt == 0:
        offsets = [
            v * 2
            for v in struct.unpack(f">{loca_len // 2}H", data[loca_off : loca_off + loca_len])
        ]
    else:
        offsets = list(
            struct.unpack(f">{loca_len // 4}I", data[loca_off : loca_off + loca_len])
        )

    odd = [o for o in offsets if o % 2]
    if odd:
        raise SystemExit(f"{len(odd)} glyph offsets are odd; subsetting would corrupt them")

    print(f"wrote {path}: {len(data):,} bytes, {len(offsets) - 1:,} glyphs, no odd offsets")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", help="variable NotoSansSC TTF; downloaded if omitted")
    parser.add_argument("--out", default=OUT)
    args = parser.parse_args()

    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
    except ImportError:
        print("fontTools is required: python3 -m pip install fonttools brotli", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as tmp:
        source = args.source
        if not source:
            source = os.path.join(tmp, "NotoSansSC-var.ttf")
            print(f"downloading {SOURCE_URL}")
            subprocess.run(["curl", "-sSL", "-o", source, SOURCE_URL], check=True)

        # recalcTimestamp=False, or save() stamps the current time and no two
        # runs produce the same bytes.
        font = TTFont(source, recalcTimestamp=False)
        if "fvar" not in font:
            print("source is not a variable font; using it as-is")
            static = font
        else:
            print("instantiating wght=400")
            static = instancer.instantiateVariableFont(
                font, {"wght": 400}, inplace=False, updateFontNames=True
            )
            static.recalcTimestamp = False

        if "glyf" not in static:
            print("source has CFF outlines; a TrueType build is required", file=sys.stderr)
            return 1

        # The whole point: even-length glyph data, so short-format `loca`
        # offsets stay representable after fontkit subsets the font.
        static["glyf"].padding = 2

        # Pin the timestamps, or every run produces a different file and the
        # committed font can never be checked against this script.
        static["head"].created = TIMESTAMP
        static["head"].modified = TIMESTAMP

        static.save(args.out)

    verify(args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
