/* Where the character is looking, and how the rest of him catches up.
 *
 * The thing that sells a gaze is not the tracking, it is the LAG. A real person
 * moves their eyes first, brings the head round after, and lets the chest drift
 * last — so the same target angle is fed to three followers with different
 * shares and different time constants. Turning the whole head as one rigid unit
 * (which is what a naive implementation does) reads as a security camera.
 *
 * Pure math and state: no three.js, no DOM. The scene measures the angle to the
 * cursor and applies whatever comes back, the same split as characterMotion.js.
 */

// Time constants, in seconds, for an exponential follow.
const EYE_TAU = 0.06
const HEAD_TAU = 0.26
const CHEST_TAU = 0.72

// How much of the eye angle each joint below it inherits.
const HEAD_SHARE = 0.42
const CHEST_SHARE = 0.13

const HEAD_YAW_LIMIT = 0.34
const HEAD_PITCH_LIMIT = 0.2
// The chest carries the arms with it, so this stays small — past a tenth of a
// radian the whole upper body swings and it stops reading as a lean.
const CHEST_YAW_LIMIT = 0.07

const BLINK_GAP = [2.4, 6.4] // a real blink lands every few seconds
const BLINK_TIME = 0.15
const DOUBLE_BLINK_CHANCE = 0.22

const WANDER_GAP = [1.4, 3.6]
const WANDER_YAW = 0.42
const WANDER_PITCH = 0.14

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value))
const follow = (current, target, tau, delta) =>
  current + (target - current) * (1 - Math.exp(-delta / tau))
const between = ([low, high], random) => low + random * (high - low)

export function createGazeState() {
  return {
    eyeYaw: 0,
    eyePitch: 0,
    headYaw: 0,
    headPitch: 0,
    chestYaw: 0,
    blink: 0,
    blinkAt: 1.5,
    blinkUntil: 0,
    blinkQueued: false,
    wanderAt: 0,
    wanderYaw: 0,
    wanderPitch: 0,
  }
}

/* `yaw`/`pitch` are the raw angles from the head to whatever it should look at.
 * `attentive` is false when there is nothing to track — pointer off the page,
 * or the figure is busy walking — and the eyes go wandering instead. */
export function updateGaze(state, { delta, elapsed, yaw, pitch, attentive, reducedMotion }) {
  if (reducedMotion) {
    state.eyeYaw = 0
    state.eyePitch = 0
    state.headYaw = 0
    state.headPitch = 0
    state.chestYaw = 0
    state.blink = 0
    return state
  }

  // --- what to look at -------------------------------------------------
  let targetYaw = yaw
  let targetPitch = pitch

  if (!attentive) {
    // Nobody to look at: pick somewhere new every second or two. Holding a dead
    // stare at the last known cursor position is what makes idle avatars creepy.
    if (elapsed >= state.wanderAt) {
      state.wanderAt = elapsed + between(WANDER_GAP, Math.random())
      state.wanderYaw = (Math.random() * 2 - 1) * WANDER_YAW
      state.wanderPitch = (Math.random() * 2 - 1) * WANDER_PITCH
    }
    targetYaw = state.wanderYaw
    targetPitch = state.wanderPitch
  } else {
    state.wanderAt = 0
  }

  // --- the chain -------------------------------------------------------
  state.eyeYaw = follow(state.eyeYaw, targetYaw, EYE_TAU, delta)
  state.eyePitch = follow(state.eyePitch, targetPitch, EYE_TAU, delta)

  state.headYaw = follow(state.headYaw, state.eyeYaw * HEAD_SHARE, HEAD_TAU, delta)
  state.headPitch = follow(state.headPitch, state.eyePitch * HEAD_SHARE, HEAD_TAU, delta)
  state.chestYaw = follow(state.chestYaw, state.headYaw * CHEST_SHARE, CHEST_TAU, delta)

  // --- blinking --------------------------------------------------------
  if (elapsed >= state.blinkAt && state.blinkUntil === 0) {
    state.blinkUntil = elapsed + BLINK_TIME
    state.blinkQueued = Math.random() < DOUBLE_BLINK_CHANCE
  }

  if (state.blinkUntil > 0) {
    const left = state.blinkUntil - elapsed
    if (left <= 0) {
      state.blink = 0
      if (state.blinkQueued) {
        state.blinkQueued = false
        state.blinkUntil = elapsed + BLINK_TIME
      } else {
        state.blinkUntil = 0
        state.blinkAt = elapsed + between(BLINK_GAP, Math.random())
      }
    } else {
      // Shut fast, open a touch slower, which is how an eyelid actually moves.
      const progress = 1 - left / BLINK_TIME
      state.blink = progress < 0.4 ? progress / 0.4 : 1 - (progress - 0.4) / 0.6
    }
  }

  return state
}

/* Split the settled angles into what each part of the body should be given. */
export function readGaze(state) {
  return {
    eyeYaw: state.eyeYaw,
    eyePitch: state.eyePitch,
    headYaw: clamp(state.headYaw, HEAD_YAW_LIMIT),
    headPitch: clamp(state.headPitch, HEAD_PITCH_LIMIT),
    chestYaw: clamp(state.chestYaw, CHEST_YAW_LIMIT),
    blink: state.blink,
  }
}

export { clamp as clampAngle }
