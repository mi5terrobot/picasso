#!/usr/bin/env python3
"""
Bilder umwandeln: JPG/PNG im Ordner images/ -> WebP

Ablauf:
  1. Neue Screenshots als JPG (oder PNG) in den Ordner images/ legen.
  2. In der index.html ganz normal  <img src="images/bild.jpg" alt="">  schreiben.
  3. Dieses Skript starten:   python3 bilder-umwandeln.py
     (unter Windows ggf.:      py bilder-umwandeln.py)

Das Skript ...
  - wandelt jedes JPG/PNG in images/ in ein WebP um,
  - verkleinert zu große Bilder auf höchstens 900 px Breite,
  - verschiebt die Originale nach images/original/ (die musst du nicht hochladen),
  - ändert in der index.html .jpg/.png auf .webp,
  - ergänzt loading="lazy" bei allen Bildern in den Themen.

Einmalig nötig:  pip install pillow
Du kannst das Skript beliebig oft laufen lassen, bereits Erledigtes wird übersprungen.
"""

import re
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow fehlt. Einmalig installieren mit:  pip install pillow")

ORDNER = Path(__file__).resolve().parent
BILDER = ORDNER / "images"
ORIGINALE = BILDER / "original"
HTML = ORDNER / "index.html"

MAX_BREITE = 900   # doppelte Seitenbreite (450 px), damit es auf Handys scharf bleibt
QUALITAET = 85     # 0-100; 85 hält Bildschirmtext sauber


def bilder_umwandeln():
    ORIGINALE.mkdir(exist_ok=True)
    neu = 0
    for datei in sorted(BILDER.iterdir()):
        if datei.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        ziel = datei.with_suffix(".webp")
        with Image.open(datei) as bild:
            bild = bild.convert("RGBA" if bild.mode in ("RGBA", "LA", "P") else "RGB")
            if bild.width > MAX_BREITE:
                hoehe = round(bild.height * MAX_BREITE / bild.width)
                bild = bild.resize((MAX_BREITE, hoehe), Image.LANCZOS)
            bild.save(ziel, "WEBP", quality=QUALITAET, method=6)
        alt_kb, neu_kb = datei.stat().st_size // 1024, ziel.stat().st_size // 1024
        shutil.move(str(datei), ORIGINALE / datei.name)
        print(f"  {datei.name:35} {alt_kb:5} KB  ->  {ziel.name} {neu_kb} KB")
        neu += 1
    print(f"{neu} Bild(er) umgewandelt." if neu else "Keine neuen Bilder gefunden.")


def html_anpassen():
    text = HTML.read_text(encoding="utf-8")
    vorher = text

    # images/xyz.jpg -> images/xyz.webp (nur wenn das WebP auch existiert)
    def ersetze(m):
        webp = Path(m.group(1)).with_suffix(".webp")
        return str(webp).replace("\\", "/") if (ORDNER / webp).exists() else m.group(0)
    text = re.sub(r"(images/[\w\-./]+?\.(?:jpe?g|png))", ersetze, text, flags=re.I)

    # loading="lazy" bei allen Bildern ab dem ersten Thema (nicht beim Titelbild oben)
    start = text.find("<section")
    if start != -1:
        kopf, rest = text[:start], text[start:]
        rest = re.sub(r"<img(?![^>]*\bloading=)", '<img loading="lazy"', rest)
        text = kopf + rest

    if text != vorher:
        HTML.write_text(text, encoding="utf-8")
        print("index.html angepasst.")
    else:
        print("index.html war schon aktuell.")


if __name__ == "__main__":
    bilder_umwandeln()
    html_anpassen()
