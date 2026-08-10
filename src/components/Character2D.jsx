import { Fragment, useEffect, useRef } from 'react'

/* The illustrated character.
 *
 * He is never parked. His position is a continuous function of scroll progress,
 * so scrolling moves him and stopping stops him — and because he is genuinely
 * travelling, he plays a walk cycle while he moves and settles into an idle when
 * he arrives. The earlier version cross-faded between five fixed poses, which
 * read as cutting between stickers rather than one continuous person.
 *
 * Seven sprite sheets do all of it: side-on walk, front-on idle, three restrained
 * front-facing life gestures, plus separately directed start and settle
 * performances. Transition and gesture sheets play once; they are never
 * ping-ponged or treated as loops.
 *
 * Walk frames advance with DISTANCE, not time, so his feet never skate — the
 * cycle is tied to how far he has actually moved across the page.
 */

const BASE = import.meta.env.BASE_URL

// Straight from make_sprite.py.
const SHEETS = {
  idle: { frames: 24, cell: [187, 560], file: 'idle' },
  idleLiving: { frames: 49, cell: [192, 560], file: 'idle-living' },
  jacketAdjust: { frames: 33, cell: [204, 560], file: 'jacket-adjust' },
  notice: { frames: 49, cell: [177, 560], file: 'notice' },
  turnOut: { frames: 49, cell: [291, 560], file: 'turn-out' },
  walk: { frames: 19, cell: [303, 560], file: 'walk' },
  turnIn: { frames: 49, cell: [294, 560], file: 'turn-in' },
}

// Eye centres as a fraction of one idle cell. Only the idle sheet faces the
// viewer, so it is the only one with pupils.
const EYES = [
  { x: 0.39266, y: 0.08837 },
  { x: 0.51595, y: 0.08837 },
]
const PUPIL_WIDTH = 0.026 // fraction of the idle cell's width
// Travel is in pupil-widths, because a percentage translate is measured against
// the element's own size. The sclera is about 2.6 pupils wide, so ~70% each way
// takes the pupil to the corner of the eye without leaving it.
const TRAVEL_X = 70
const TRAVEL_Y = 26

/* Where he stands in each section. x is a percentage of viewport width from
 * centre, height a percentage of viewport height, lift how far he stands above
 * the floor.
 *
 * The hero stop is short and lifted so he stands ON the WESLEY WU wordmark
 * instead of his legs cutting through it. The rest alternate sides so he has a
 * reason to walk across, and sit far enough out to clear the copy. */
const STOPS = [
  { section: null, x: 0, height: 52, lift: 30 },
  { section: '#work', x: 34, height: 41, lift: 4 },
  { section: '#about', x: 37, height: 39, lift: 4 },
  { section: '#journey', x: -37, height: 39, lift: 4 },
  { section: '#contact', x: 34, height: 42, lift: 4 },
]

// He should be walking while a section scrolls past and settled once it has
// arrived, so each stop is held for a stretch either side of its own position.
const SETTLE = 0.055
const OFFSTAGE_X = 54

// vw of travel per full walk cycle. Tuned so the stride reads as walking rather
// than shuffling or moonwalking.
const STRIDE = 26
const FOLLOW_TAU = 0.14
const MAX_TRAVEL_SPEED = 18 // vw/s; prevents a large wheel event reading as a dash
const MAX_HEIGHT_SPEED = 8 // vh/s
const MAX_LIFT_SPEED = 20 // vh/s
const WALK_START = 0.55 // vw per second
const WALK_STOP = 0.18
const WALK_HOLD = 160 // ms; prevents trackpad noise flickering between poses
const START_BACKLOG = 0.8 // vw; filters tiny trackpad and layout noise
const SETTLE_BACKLOG = 2.8 // begin the final planted step before the exact stop
const INTENT_HOLD = 80 // ms; movement must be deliberate before he turns
const TURN_FPS = 24 // 12fps source sampled on twos, retimed to a crisp 2s action
const TURN_OUT_TRAVEL_FRAME = 15 // anticipation stays planted before travelling
const TURN_IN_ENTRY_BY_WALK_FRAME = [
  1, 1, 2, 3, 15, 16, 18, 8, 10, 11, 1, 2, 13, 15, 16, 18, 20, 10, 1,
]
// The new idle sheet samples every fourth frame of a 24fps source clip. Playing
// it at 6fps preserves the generated performance instead of speeding it up.
const IDLE_FPS = 6
const LIVING_IDLE_FPS = 12
const JACKET_FPS = 8
const LIFE_GAP = [7000, 12000]
const JACKET_COOLDOWN = 30000
const LIVING_IDLE_CHANCE = 0.45
const JACKET_CHANCE = 0.12
const NOTICE_FPS = 12
const NOTICE_DWELL = 900
const NOTICE_RELEASE = 220
const NOTICE_COOLDOWN = 20000

// On a phone the copy owns the top half of the hero. The character belongs in
// the small stage between the actions and the wordmark, then fades away before
// the work section begins.
const NARROW_HEIGHT = 24
const NARROW_LIFT = 38

const BLINK_GAP = [2.6, 6.8]
const BLINK_TIME = 0.14

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const follow = (current, target, tau, delta) =>
  current + (target - current) * (1 - Math.exp(-delta / tau))
const followLimited = (current, target, tau, delta, maxRate) => {
  const followed = follow(current, target, tau, delta)
  const limit = maxRate * delta
  return current + Math.min(limit, Math.max(-limit, followed - current))
}

/* Turn the stops into keyframes on scroll progress using where the sections
 * ACTUALLY are. Spacing them evenly across the page instead — which is what an
 * earlier version did — has him arriving at each rail at the wrong moment,
 * because the sections are nowhere near equal in height. */
function buildPath(scrollable) {
  const keys = []
  STOPS.forEach((stop, index) => {
    let at = 0
    if (stop.section) {
      const element = document.querySelector(stop.section)
      if (!element) return
      const top = element.getBoundingClientRect().top + window.scrollY
      at = clamp01((top - window.innerHeight * 0.55) / scrollable)
    }
    keys.push({ ...stop, at: index === 0 ? 0 : at })
  })

  if (keys.length < 2) return keys

  /* Build each travel window from the gap between its own two stops. A fixed
   * +/- SETTLE around every key can overlap when two sections are close (the
   * hero and work are), and sorting those crossed keys makes the character walk
   * right, reverse to centre, then walk right again. Capping the hold to 30% of
   * the local gap makes the path monotonic while still leaving room to settle. */
  const held = [{ ...keys[0], at: 0 }]
  for (let index = 1; index < keys.length; index += 1) {
    const previous = keys[index - 1]
    const current = keys[index]
    const gap = Math.max(0.0001, current.at - previous.at)
    const hold = Math.min(SETTLE, gap * 0.3)
    const depart = previous.at + hold
    const arrive = current.at - hold
    const sameRail =
      Math.sign(previous.x) === Math.sign(current.x) &&
      Math.sign(previous.x) !== 0 &&
      Math.abs(current.x - previous.x) < 10

    held.push({ ...previous, at: depart })
    if (sameRail) {
      // Work and About both reserve the right rail. Walking only the 3vw
      // between those stops reads as a treadmill, so leave through the wing and
      // re-enter on the same side without ever crossing the copy.
      held.push({
        ...previous,
        x: Math.sign(previous.x) * OFFSTAGE_X,
        height: (previous.height + current.height) / 2,
        lift: (previous.lift + current.lift) / 2,
        at: (depart + arrive) / 2,
      })
    }
    held.push({ ...current, at: Math.max(depart, arrive) })
    held.push(current)
  }
  held.push({ ...keys[keys.length - 1], at: 1 })
  return held
}

function samplePath(path, progress) {
  let index = 0
  while (index < path.length - 2 && progress > path[index + 1].at) index += 1
  const from = path[index]
  const to = path[index + 1]
  const span = Math.max(0.0001, to.at - from.at)
  const t = clamp01((progress - from.at) / span)
  const eased = t * t * (3 - 2 * t)
  return {
    x: from.x + (to.x - from.x) * eased,
    height: from.height + (to.height - from.height) * eased,
    lift: from.lift + (to.lift - from.lift) * eased,
  }
}

export default function Character2D() {
  const layer = useRef(null)
  const figure = useRef(null)
  const wraps = useRef({})
  const sprites = useRef({})
  const pupils = useRef([])
  const lids = useRef([])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const state = {
      progress: 0,
      x: 0,
      targetX: 0,
      height: STOPS[0].height,
      lift: STOPS[0].lift,
      travelled: 0,
      scrollVelocity: 0,
      facing: 1,
      pendingFacing: 1,
      pose: 'idle',
      poseStarted: 0,
      turnStartFrame: 0,
      turnFrame: 0,
      gestureFrame: 0,
      gestureDirection: 1,
      gestureExit: false,
      nextLifeAt: 0,
      jacketReadyAt: 0,
      noticeReadyAt: 0,
      noticeDwellSince: 0,
      noticePrimeAt: 0,
      noticeArmed: true,
      walkOrigin: 0,
      walkFrame: 0,
      intentSince: 0,
      idleFrame: 0,
      walkHoldUntil: 0,
      pointerX: 0,
      pointerY: 0,
      pointerAt: 0,
      inside: false,
      gazeX: 0,
      gazeY: 0,
      gazeTargetX: 0,
      gazeTargetY: 0,
      gazeShiftAt: 0,
      blink: 0,
      blinkAt: 2,
      blinkUntil: 0,
      narrow: window.innerWidth < 900,
      reduced: media.matches,
      heroBottom: window.innerHeight,
      path: [],
    }

    const measure = () => {
      state.narrow = window.innerWidth < 900
      state.reduced = media.matches
      const hero = document.querySelector('#top')
      if (hero) {
        const heroRect = hero.getBoundingClientRect()
        state.heroBottom = heroRect.bottom + window.scrollY
      } else {
        state.heroBottom = window.innerHeight
      }
      state.path = buildPath(Math.max(1, document.body.scrollHeight - window.innerHeight))
    }

    const readProgress = () => {
      const scrollable = Math.max(1, document.body.scrollHeight - window.innerHeight)
      state.progress = clamp01(window.scrollY / scrollable)
    }

    const onPointer = (event) => {
      state.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      state.pointerY = (event.clientY / window.innerHeight) * 2 - 1
      state.pointerAt = performance.now()
      state.inside = true
    }
    const onLeave = () => {
      state.inside = false
    }

    measure()
    readProgress()
    const initial = samplePath(state.path, state.progress)
    state.x = initial.x
    state.targetX = initial.x
    state.height = initial.height
    state.lift = initial.lift

    const scheduleLife = (now) => {
      state.nextLifeAt =
        now + LIFE_GAP[0] + Math.random() * (LIFE_GAP[1] - LIFE_GAP[0])
    }

    const beginGesture = (name, now) => {
      state.pose = name
      state.poseStarted = now
      state.gestureFrame = 0
      state.gestureDirection = 1
      state.gestureExit = false
      state.gazeTargetX = 0
      state.gazeTargetY = 0
      state.intentSince = 0
      scheduleLife(now)
    }

    const finishGesture = (now) => {
      state.pose = 'idle'
      state.idleFrame = 0
      state.gestureFrame = 0
      state.gestureDirection = 1
      state.gestureExit = false
      state.intentSince = 0
      scheduleLife(now)
    }

    const lifeStartedAt = performance.now()
    scheduleLife(lifeStartedAt)
    state.jacketReadyAt = lifeStartedAt + 14000

    const beginTurnOut = (now, direction) => {
      state.pose = 'turnOut'
      state.poseStarted = now
      state.turnStartFrame = 0
      state.turnFrame = 0
      state.facing = direction || state.facing
      state.pendingFacing = state.facing
      state.intentSince = 0
    }

    const beginTurnIn = (now, walkFrame = state.walkFrame) => {
      state.pose = 'turnIn'
      state.poseStarted = now
      state.turnStartFrame =
        TURN_IN_ENTRY_BY_WALK_FRAME[walkFrame] ?? 0
      state.turnFrame = state.turnStartFrame
      state.intentSince = 0
    }

    let frame = 0
    let last = performance.now()

    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      const delta = Math.min(0.05, (now - last) / 1000)
      last = now
      const elapsed = now / 1000

      const path = samplePath(state.path, state.progress)

      // --- travel --------------------------------------------------------
      const targetStep = path.x - state.targetX
      state.targetX = path.x
      const rawScrollVelocity = delta > 0 ? targetStep / delta : 0
      state.scrollVelocity = follow(
        state.scrollVelocity,
        rawScrollVelocity,
        0.06,
        delta,
      )

      const backlog = path.x - state.x
      const desiredDirection =
        Math.abs(backlog) > 0.12
          ? Math.sign(backlog)
          : Math.sign(state.scrollVelocity) || state.facing
      const activeInput = Math.abs(state.scrollVelocity) > WALK_START
      if (activeInput) state.walkHoldUntil = now + WALK_HOLD

      const wantsToStart =
        !state.reduced &&
        (activeInput || Math.abs(backlog) > START_BACKLOG)
      const shouldKeepWalking =
        !state.reduced &&
        (Math.abs(state.scrollVelocity) > WALK_STOP ||
          Math.abs(backlog) > SETTLE_BACKLOG ||
          now < state.walkHoldUntil)
      const pointerEngaged =
        state.inside && now - state.pointerAt < 2800

      // A notice is earned by dwelling near the visible body, not by moving
      // anywhere on the page. The ellipse follows the character's real
      // viewport position and scale, so the trigger remains spatially honest
      // as he moves between sections.
      const noticeHeight =
        ((state.narrow ? NARROW_HEIGHT : state.height) / 100) * window.innerHeight
      const noticeX = (0.5 + state.x / 100) * window.innerWidth
      const noticeY =
        (1 - (state.narrow ? NARROW_LIFT : state.lift) / 100) * window.innerHeight -
        noticeHeight * 0.5
      const pointerPixelX = ((state.pointerX + 1) / 2) * window.innerWidth
      const pointerPixelY = ((state.pointerY + 1) / 2) * window.innerHeight
      const noticeDx = (pointerPixelX - noticeX) / Math.max(90, noticeHeight * 0.38)
      const noticeDy = (pointerPixelY - noticeY) / Math.max(110, noticeHeight * 0.55)
      const pointerNear =
        state.inside && noticeDx * noticeDx + noticeDy * noticeDy <= 1
      const noticeAttention = pointerNear && now - state.pointerAt < 2800

      if (!pointerNear) {
        state.noticeArmed = true
        state.noticeDwellSince = 0
        state.noticePrimeAt = 0
      } else if (!noticeAttention) {
        // A stationary pointer eventually becomes inactive, but it must still
        // physically leave the character before another notice can arm.
        state.noticeDwellSince = 0
        state.noticePrimeAt = 0
      }

      if (state.pose === 'idle') {
        if (wantsToStart) {
          state.noticeDwellSince = 0
          state.noticePrimeAt = 0
          if (state.intentSince === 0) state.intentSince = now
          state.pendingFacing = desiredDirection
          if (now - state.intentSince >= INTENT_HOLD) {
            beginTurnOut(now, state.pendingFacing)
          }
        } else {
          state.intentSince = 0
          if (
            !state.reduced &&
            !state.narrow &&
            noticeAttention &&
            state.noticeArmed &&
            now >= state.noticeReadyAt
          ) {
            if (state.noticeDwellSince === 0) state.noticeDwellSince = now
            if (now - state.noticeDwellSince >= NOTICE_DWELL) {
              if (state.noticePrimeAt === 0) {
                // Centre the live pupils before handing the eyes to the baked
                // performance, preventing a visible eye-position pop.
                state.noticePrimeAt = now
                state.gazeTargetX = 0
                state.gazeTargetY = 0
              } else if (
                now - state.noticePrimeAt >= NOTICE_RELEASE &&
                state.blink < 0.05
              ) {
                beginGesture('notice', now)
                state.noticeReadyAt = now + NOTICE_COOLDOWN
                state.noticeArmed = false
                state.noticeDwellSince = 0
                state.noticePrimeAt = 0
              }
            }
          } else if (
            !state.reduced &&
            !pointerEngaged &&
            state.blink < 0.05 &&
            now >= state.nextLifeAt
          ) {
            const choice = Math.random()
            if (choice < LIVING_IDLE_CHANCE) {
              beginGesture('idleLiving', now)
            } else if (
              choice < LIVING_IDLE_CHANCE + JACKET_CHANCE &&
              now >= state.jacketReadyAt
            ) {
              beginGesture('jacketAdjust', now)
              state.jacketReadyAt = now + JACKET_COOLDOWN
            } else {
              scheduleLife(now)
            }
          }
        }
      } else if (
        state.pose === 'idleLiving' ||
        state.pose === 'jacketAdjust' ||
        state.pose === 'notice'
      ) {
        const sheet = SHEETS[state.pose]
        const gestureFps =
          state.pose === 'jacketAdjust'
            ? JACKET_FPS
            : state.pose === 'notice'
              ? NOTICE_FPS
              : LIVING_IDLE_FPS
        if (wantsToStart && !state.gestureExit) {
          state.gestureExit = true
          state.gestureDirection =
            state.gestureFrame < (sheet.frames - 1) / 2 ? -1 : 1
        }
        state.gestureFrame +=
          delta *
          gestureFps *
          state.gestureDirection *
          (state.gestureExit ? 2 : 1)
        const reachedStart = state.gestureFrame <= 0
        const reachedEnd = state.gestureFrame >= sheet.frames - 1
        if (reachedStart || reachedEnd) finishGesture(now)
      } else if (state.pose === 'walk') {
        const reversing =
          desiredDirection !== state.facing &&
          Math.abs(backlog) > START_BACKLOG
        if (reversing) {
          state.pendingFacing = desiredDirection
          beginTurnIn(now)
        } else if (!shouldKeepWalking) {
          beginTurnIn(now)
        }
      }

      if (state.pose === 'turnOut') {
        state.turnFrame = Math.floor(
          ((now - state.poseStarted) / 1000) * TURN_FPS,
        )
        if (state.turnFrame >= SHEETS.turnOut.frames) {
          if (shouldKeepWalking && desiredDirection === state.facing) {
            state.pose = 'walk'
            state.walkOrigin = state.travelled
            state.walkFrame = 0
          } else {
            // The directed start performance ends on walk frame zero.
            beginTurnIn(now, 0)
          }
        }
      } else if (state.pose === 'turnIn') {
        state.turnFrame =
          state.turnStartFrame +
          Math.floor(((now - state.poseStarted) / 1000) * TURN_FPS)
        if (state.turnFrame >= SHEETS.turnIn.frames) {
          state.pose = 'idle'
          state.idleFrame = 0
          state.turnFrame = SHEETS.turnIn.frames - 1
          state.intentSince = 0
          scheduleLife(now)
        }
      }

      const previous = state.x
      const targetIsAhead =
        Math.abs(backlog) <= 0.12 || desiredDirection === state.facing
      const mayTravel =
        state.reduced ||
        (targetIsAhead &&
          (state.pose === 'walk' ||
            state.pose === 'turnIn' ||
            (state.pose === 'turnOut' &&
              state.turnFrame >= TURN_OUT_TRAVEL_FRAME)))
      if (mayTravel) {
        // A short follow removes wheel-step jitter without letting the figure
        // coast after the user stops. Height and floor lift follow the same
        // gate, so the character never scales or floats during anticipation.
        state.x = followLimited(
          state.x,
          path.x,
          FOLLOW_TAU,
          delta,
          MAX_TRAVEL_SPEED,
        )
        state.height = followLimited(
          state.height,
          path.height,
          FOLLOW_TAU,
          delta,
          MAX_HEIGHT_SPEED,
        )
        state.lift = followLimited(
          state.lift,
          path.lift,
          FOLLOW_TAU,
          delta,
          MAX_LIFT_SPEED,
        )
      }
      const step = state.x - previous
      state.travelled += Math.abs(step)

      // --- gaze ----------------------------------------------------------
      const attentive =
        state.inside &&
        !state.reduced &&
        now - state.pointerAt < 2800 &&
        state.pose === 'idle' &&
        state.noticePrimeAt === 0
      if (state.noticePrimeAt > 0) {
        state.gazeTargetX = 0
        state.gazeTargetY = 0
        state.gazeShiftAt = now + NOTICE_RELEASE
      } else if (now >= state.gazeShiftAt) {
        if (attentive) {
          // Eyes sample the pointer in small saccades rather than behaving like
          // a mechanically attached cursor tracker.
          state.gazeTargetX = state.pointerX * 0.78 + (Math.random() - 0.5) * 0.1
          state.gazeTargetY = state.pointerY * 0.72 + (Math.random() - 0.5) * 0.06
          state.gazeShiftAt = now + 360 + Math.random() * 620
        } else {
          const glance = state.pose === 'idle' && Math.random() < 0.32
          state.gazeTargetX = glance ? (Math.random() - 0.5) * 0.22 : 0
          state.gazeTargetY = glance ? (Math.random() - 0.5) * 0.1 : 0
          state.gazeShiftAt = now + 1100 + Math.random() * 1900
        }
      }
      state.gazeX = follow(state.gazeX, state.gazeTargetX, 0.12, delta)
      state.gazeY = follow(state.gazeY, state.gazeTargetY, 0.14, delta)

      if (!state.reduced) {
        if (elapsed >= state.blinkAt && state.blinkUntil === 0) state.blinkUntil = elapsed + BLINK_TIME
        if (state.blinkUntil > 0) {
          const left = state.blinkUntil - elapsed
          if (left <= 0) {
            state.blink = 0
            state.blinkUntil = 0
            state.blinkAt = elapsed + BLINK_GAP[0] + Math.random() * (BLINK_GAP[1] - BLINK_GAP[0])
          } else {
            const p = 1 - left / BLINK_TIME
            state.blink = p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6
          }
        }
      }

      // --- placement -----------------------------------------------------
      const exit = state.narrow
        ? clamp01(window.scrollY / Math.max(1, state.heroBottom * 0.5))
        : 0
      layer.current.style.opacity = String(1 - exit)
      layer.current.dataset.pose = state.pose
      layer.current.dataset.frame = String(
        state.pose === 'idle'
          ? Math.floor(state.idleFrame)
          : state.pose === 'walk'
            ? state.walkFrame
            : state.pose === 'idleLiving' ||
                state.pose === 'jacketAdjust' ||
                state.pose === 'notice'
              ? Math.floor(state.gestureFrame)
              : state.turnFrame,
      )
      layer.current.dataset.backlog = backlog.toFixed(2)

      const displayHeight = state.narrow ? NARROW_HEIGHT : state.height
      const displayLift = state.narrow ? NARROW_LIFT : state.lift

      figure.current.style.height = `${displayHeight}vh`
      figure.current.style.transform =
        `translate(-50%, 0) translate(${state.x}vw, ${-displayLift}vh)`

      // --- frames --------------------------------------------------------
      // A percentage background-position is measured across the overflow, not
      // in pixels: with a sheet N cells wide, frame i sits at i/(N-1) * 100%.
      // It is POSITIVE — a negative value walks off the front of the sheet and
      // shows nothing but transparency.
      const walk = SHEETS.walk
      state.walkFrame = Math.floor(
        (((state.travelled - state.walkOrigin) / STRIDE) % 1) * walk.frames,
      )
      sprites.current.walk.style.backgroundPositionX =
        `${(state.walkFrame * 100) / (walk.frames - 1)}%`

      if (!state.reduced) state.idleFrame = (state.idleFrame + delta * IDLE_FPS) % SHEETS.idle.frames
      const idleFrame = Math.floor(state.idleFrame)
      sprites.current.idle.style.backgroundPositionX =
        `${(idleFrame * 100) / (SHEETS.idle.frames - 1)}%`

      const livingIdleFrame = Math.min(
        SHEETS.idleLiving.frames - 1,
        Math.max(0, Math.floor(state.gestureFrame)),
      )
      const jacketFrame = Math.min(
        SHEETS.jacketAdjust.frames - 1,
        Math.max(0, Math.floor(state.gestureFrame)),
      )
      sprites.current.idleLiving.style.backgroundPositionX =
        `${(livingIdleFrame * 100) / (SHEETS.idleLiving.frames - 1)}%`
      sprites.current.jacketAdjust.style.backgroundPositionX =
        `${(jacketFrame * 100) / (SHEETS.jacketAdjust.frames - 1)}%`
      const noticeFrame = Math.min(
        SHEETS.notice.frames - 1,
        Math.max(0, Math.floor(state.gestureFrame)),
      )
      sprites.current.notice.style.backgroundPositionX =
        `${(noticeFrame * 100) / (SHEETS.notice.frames - 1)}%`

      const turnOutFrame = Math.min(
        SHEETS.turnOut.frames - 1,
        Math.max(0, state.turnFrame),
      )
      const turnInFrame = Math.min(
        SHEETS.turnIn.frames - 1,
        Math.max(0, state.turnFrame),
      )
      sprites.current.turnOut.style.backgroundPositionX =
        `${(turnOutFrame * 100) / (SHEETS.turnOut.frames - 1)}%`
      sprites.current.turnIn.style.backgroundPositionX =
        `${(turnInFrame * 100) / (SHEETS.turnIn.frames - 1)}%`

      Object.keys(SHEETS).forEach((name) => {
        const visible = name === state.pose
        const directional =
          name === 'turnOut' || name === 'walk' || name === 'turnIn'
        wraps.current[name].style.opacity = visible ? '1' : '0'
        wraps.current[name].style.transform = directional
          ? `translateX(-50%) scaleX(${state.facing >= 0 ? -1 : 1})`
          : 'translateX(-50%)'
      })

      pupils.current.forEach((node) => {
        if (!node) return
        node.style.transform =
          `translate(-50%, -50%) translate(${state.gazeX * TRAVEL_X}%, ${
            state.gazeY * TRAVEL_Y
          }%)`
      })
      lids.current.forEach((node) => {
        if (!node) return
        node.style.transform =
          `translate(-50%, -50%) scaleY(${state.blink})`
      })
    }

    frame = requestAnimationFrame(tick)

    const resizeObserver = new ResizeObserver(() => {
      measure()
      readProgress()
    })
    resizeObserver.observe(document.body)
    window.addEventListener('scroll', readProgress, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', readProgress)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <div className="character2d" ref={layer} aria-hidden="true">
      <div className="character2d-figure" ref={figure}>
        {Object.entries(SHEETS).map(([name, sheet]) => (
          <div
            key={name}
            className="character2d-wrap"
            ref={(node) => {
              wraps.current[name] = node
            }}
            style={{
              aspectRatio: `${sheet.cell[0]} / ${sheet.cell[1]}`,
              opacity: name === 'idle' ? 1 : 0,
            }}
          >
            <div
              className="character2d-sprite"
              ref={(node) => {
                sprites.current[name] = node
              }}
              style={{
                backgroundImage: `url(${BASE}character/${sheet.file}.png)`,
                backgroundSize: `${sheet.frames * 100}% 100%`,
              }}
            />
            {name === 'idle' &&
              EYES.map((eye, index) => (
                <Fragment key={index}>
                  <span
                    ref={(node) => {
                      pupils.current[index] = node
                    }}
                    className="character2d-pupil"
                    style={{
                      left: `${eye.x * 100}%`,
                      top: `${eye.y * 100}%`,
                      width: `${PUPIL_WIDTH * 100}%`,
                    }}
                  />
                  <span
                    ref={(node) => {
                      lids.current[index] = node
                    }}
                    className="character2d-lid"
                    style={{
                      left: `${eye.x * 100}%`,
                      top: `${eye.y * 100}%`,
                      width: `${PUPIL_WIDTH * 2.65 * 100}%`,
                    }}
                  />
                </Fragment>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
