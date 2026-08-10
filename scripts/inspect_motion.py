"""Create an objective QA report and contact sheet for a generated motion clip.

Usage:
    python3 scripts/inspect_motion.py scripts/clips/turn-front-to-walk.mp4

The measurements are taken before sprite stabilization. They make camera/scale
drift and floor-line changes visible, while the contact sheet is used for the
animation-director pass (identity, silhouette, weight transfer, and artifacts).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


SAMPLES = 16
BG_TOLERANCE = 28


def probe(path):
    result = subprocess.run(
        [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,avg_frame_rate,nb_frames,duration',
            '-of', 'json', str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)['streams'][0]


def extract_samples(path, target):
    subprocess.run(
        [
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(path),
            '-vf', f'fps={SAMPLES}/4', '-frames:v', str(SAMPLES),
            str(target / 'frame-%02d.png'),
        ],
        check=True,
    )
    return [Image.open(item).convert('RGB') for item in sorted(target.glob('frame-*.png'))]


def foreground(rgb):
    # Generated plates are white. Requiring all channels to be near white keeps
    # pale skin and the T-shirt inside the figure while discarding the backdrop.
    return np.min(rgb, axis=2) < 255 - BG_TOLERANCE


def metrics(frame):
    rgb = np.asarray(frame)
    mask = foreground(rgb)
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())

    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    navy = mask & (b > r + 18) & (b > 55) & (b < 175) & (r < 115)
    cap_y, cap_x = np.nonzero(navy)
    head = None if not len(cap_x) else [round(float(cap_x.mean()), 2), round(float(cap_y.mean()), 2)]
    return {
        'box': [x0, y0, x1, y1],
        'width': x1 - x0 + 1,
        'height': y1 - y0 + 1,
        'floor_y': y1,
        'head': head,
        'touches_edge': x0 <= 1 or y0 <= 1 or x1 >= frame.width - 2 or y1 >= frame.height - 2,
    }


def spread(values):
    valid = [value for value in values if value is not None]
    return None if not valid else round(max(valid) - min(valid), 2)


def make_contact_sheet(frames, rows, output):
    thumb_width = 270
    thumb_height = round(frames[0].height * thumb_width / frames[0].width)
    columns = 4
    gutter = 16
    label = 28
    sheet = Image.new(
        'RGB',
        (columns * thumb_width + (columns + 1) * gutter,
         4 * (thumb_height + label) + 5 * gutter),
        '#d8d8d5',
    )
    draw = ImageDraw.Draw(sheet)
    for index, (frame, row) in enumerate(zip(frames, rows)):
        x = gutter + (index % columns) * (thumb_width + gutter)
        y = gutter + (index // columns) * (thumb_height + label + gutter)
        sheet.paste(frame.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS), (x, y))
        draw.text((x, y + thumb_height + 5), f'{index:02d}  floor {row["floor_y"]}', fill='#161616')
    sheet.save(output, optimize=True)


def main():
    clip = Path(sys.argv[1]).resolve()
    if not clip.exists():
        raise SystemExit(f'Clip not found: {clip}')
    report_path = clip.with_suffix('.qa.json')
    contact_path = clip.with_suffix('.contact.png')

    with tempfile.TemporaryDirectory() as directory:
        frames = extract_samples(clip, Path(directory))
        rows = [metrics(frame) for frame in frames]
        if any(row is None for row in rows):
            raise SystemExit('Could not isolate the character in every sampled frame.')
        make_contact_sheet(frames, rows, contact_path)

    heights = [row['height'] for row in rows]
    median_height = float(np.median(heights))
    heads = [row['head'] for row in rows]
    report = {
        'source': str(clip),
        'stream': probe(clip),
        'samples': len(rows),
        'raw_scale_range_percent': round(spread(heights) / median_height * 100, 2),
        'raw_floor_range_px': spread([row['floor_y'] for row in rows]),
        'raw_head_x_range_px': spread([head[0] if head else None for head in heads]),
        'raw_head_y_range_px': spread([head[1] if head else None for head in heads]),
        'cropped_sample_count': sum(row['touches_edge'] for row in rows),
        'frames': rows,
        'contact_sheet': str(contact_path),
    }
    report_path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
