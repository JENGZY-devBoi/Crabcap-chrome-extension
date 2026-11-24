"""วาดไอคอน CrabCap: ปูสีแดงส้มถือกล้อง โผล่พาดขอบสีเข้ม สไตล์เดียวกับไอคอน MeowMerge

    python3 dev/make-icon.py         เขียน icons/icon{16,32,48,128}.png, icons/app-icon.png,
                                     icons/mascot.svg (มี animation) และ icons/mascot-static.svg
    python3 dev/make-icon.py <dir>   เขียนเฉพาะ <dir>/app-icon.png และ <dir>/toolbar128.png ไว้ดูภาพ

ต้องมี Pillow (pip install pillow)
"""
import sys

from PIL import Image, ImageDraw, ImageFilter

# ---------- sprite ----------
COLS, ROWS = 26, 20
LEDGE_ROW = 16  # แถวที่กล้องวางบนขอบ (ขอบบนของแผ่นสีเข้มในไอคอน)

COLOURS = {
    "O": "#4a1208",  # เส้นขอบ
    "F": "#ff5a36",  # กระดองแดงส้ม
    "Y": "#ff8f66",  # ไฮไลต์ด้านบน
    "P": "#d63a1f",  # เงาด้านล่าง
    "S": "#ffb08f",  # จุดบนกระดอง
    "W": "#ffffff",  # ตาขาว
    "K": "#14151a",  # ตาดำ
    "C": "#3b3f4a",  # ตัวกล้อง
    "D": "#565b68",  # ขอบบนกล้อง
    "E": "#16171c",  # วงเลนส์
    "B": "#3d8bff",  # กระจกเลนส์
    "H": "#ffffff",  # ประกายเลนส์
    "L": "#fff3b0",  # ไฟแฟลช
    "A": "#ffd23f",  # ปุ่มชัตเตอร์สีเหลือง (ตัดกับตัวปูสีส้ม)
    "R": "#ff9fb2",  # แก้มแดง
}


def rows_to_cells(spans):
    return {(r, c) for r, (a, b) in spans.items() for c in range(a, b + 1)}


def mirror(cells):
    return {(r, COLS - 1 - c) for r, c in cells}


# ตัวปู: กระดองกลม หน้ายิ้มแก้มแดง ก้ามชูสองข้าง (มีร่องก้ามรูปตัว V) ขา 3 คู่ กล้องห้อยสายคล้องคออยู่ที่พุง
SHELL = rows_to_cells({7: (8, 17), 8: (6, 19), 9: (5, 20), 10: (4, 21), 11: (4, 21), 12: (4, 21), 13: (4, 21), 14: (4, 21), 15: (5, 20)})
LEFT_LEGS = {(11, 3), (12, 2), (13, 1), (14, 3), (15, 2), (16, 2), (16, 6), (17, 6)}
LEGS = LEFT_LEGS | mirror(LEFT_LEGS)
STALKS = {(4, 9), (5, 9), (6, 9), (4, 16), (5, 16), (6, 16)}
EYES = rows_to_cells({1: (8, 10), 2: (8, 10), 3: (8, 10)}) | rows_to_cells({1: (15, 17), 2: (15, 17), 3: (15, 17)})
PUPILS = {(2, 9), (3, 9), (2, 16), (3, 16)}
SHELL_SPOTS = {(8, 7), (8, 18), (7, 12), (7, 13)}
BLUSH = {(9, 6), (9, 7), (9, 18), (9, 19)}
SMILE = {(8, 11), (9, 12), (9, 13), (8, 14)}

CAMERA = rows_to_cells({r: (8, 17) for r in range(12, 16)}) | {(11, 14), (11, 15)}
CAMERA_TOP = {(12, c) for c in range(8, 18)}
LENS_RING = {(12, 12), (12, 13), (13, 11), (14, 11), (13, 14), (14, 14), (15, 12), (15, 13)}
LENS_GLASS = {(13, 12), (13, 13), (14, 12), (14, 13)}
LENS_GLINT = {(13, 12)}
FLASH_BULB = {(13, 15), (13, 16)}
SHUTTER = {(11, 14), (11, 15)}

# ก้ามชูขึ้น ปลายแยกสองแฉก ร่องตรงกลางเป็นเส้นเข้ม (CLAW_GAP) แขนเฉียงลงมาหาตัว
LEFT_CLAW = rows_to_cells({1: (1, 5), 2: (1, 5), 3: (1, 5), 4: (1, 5), 5: (2, 4), 6: (4, 4), 7: (5, 5)})
CLAW_GAP = {(1, 3), (2, 3)} | mirror({(1, 3), (2, 3)})  # ร่องก้าม (ท่าพักอ้าอยู่ ตอนหนีบจะถูกปิด)
CLAWS = LEFT_CLAW | mirror(LEFT_CLAW)

NEIGHBOURS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def shade(grid, cells):
    """ไฮไลต์ขอบบน เงาขอบล่าง ให้ดูกลม"""
    for r, c in cells:
        above, below = (r - 1, c) in cells, (r + 1, c) in cells
        grid[r][c] = "Y" if not above else ("P" if not below else "F")


def outline(grid, group):
    for r in range(ROWS):
        for c in range(COLS):
            if (r, c) not in group and any((r + dr, c + dc) in group for dr, dc in NEIGHBOURS):
                grid[r][c] = "O"


def paint(grid, cells, key):
    for r, c in cells:
        grid[r][c] = key


def build_grid():
    """ตัวปูท่าพัก (ก้ามชูอ้า) แต่ละช่องเป็นตัวอักษรใน COLOURS หรือ None"""
    grid = [[None] * COLS for _ in range(ROWS)]

    body = SHELL | LEGS
    shade(grid, body)
    paint(grid, SHELL_SPOTS, "S")
    outline(grid, body)

    # ก้ามชู: ร่องปลายก้ามไม่ใช่เนื้อก้าม จึงถูกตีเป็นเส้นขอบ เห็นเป็นก้ามแยกสองแฉก
    claws = CLAWS - CLAW_GAP
    shade(grid, claws)
    outline(grid, claws)

    eyes = STALKS | EYES
    paint(grid, STALKS, "F")
    paint(grid, EYES, "W")
    outline(grid, eyes)
    paint(grid, PUPILS, "K")

    paint(grid, BLUSH, "R")
    paint(grid, SMILE, "O")

    paint(grid, CAMERA, "C")
    paint(grid, CAMERA_TOP, "D")
    outline(grid, CAMERA)
    paint(grid, LENS_RING, "E")
    paint(grid, LENS_GLASS, "B")
    paint(grid, LENS_GLINT, "H")
    paint(grid, FLASH_BULB, "L")
    paint(grid, SHUTTER, "A")
    return grid


def rgb(hex_colour):
    return tuple(int(hex_colour[i:i + 2], 16) for i in (1, 3, 5))


# ---------- app icon (การ์ดแบบ MeowMerge) ----------
SIZE = 1024
TILE_MARGIN = 100
TILE_RADIUS = 185
CELL = 30
TILE_TOP = "#f6f7f8"
TILE_BOTTOM = "#e1e3e7"
LEDGE = "#202126"
SPARKLE = "#ff7a3d"  # สีส้มของแอป
SPARKLE_CELL = 10
PLUS_ROWS = ["..P..", "..P..", "PPPPP", "..P..", "..P.."]
SPARKLE_SPOTS = [(160, 190), (270, 130), (790, 130), (850, 215)]
LEDGE_TOP = 760


def draw_grid(draw, grid, left, top, cell):
    for r, row in enumerate(grid):
        for c, key in enumerate(row):
            if key:
                x, y = left + c * cell, top + r * cell
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=rgb(COLOURS[key]) + (255,))


def draw_tile():
    tile = Image.new("RGBA", (SIZE, SIZE))
    draw = ImageDraw.Draw(tile)
    top, bottom = rgb(TILE_TOP), rgb(TILE_BOTTOM)
    for y in range(SIZE):
        t = min(1.0, max(0.0, (y - TILE_MARGIN) / (LEDGE_TOP - TILE_MARGIN)))
        colour = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (SIZE, y)], fill=colour + (255,))
    draw.rectangle([0, LEDGE_TOP, SIZE, SIZE], fill=rgb(LEDGE) + (255,))
    for x0, y0 in SPARKLE_SPOTS:
        for r, row in enumerate(PLUS_ROWS):
            for c, key in enumerate(row):
                if key == "P":
                    x, y = x0 + c * SPARKLE_CELL, y0 + r * SPARKLE_CELL
                    draw.rectangle([x, y, x + SPARKLE_CELL - 1, y + SPARKLE_CELL - 1], fill=rgb(SPARKLE) + (255,))
    return tile


def app_icon():
    tile = draw_tile()
    left = (SIZE - COLS * CELL) // 2
    top = LEDGE_TOP - LEDGE_ROW * CELL
    draw_grid(ImageDraw.Draw(tile), build_grid(), left, top, CELL)

    icon = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [TILE_MARGIN, TILE_MARGIN + 12, SIZE - TILE_MARGIN, SIZE - TILE_MARGIN + 12],
        radius=TILE_RADIUS, fill=(20, 20, 24, 90),
    )
    icon.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [TILE_MARGIN, TILE_MARGIN, SIZE - TILE_MARGIN, SIZE - TILE_MARGIN], radius=TILE_RADIUS, fill=255,
    )
    icon.paste(tile, (0, 0), mask)
    return icon


def toolbar_icon(size):
    """ไอคอนของ extension (แถบเครื่องมือและหน้า chrome://extensions): ตัวปูเต็มกรอบ ไม่มีพื้นหลัง
    ตัดขอบว่างออกก่อน แล้วขยายเป็นจำนวนเท่าเต็มให้พิกเซลคม ขนาดที่ขยายเต็มไม่ได้ใช้ย่อแบบนุ่ม"""
    grid = build_grid()
    cells = [(r, c) for r in range(ROWS) for c in range(COLS) if grid[r][c]]
    top, bottom = min(r for r, _ in cells), max(r for r, _ in cells)
    left, right = min(c for _, c in cells), max(c for _, c in cells)
    side = max(bottom - top + 1, right - left + 1)
    sprite = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    off_y = (side - (bottom - top + 1)) // 2
    off_x = (side - (right - left + 1)) // 2
    for r, c in cells:
        sprite.putpixel((c - left + off_x, r - top + off_y), rgb(COLOURS[grid[r][c]]) + (255,))

    scale = size // side
    if scale >= 2:
        big = sprite.resize((side * scale, side * scale), Image.NEAREST)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        pad = (size - side * scale) // 2
        out.paste(big, (pad, pad))
        return out
    # ย่อจากภาพใหญ่ที่คมก่อน จะได้ขอบนุ่มแต่ไม่เบลอ
    big = sprite.resize((side * 8, side * 8), Image.NEAREST)
    return big.resize((size, size), Image.LANCZOS)


# ---------- mascot SVG ----------
def grid_rects(grid):
    rects = []
    for r, row in enumerate(grid):
        c = 0
        while c < COLS:
            key = row[c]
            end = c
            while end + 1 < COLS and row[end + 1] == key:
                end += 1
            if key:
                rects.append(f'<rect x="{c}" y="{r}" width="{end - c + 1}" height="1" fill="{COLOURS[key]}"/>')
            c = end + 1
    return "".join(rects)


def cell_rects(cells):
    return "".join(f'<rect x="{c}" y="{r}" width="1" height="1"/>' for r, c in sorted(cells))


def svg_open():
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {COLS} {ROWS}" shape-rendering="crispEdges">'


def mascot_svg():
    return svg_open() + grid_rects(build_grid()) + snap_and_blink() + camera_flash() + "</svg>"


def static_svg():
    """แบบนิ่งสำหรับการ์ดความคืบหน้า (ไม่มี id จึงใส่หลายตัวใน shadow DOM เดียวกันได้)"""
    return svg_open() + grid_rects(build_grid()) + "</svg>"


# animation ทุกตัวใช้ SMIL ที่ต่อคิวตัวเอง (begin="...;id.end+รอ") ช่วงที่รอจึงไม่มีอะไรทำงาน ไม่เปลืองเครื่อง
FLASH_EVERY_SECONDS = 30
FLASH_SECONDS = 0.45
FIRST_FLASH_SECONDS = 0.4


def camera_flash():
    """แฟลชกล้องสว่างวาบตอนเปิดหน้า แล้วซ้ำทุก 30 วิ"""
    r, c = min(FLASH_BULB)
    cx, cy = c + 1, r + 0.5
    wait = FLASH_EVERY_SECONDS - FLASH_SECONDS
    return (
        '<radialGradient id="flashglow"><stop offset="0" stop-color="#ffffff"/>'
        '<stop offset="0.35" stop-color="#fff6c8" stop-opacity="0.9"/>'
        '<stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>'
        f'<circle cx="{cx}" cy="{cy}" r="7" fill="url(#flashglow)" opacity="0" shape-rendering="auto">'
        f'<animate id="flash" attributeName="opacity" values="0;1;0.6;0" keyTimes="0;0.15;0.4;1" '
        f'dur="{FLASH_SECONDS}s" begin="{FIRST_FLASH_SECONDS}s;flash.end+{wait:g}s" fill="freeze"/>'
        "</circle>"
    )


SNAP_EVERY_SECONDS = 15
FIRST_SNAP_SECONDS = 1.3
SNAP_FRAME_SECONDS = 0.1
# แต่ละเฟรม: (ก้ามหุบ, กะพริบตา) หนีบ 2 ครั้ง แล้วกะพริบตา จบที่ท่าพัก (ก้ามอ้า ตาเปิด)
SNAP_FRAMES = [(1, 0), (0, 0), (1, 0), (0, 0), (0, 1), (0, 1), (0, 0)]


def snap_and_blink():
    """ก้ามหนีบเข้าออกและกะพริบตา เล่นตอนเปิดหน้าแล้วซ้ำทุก 15 วิ"""
    dur = SNAP_FRAME_SECONDS * len(SNAP_FRAMES)
    wait = SNAP_EVERY_SECONDS - dur
    close_values = ";".join("visible" if f[0] else "hidden" for f in SNAP_FRAMES)
    blink_values = ";".join("visible" if f[1] else "hidden" for f in SNAP_FRAMES)
    # ตาหลับ: ปิดตาด้วยสีกระดอง เหลือเส้นล่างเป็นขีด
    closed_lines = "".join(
        f'<rect x="{min(c for _, c in side)}" y="3" width="3" height="1" fill="{COLOURS["O"]}"/>'
        for side in ({e for e in EYES if e[1] < COLS // 2}, {e for e in EYES if e[1] >= COLS // 2})
    )
    return (
        f'<g fill="{COLOURS["F"]}" visibility="hidden">{cell_rects(CLAW_GAP)}'
        f'<animate id="snap" attributeName="visibility" calcMode="discrete" values="{close_values}" '
        f'dur="{dur:g}s" begin="{FIRST_SNAP_SECONDS:g}s;snap.end+{wait:g}s" fill="freeze"/></g>'
        f'<g fill="{COLOURS["F"]}" visibility="hidden">{cell_rects(EYES)}{closed_lines}'
        f'<animate attributeName="visibility" calcMode="discrete" values="{blink_values}" '
        f'dur="{dur:g}s" begin="snap.begin" fill="freeze"/></g>'
    )


def main():
    if len(sys.argv) > 1:
        app_icon().save(f"{sys.argv[1]}/app-icon.png")
        toolbar_icon(128).save(f"{sys.argv[1]}/toolbar128.png")
        return
    big = app_icon()
    big.save("icons/app-icon.png")
    # ไอคอนของ extension ทุกขนาดเป็นตัวปูเต็มกรอบ (การ์ดเต็มรูปแบบเก็บไว้ที่ app-icon.png)
    for size in (16, 32, 48, 128):
        toolbar_icon(size).save(f"icons/icon{size}.png")
    with open("icons/mascot.svg", "w") as f:
        f.write(mascot_svg())
    with open("icons/mascot-static.svg", "w") as f:
        f.write(static_svg())


if __name__ == "__main__":
    main()
