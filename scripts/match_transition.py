"""Match loop poses to the closest entry frame in a one-shot transition.

Usage:
    python3 scripts/match_transition.py LOOP LOOP_FRAMES LOOP_WIDTH \
        TRANSITION TRANSITION_FRAMES TRANSITION_WIDTH SEARCH_END

The printed array maps every loop frame to one of the early transition frames.
Using it avoids snapping every stop to transition frame zero regardless of the
character's current foot phase.
"""
import sys

import numpy as np
from PIL import Image


def cells(path, count, width):
    sheet = Image.open(path).convert('RGBA')
    return [np.asarray(sheet.crop((index * width, 0, (index + 1) * width, sheet.height)))
            for index in range(count)]


def plate(frame, canvas_width):
    height, width = frame.shape[:2]
    canvas = np.zeros((height, canvas_width, 4), dtype=np.float32)
    left = (canvas_width - width) // 2
    canvas[:, left:left + width] = frame / 255
    return canvas


def difference(left, right):
    # Silhouette continuity matters most at a cut. Colour/line similarity then
    # breaks ties between poses with comparable outer shapes.
    alpha_left, alpha_right = left[..., 3], right[..., 3]
    silhouette = np.abs(alpha_left - alpha_right).mean()
    shared = np.minimum(alpha_left, alpha_right)
    colour = (np.abs(left[..., :3] - right[..., :3]) * shared[..., None]).mean()
    return float(silhouette * 2.5 + colour)


def main():
    loop_path, loop_count, loop_width = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    turn_path, turn_count, turn_width = sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
    search_end = min(int(sys.argv[7]), turn_count)
    width = max(loop_width, turn_width) + 40
    loop = [plate(frame, width) for frame in cells(loop_path, loop_count, loop_width)]
    turn = [plate(frame, width) for frame in cells(turn_path, turn_count, turn_width)[:search_end]]

    mapping = []
    scores = []
    for source in loop:
        candidates = [difference(source, target) for target in turn]
        best = int(np.argmin(candidates))
        mapping.append(best)
        scores.append(round(candidates[best], 4))
    print('mapping =', mapping)
    print('scores  =', scores)


if __name__ == '__main__':
    main()
