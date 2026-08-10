/* Face and hat for the mannequin, built in code — the GLB has no features.
 *
 * Every measurement below is in MODEL BIND SPACE, taken off the actual skeleton
 * rather than guessed:
 *
 *   head bone      (0, 1.596, -0.010)      head box   0.176 w x 0.267 h x 0.248 d
 *   head centre    (0, 1.673,  0.004)      front face z = 0.128
 *   eye bones      (+/-0.031, 1.661, 0.083)
 *
 * Bind space, NOT the head bone's own space. A Mixamo bone's local axes are
 * aligned to the bone itself — y runs up the neck, not up the world — so
 * offsets authored in bone space land somewhere arbitrary. The scene parents
 * all of this under a wrapper carrying the head's inverse bind matrix, which
 * cancels that rotation out and lets these numbers be used exactly as measured
 * while still riding the animation.
 */
import {
  CircleGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from 'three'

const HEAD_CENTRE = [0, 1.673, 0.004] // bind space
const EYE_OFFSET = [0.034, -0.014, 0.106] // eye, relative to the head centre
// Deliberately larger than anatomy would suggest. The figure is scaled to about
// half size for most of the page, which leaves the head only ~60px tall on a
// laptop — at true-to-life proportions the eyes land under 3px and the gaze,
// which is the whole point of the face, simply does not read.
const EYE_RADIUS = 0.034
const EYE_SQUASH = 0.68 // wider than tall reads as an eye, not a dot
const BLINK_SQUASH = 0.06

// How far the eyes can swing across the face before it looks possessed. The
// pivot sits at the head's centre, so the eyes travel around the skull rather
// than sliding on it — past about a fifth of a radian they reach the silhouette
// edge and turn side-on to the camera, which reads as a glitch, not a glance.
export const EYE_YAW_LIMIT = 0.2
export const EYE_PITCH_LIMIT = 0.13

/* Solid ink eyes on a paper-white head. No sclera on purpose: an unlit black
 * lens against the blank head is the strongest reading at the size the figure
 * actually appears, and it sidesteps the uncanny valley that a realistic eye
 * would fall straight into on a featureless mannequin. */
export function createEyeRig() {
  const pivot = new Group()
  pivot.position.set(...HEAD_CENTRE)

  // Unlit, so the eyes stay true black through every zone and lighting change
  // instead of picking up the toon bands the way the body does.
  const material = new MeshBasicMaterial({ color: '#0e0e0c' })
  const geometry = new SphereGeometry(EYE_RADIUS, 20, 14)

  const [ex, ey, ez] = EYE_OFFSET
  const eyes = [1, -1].map((side) => {
    const eye = new Mesh(geometry, material)
    eye.position.set(ex * side, ey, ez)
    eye.scale.set(1, EYE_SQUASH, 0.42)
    eye.frustumCulled = false
    pivot.add(eye)
    return eye
  })

  return {
    pivot,
    /** yaw/pitch in radians, already clamped by the caller. */
    aim(yaw, pitch) {
      pivot.rotation.y = yaw
      pivot.rotation.x = pitch
    },
    /** 0 = open, 1 = shut. */
    blink(amount) {
      const squash = EYE_SQUASH * (1 - amount) + BLINK_SQUASH * amount
      eyes.forEach((eye) => eye.scale.setY(squash))
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}

/* The navy cap — the one piece of colour on the whole page, which is why it is
 * built as a separate object rather than painted into the body shader: it has
 * to survive the desaturation the rest of the figure goes through, and it has
 * to be removable in one flag if the site ever needs a straighter read. */
export function createCap(outlineMaterial) {
  const group = new Group()
  group.position.set(0, 1.729, 0.01) // bind space

  const felt = new MeshBasicMaterial({ color: '#1c2b4a' })

  // Crown: the top of a sphere. It has to sit OUTSIDE the skull on every axis
  // or the head pokes through and the cap reads as a headband with a hole in
  // it — the head box is 0.176 wide by 0.248 deep and tops out at y = 1.806.
  const crown = new Mesh(new SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.66), felt)
  crown.scale.set(1.08, 1.02, 1.16)
  crown.frustumCulled = false
  group.add(crown)

  // Brim: a half disc thrown forward over the eyes. Double-sided because the
  // camera looks UP at the head from below the figure for most of the page, and
  // a single-sided brim would vanish the moment the head tips down.
  const brim = new Mesh(
    new CircleGeometry(0.118, 24, Math.PI, Math.PI),
    new MeshBasicMaterial({ color: '#16233c', side: DoubleSide }),
  )
  // Barely tilted. The camera sits below the figure for the whole page and
  // looks UP at the head, so any real-world downward tilt drags the brim across
  // the eyes and hides the one thing the face is here to do.
  brim.rotation.x = -Math.PI / 2 + 0.05
  brim.position.set(0, -0.012, 0.052)
  brim.scale.set(1.05, 1.15, 1)
  brim.frustumCulled = false
  group.add(brim)

  if (outlineMaterial) {
    ;[crown, brim].forEach((part) => {
      const hull = new Mesh(part.geometry, outlineMaterial)
      hull.position.copy(part.position)
      hull.rotation.copy(part.rotation)
      hull.scale.copy(part.scale)
      hull.frustumCulled = false
      group.add(hull)
    })
  }

  return {
    group,
    dispose() {
      crown.geometry.dispose()
      brim.geometry.dispose()
      felt.dispose()
      brim.material.dispose()
    },
  }
}
