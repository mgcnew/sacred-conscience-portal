#!/usr/bin/env python3
"""
Gera todos os ícones do PWA a partir de uma única arte de origem.

    python3 scripts/gerar-icones.py caminho/da/arte.png

Opções:
    --fundo auto|#RRGGBB   cor de fundo (padrão: auto = amostra do canto da arte)
    --sem-corte            não recorta a moldura vazia em volta da arte

Por que cada arquivo é diferente:

- pwa-192 / pwa-512 ("any"): a arte quase inteira, com uma margem pequena.
- pwa-512-maskable: o Android recorta o ícone na forma do tema do aparelho
  (círculo, squircle, gota). Só os 80% centrais são garantidos — por isso a
  arte entra reduzida, com o resto preenchido de cor sólida. Sem isso, o anel
  externo do emblema é cortado no lançador.
- apple-touch-icon: o iOS não respeita transparência, pinta de preto atrás.
  Por isso este sai sempre opaco.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta o Pillow. Instale com: pip install Pillow")

RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"

# fração da largura ocupada pela arte em cada variante
MARGEM = {"any": 0.96, "maskable": 0.80}


def cor_de_fundo(img: Image.Image) -> tuple[int, int, int, int]:
    """Amostra os quatro cantos; se forem iguais, é a cor de fundo da arte."""
    l, a = img.size
    cantos = [img.getpixel(p) for p in ((2, 2), (l - 3, 2), (2, a - 3), (l - 3, a - 3))]
    if all(c[3] < 16 for c in cantos):  # arte com fundo transparente
        return (255, 255, 255, 255)
    r = sum(c[0] for c in cantos) // 4
    g = sum(c[1] for c in cantos) // 4
    b = sum(c[2] for c in cantos) // 4
    return (r, g, b, 255)


def recortar(img: Image.Image, fundo) -> Image.Image:
    """Remove a moldura de cor uniforme em volta do emblema."""
    from PIL import ImageChops

    base = Image.new("RGBA", img.size, fundo)
    caixa = ImageChops.difference(img.convert("RGBA"), base).convert("L").point(
        lambda v: 255 if v > 12 else 0
    ).getbbox()
    if not caixa:
        return img
    # mantém o emblema centralizado: expande a caixa para ficar quadrada
    x0, y0, x1, y1 = caixa
    lado = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    m = lado // 2
    return img.crop((cx - m, cy - m, cx + m, cy + m))


def compor(arte: Image.Image, lado: int, fracao: float, fundo, opaco: bool) -> Image.Image:
    tela = Image.new("RGBA", (lado, lado), fundo if opaco else (0, 0, 0, 0))
    d = int(lado * fracao)
    red = arte.resize((d, d), Image.LANCZOS)
    off = (lado - d) // 2
    tela.paste(red, (off, off), red)
    return tela


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("origem", type=Path)
    p.add_argument("--fundo", default="auto")
    p.add_argument("--sem-corte", action="store_true")
    args = p.parse_args()

    if not args.origem.exists():
        sys.exit(f"Arquivo não encontrado: {args.origem}")

    arte = Image.open(args.origem).convert("RGBA")
    if min(arte.size) < 512:
        print(f"  aviso: origem tem {arte.size[0]}x{arte.size[1]}; o ideal é 1024x1024 ou mais")

    if args.fundo == "auto":
        fundo = cor_de_fundo(arte)
    else:
        h = args.fundo.lstrip("#")
        fundo = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    print(f"  fundo: #{fundo[0]:02x}{fundo[1]:02x}{fundo[2]:02x}")

    if not args.sem_corte:
        antes = arte.size
        arte = recortar(arte, fundo)
        print(f"  recorte: {antes[0]}x{antes[1]} -> {arte.size[0]}x{arte.size[1]}")

    saidas = [
        ("pwa-192x192.png", 192, MARGEM["any"], True),
        ("pwa-512x512.png", 512, MARGEM["any"], True),
        ("pwa-512x512-maskable.png", 512, MARGEM["maskable"], True),
        ("apple-touch-icon.png", 180, MARGEM["any"], True),
        ("favicon.png", 32, 1.0, True),
    ]

    for nome, lado, fracao, opaco in saidas:
        img = compor(arte, lado, fracao, fundo, opaco)
        # Paleta de 256 cores: os ícones entram no precache do service worker, e
        # numa arte ilustrada isso corta ~2/3 do peso sem diferença visível.
        img = img.convert("RGB").quantize(
            colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG
        )
        destino = PUBLIC / nome
        img.save(destino, "PNG", optimize=True)
        print(f"  ok  {nome:28} {lado}x{lado}  {destino.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
