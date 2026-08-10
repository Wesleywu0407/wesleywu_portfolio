"""Generated clip -> stabilised, seamlessly looping sprite sheet.

    python3 make_sprite.py walk.mp4 walk 14

Three problems have to be solved to make a generated clip usable as a loop:

1. DRIFT. The model shifts and rescales the figure even when told to lock the
   camera. Every frame is re-anchored on the character: cut the background,
   normalise the figure's height, and pin it by the navy cap's centroid — the
   only saturated blue on the plate, and a stable proxy for the head.

   The head is the anchor rather than the feet on purpose. Anchoring on the
   shoes leaves the head swinging ~12px sideways, and the pupils are drawn on
   top at fixed coordinates, so they slide off the eyes. Pinning the head is
   also truer to life: weight shifts happen under a still head.

2. THE SEAM. A generated clip does not start and end on the same pose, so
   looping it snaps. Rather than ping-ponging — which reads as motion running
   backwards — this searches for the frame that best matches the first frame and
   cuts there, giving one true cycle that meets itself.

3. WEIGHT. Frames are cropped to a bounding box shared by the whole sequence,
   scaled to display size and palette-quantised, which is what keeps a 14-frame
   sheet near 200KB instead of several MB.
"""
import json
import subprocess
import sys
import tempfile
from collections import deque
from fractions import Fraction
from pathlib import Path

import numpy as np
from PIL import Image

BG_TOLERANCE = 26
CELL_HEIGHT = 560
COLORS = 120
OUT = Path(__file__).resolve().parents[1] / 'public' / 'character'

# The clip has the irises painted in, and a painted iris cannot look anywhere.
# They are erased from every frame so the site can draw live pupils on top —
# which only works because the frames are anchored on the head, so the eyes sit
# in the same place in all of them.
#
# Measured off a stabilised frame, not derived. Deriving them from the cap's
# centroid came out ~5px high, which left the real iris showing round the edge
# and cut white into the eyelid. These coordinates are in the stabilised canvas,
# which is deterministic for a given clip because the head is pinned to a fixed
# anchor — so re-measure these if the idle clip is ever regenerated.
EYES_IN_CANVAS = ((410.0, 261.1), (457.1, 261.1))
EYE_ERASE_RADIUS = 6.2
SCLERA = (250, 250, 248)


def cut_background(rgb):
    height, width = rgb.shape[:2]
    near_white = (255 - rgb.min(axis=2)) < BG_TOLERANCE
    seen = np.zeros((height, width), dtype=bool)
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width \
                    and near_white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    # Generated white plates often gain faint paper texture late in a clip.
    # Those isolated marks are not connected to the character, but the basic
    # flood-fill above would keep them as opaque speckles. Start from the dark
    # pixel nearest the canvas centre (reliably the jacket/torso) and retain only
    # the connected character silhouette. This intentionally drops the model's
    # synthetic floor shadow as well.
    foreground = ~seen
    candidates = np.argwhere(foreground & (rgb.min(axis=2) < 220))
    if len(candidates) == 0:
        return np.zeros((height, width), dtype=np.uint8)
    centre = np.array([height / 2, width / 2])
    seed_y, seed_x = candidates[np.argmin(((candidates - centre) ** 2).sum(axis=1))]
    keep = np.zeros((height, width), dtype=bool)
    queue = deque([(int(seed_y), int(seed_x))])
    keep[seed_y, seed_x] = True
    while queue:
        y, x = queue.popleft()
        for dy, dx in (
            (1, 0), (-1, 0), (0, 1), (0, -1),
            (1, 1), (1, -1), (-1, 1), (-1, -1),
        ):
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width \
                    and foreground[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True
                queue.append((ny, nx))
    return np.where(keep, 255, 0).astype(np.uint8)


def cap_centroid(rgba):
    r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    navy = (a > 128) & (b > r + 18) & (b > 60) & (b < 170) & (r < 110)
    ys, xs = np.nonzero(navy)
    if len(xs) == 0:
        return None
    return xs.mean(), ys.mean()


def load_frames(clip, every):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', clip,
             '-vf', f"select='not(mod(n\\,{every}))'", '-vsync', '0',
             f'{tmp}/f%04d.png'],
            check=True,
        )
        return [np.asarray(Image.open(p).convert('RGB')).astype(int)
                for p in sorted(Path(tmp).glob('*.png'))]


def source_fps(clip):
    """Read the clip rate so the generated sheet can preserve real timing."""
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=avg_frame_rate', '-of', 'json', clip],
        check=True,
        capture_output=True,
        text=True,
    )
    rate = json.loads(result.stdout)['streams'][0]['avg_frame_rate']
    return float(Fraction(rate))


def erase_irises(canvas, eyes):
    """Whiten the painted irises so live pupils can be drawn over them."""
    rgba = np.asarray(canvas).astype(int).copy()
    height, width = rgba.shape[:2]
    ys, xs = np.mgrid[0:height, 0:width]
    luma = rgba[..., :3] @ np.array([0.299, 0.587, 0.114])
    for cx, cy in eyes:
        inside = ((xs - cx) ** 2 + (ys - cy) ** 2) <= EYE_ERASE_RADIUS ** 2
        rgba[inside & (luma < 120) & (rgba[..., 3] > 8), :3] = SCLERA
    return Image.fromarray(rgba.astype(np.uint8), 'RGBA')


def stabilise(frames, anchor_mode='head'):
    """Normalise generated plates around a deliberate performance anchor.

    Front idle assets use the cap/head because their live DOM pupils require
    the eyes to stay in one coordinate system. A performance whose point is a
    small head movement must instead use the planted shoes; otherwise the
    stabiliser would erase the acting and move the body underneath the head.
    """
    if anchor_mode not in {'head', 'feet'}:
        raise ValueError(f'Unsupported anchor mode: {anchor_mode}')
    plates = []
    for rgb in frames:
        alpha = cut_background(rgb)
        ys, xs = np.nonzero(alpha > 8)
        if len(xs) == 0:
            continue
        plates.append((np.dstack([rgb, alpha]).astype(np.uint8),
                       (xs.min(), ys.min(), xs.max(), ys.max())))

    target = int(np.median([b[3] - b[1] for _, b in plates]))
    canvas_size = (900, 1300)
    head_anchor = (canvas_size[0] / 2, canvas_size[1] * 0.16)
    feet_anchor = (canvas_size[0] / 2, canvas_size[1] * 0.95)

    out = []
    for rgba, (x0, y0, x1, y1) in plates:
        crop = Image.fromarray(rgba[y0:y1 + 1, x0:x1 + 1], 'RGBA')
        scale = target / (y1 - y0)
        crop = crop.resize((max(1, int(round(crop.width * scale))), target), Image.LANCZOS)
        crop_rgba = np.asarray(crop).astype(int)
        if anchor_mode == 'head':
            source_anchor = cap_centroid(crop_rgba)
            target_anchor = head_anchor
        else:
            alpha = crop_rgba[..., 3]
            ys, xs = np.nonzero(alpha > 8)
            if len(xs) == 0:
                continue
            floor = int(ys.max())
            # The bottom 3.5% contains the two planted shoes. Their combined
            # centroid stays stable even when the head turns a few pixels.
            band = ys >= floor - max(4, int(round(target * 0.035)))
            source_anchor = (float(xs[band].mean()), float(floor))
            target_anchor = feet_anchor
        if source_anchor is None:
            continue
        canvas = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
        canvas.paste(
            crop,
            (
                int(round(target_anchor[0] - source_anchor[0])),
                int(round(target_anchor[1] - source_anchor[1])),
            ),
            crop,
        )
        out.append(canvas)
    return out, list(EYES_IN_CANVAS)


def find_cycle(frames, minimum=6):
    """Index whose frame best matches frame 0 — one full cycle."""
    first = np.asarray(frames[0].convert('RGB')).astype(np.int16)
    best, score = len(frames), None
    for index in range(minimum, len(frames)):
        diff = np.abs(np.asarray(frames[index].convert('RGB')).astype(np.int16) - first).mean()
        if score is None or diff < score:
            best, score = index, diff
    print(f'  loop closes at frame {best} (mean diff {score:.2f})')
    return best


def build_sheet(frames, name, eyes):
    mask = np.zeros(frames[0].size[::-1], dtype=bool)
    for frame in frames:
        mask |= np.asarray(frame)[..., 3] > 8
    ys, xs = np.nonzero(mask)
    box = (xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)

    width = int(round((box[2] - box[0]) * CELL_HEIGHT / (box[3] - box[1])))
    scale = CELL_HEIGHT / (box[3] - box[1])
    sheet = Image.new('RGBA', (width * len(frames), CELL_HEIGHT), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame.crop(box).resize((width, CELL_HEIGHT), Image.LANCZOS), (index * width, 0))

    path = OUT / f'{name}.png'
    sheet.quantize(colors=COLORS, method=Image.FASTOCTREE).save(path, optimize=True)
    size = path.stat().st_size / 1024
    print(f'  {name}: {len(frames)} frames, cell {width}x{CELL_HEIGHT}, {size:.0f}KB')

    # Eyes as a fraction of one cell, which is what the component needs.
    placed = [{'x': round((ex - box[0]) * scale / width, 5),
               'y': round((ey - box[1]) * scale / CELL_HEIGHT, 5)} for ex, ey in eyes]
    return {'frames': len(frames), 'cell': [width, CELL_HEIGHT], 'eyes': placed}


def main():
    clip, name, every = sys.argv[1], sys.argv[2], int(sys.argv[3])
    wants_eyes = name == 'idle'
    print(f'{name}: reading {clip}')
    fps = source_fps(clip) / every
    frames, eyes = stabilise(load_frames(clip, every))
    print(f'  {len(frames)} usable frames')
    frames = frames[:find_cycle(frames)]
    if wants_eyes:
        frames = [erase_irises(frame, eyes) for frame in frames]
        print(f'  irises erased at {[(round(x), round(y)) for x, y in eyes]}')
    meta = build_sheet(frames, name, eyes)
    meta['fps'] = round(fps, 3)
    print(json.dumps({name: meta}, indent=2))


if __name__ == '__main__':
    sys.exit(main())
