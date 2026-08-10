"""Generated clip -> stabilised, one-shot transition sprite sheet.

Usage:
    python3 scripts/make_transition_sprite.py CLIP NAME EVERY [START] [END] [ANCHOR]

START and END are indices after frame sampling (END is exclusive). Unlike
make_sprite.py this does not search for a loop seam: a transition has a defined
first pose, an action, and a defined last pose and must play exactly once.
"""
import json
import sys

from make_sprite import build_sheet, load_frames, source_fps, stabilise


def main():
    if len(sys.argv) < 4:
        raise SystemExit(
            'Usage: python3 scripts/make_transition_sprite.py '
            'CLIP NAME EVERY [START] [END]'
        )

    clip, name, every = sys.argv[1], sys.argv[2], int(sys.argv[3])
    start = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    end = int(sys.argv[5]) if len(sys.argv) > 5 else None
    anchor = sys.argv[6] if len(sys.argv) > 6 else 'head'

    print(f'{name}: reading {clip}')
    frames, _ = stabilise(load_frames(clip, every), anchor_mode=anchor)
    frames = frames[start:end]
    if len(frames) < 2:
        raise SystemExit('A transition requires at least two usable frames.')

    meta = build_sheet(frames, name, [])
    meta['fps'] = round(source_fps(clip) / every, 3)
    meta['source_range'] = [start, end]
    meta['anchor'] = anchor
    meta['loop'] = False
    print(json.dumps({name: meta}, indent=2))


if __name__ == '__main__':
    main()
