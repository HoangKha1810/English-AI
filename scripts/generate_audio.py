#!/usr/bin/env python3
"""
Tao file MP3 cho phan Listening bang edge-tts (giong neural cua Microsoft, mien phi).

Cach dung:
    pip install edge-tts
    python3 scripts/generate_audio.py             # tao tat ca file con thieu
    python3 scripts/generate_audio.py --force     # tao lai tat ca
    python3 scripts/generate_audio.py --test lt-01

Neu may co ffmpeg, script se chen khoang lang giua cac luot noi cho tu nhien.
Neu khong co ffmpeg, script van chay duoc (noi cac doan lai voi nhau).
"""

import argparse
import asyncio
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import edge_tts
except ImportError:
    sys.exit("Thieu thu vien edge-tts. Chay:  pip install edge-tts")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "listening"
OUT = ROOT / "public" / "audio"

DEFAULT_VOICE = "en-GB-SoniaNeural"
GAP_SECONDS = 0.55
HAS_FFMPEG = shutil.which("ffmpeg") is not None


async def say(text: str, voice: str, path: Path) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(path))


def concat_with_ffmpeg(parts: list[Path], out: Path, tmp: Path) -> None:
    silence = tmp / "gap.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"anullsrc=r=24000:cl=mono", "-t", str(GAP_SECONDS), str(silence)],
        check=True,
    )
    listing = tmp / "list.txt"
    lines = []
    for i, p in enumerate(parts):
        lines.append(f"file '{p.as_posix()}'")
        if i < len(parts) - 1:
            lines.append(f"file '{silence.as_posix()}'")
    listing.write_text("\n".join(lines), encoding="utf-8")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", str(listing), "-c", "copy", str(out)],
        check=True,
    )


def concat_raw(parts: list[Path], out: Path) -> None:
    with out.open("wb") as f:
        for p in parts:
            f.write(p.read_bytes())


async def build_section(test_id: str, section: dict, force: bool) -> None:
    number = section["number"]
    out = ROOT / "public" / section["audioSrc"].lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)

    if out.exists() and not force:
        print(f"  bo qua  section {number} (da co {out.name})")
        return

    voices = section.get("voices") or {}
    transcript = section["transcript"]
    print(f"  tao     section {number}: {len(transcript)} luot noi -> {out.name}")

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        parts: list[Path] = []
        for i, line in enumerate(transcript):
            speaker = line.get("speaker") or "Narrator"
            voice = voices.get(speaker, DEFAULT_VOICE)
            piece = tmp / f"{i:04d}.mp3"
            for attempt in range(3):
                try:
                    await say(line["text"], voice, piece)
                    break
                except Exception as err:
                    if attempt == 2:
                        raise
                    print(f"    thu lai luot {i} ({err.__class__.__name__})")
                    await asyncio.sleep(2)
            parts.append(piece)
            print(f"    {i + 1}/{len(transcript)}", end="\r", flush=True)

        print(" " * 30, end="\r")
        if HAS_FFMPEG:
            concat_with_ffmpeg(parts, out, tmp)
        else:
            concat_raw(parts, out)

    size_kb = out.stat().st_size // 1024
    print(f"  xong    {out.name} ({size_kb} KB)")


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="tao lai ca nhung file da co")
    ap.add_argument("--test", help="chi tao cho mot de, vi du lt-01")
    args = ap.parse_args()

    files = sorted(DATA.glob("*.json"))
    if args.test:
        files = [f for f in files if f.stem == args.test]
    if not files:
        sys.exit("Khong tim thay de Listening nao trong data/listening/")

    if not HAS_FFMPEG:
        print("Luu y: khong tim thay ffmpeg nen cac luot noi se noi lien nhau khong co khoang lang.")
        print("       Cai ffmpeg de audio tu nhien hon:  brew install ffmpeg\n")

    OUT.mkdir(parents=True, exist_ok=True)

    for f in files:
        test = json.loads(f.read_text(encoding="utf-8"))
        print(f"\n{test['id']} - {test['title']}")
        for section in test["sections"]:
            await build_section(test["id"], section, args.force)

    print("\nHoan tat. File nam trong public/audio/")


if __name__ == "__main__":
    asyncio.run(main())
