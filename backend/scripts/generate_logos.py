"""Generate reproducible PNG monogram placeholders, without third-party dependencies."""
import json
from pathlib import Path
import struct
import zlib

FONT = {
    "A": [14,17,17,31,17,17,17], "C": [14,17,16,16,16,17,14],
    "E": [31,16,16,30,16,16,31], "G": [14,17,16,23,17,17,15],
    "H": [17,17,17,31,17,17,17], "I": [31,4,4,4,4,4,31],
    "K": [17,18,20,24,20,18,17], "L": [16,16,16,16,16,16,31],
    "M": [17,27,21,21,17,17,17], "N": [17,25,21,19,17,17,17],
    "O": [14,17,17,17,17,17,14], "R": [30,17,17,30,20,18,17],
    "S": [15,16,16,14,1,1,30], "T": [31,4,4,4,4,4,4],
    "W": [17,17,17,21,21,21,10], "Y": [17,17,10,4,4,4,4],
}


def generate(code, index):
    width, height, scale = 160, 48, 4
    color = (12 + index * 9 % 100, 50 + index * 17 % 100, 100 + index * 13 % 120)
    pixels = bytearray(color * (width * height))
    label = "CMA" if code == "CMA CGM" else code
    start = (width - len(label) * 6 * scale + scale) // 2
    for i, char in enumerate(label):
        for y, bits in enumerate(FONT[char]):
            for x in range(5):
                if bits & (1 << (4 - x)):
                    for dy in range(scale):
                        for dx in range(scale):
                            offset = ((10 + y * scale + dy) * width + start + i * 6 * scale + x * scale + dx) * 3
                            pixels[offset:offset + 3] = bytes((255, 255, 255))

    def chunk(kind, payload):
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload))

    raw = b"".join(b"\x00" + pixels[y * width * 3:(y + 1) * width * 3] for y in range(height))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1] / "seed"
    (root / "logos").mkdir(exist_ok=True)
    for index, carrier in enumerate(json.loads((root / "carriers.json").read_text())):
        (root / "logos" / (carrier["code"].replace(" ", "-") + ".png")).write_bytes(generate(carrier["code"], index))
    print("Generated 15 mock PNG logos.")
