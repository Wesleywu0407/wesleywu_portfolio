export const ZONE = Object.freeze({
  HERO: 0,
  WORK: 1,
  ABOUT: 2,
  JOURNEY: 3,
  CONTACT: 4,
})

const TRIGGER_LINE = 0.9

export function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

export function mix(from, to, amount) {
  return from + (to - from) * amount
}

export function smoothstep(min, max, value) {
  const x = clamp01((value - min) / Math.max(0.0001, max - min))
  return x * x * (3 - 2 * x)
}

export function getThresholds(sections, viewportHeight) {
  const fallback = sections.hero?.bottom ?? viewportHeight
  const work = (sections.work?.top ?? fallback + viewportHeight) - viewportHeight * TRIGGER_LINE
  const about = (sections.about?.top ?? work + viewportHeight) - viewportHeight * TRIGGER_LINE
  const journey = (sections.journey?.top ?? about + viewportHeight) - viewportHeight * TRIGGER_LINE
  const contact = (sections.contact?.top ?? journey + viewportHeight) - viewportHeight * TRIGGER_LINE

  return { work, about, journey, contact }
}

export function getZone(scrollY, thresholds) {
  if (scrollY < thresholds.work) return ZONE.HERO
  if (scrollY < thresholds.about) return ZONE.WORK
  if (scrollY < thresholds.journey) return ZONE.ABOUT
  if (scrollY < thresholds.contact) return ZONE.JOURNEY
  return ZONE.CONTACT
}

export function getStation(zone, { rail, contactExit = 0 }) {
  switch (zone) {
    case ZONE.WORK:
      return { x: rail, y: 0.22, scale: 0.53, rotationY: -0.66 }
    case ZONE.ABOUT:
      return { x: rail, y: 0.2, scale: 0.5, rotationY: -0.66 }
    case ZONE.JOURNEY:
      return { x: -rail, y: 0.2, scale: 0.47, rotationY: 0.66 }
    case ZONE.CONTACT:
      return {
        x: rail * 0.95,
        y: 0.16,
        scale: 0.62 * (1 - contactExit),
        rotationY: -0.66,
      }
    default:
      return { x: 0, y: 0, scale: 1, rotationY: 0 }
  }
}

export function getTravelDuration(fromZone, toZone) {
  const distance = Math.abs(toZone - fromZone)
  if (distance > 1) return 4.1
  if ([fromZone, toZone].sort().join('-') === `${ZONE.WORK}-${ZONE.ABOUT}`) return 3.7
  return 3.5
}

export function getTravelPose({ from, to, fromZone, toZone, progress, rail }) {
  const t = clamp01(progress)
  const eased = smoothstep(0, 1, t)
  const sameRightRail = [fromZone, toZone].sort().join('-') === `${ZONE.WORK}-${ZONE.ABOUT}`
  let x
  let direction

  if (sameRightRail) {
    const offstage = rail + 1.05
    if (t < 0.5) {
      x = mix(from.x, offstage, smoothstep(0, 0.5, t))
      direction = 1
    } else {
      x = mix(offstage, to.x, smoothstep(0.5, 1, t))
      direction = -1
    }
  } else {
    x = mix(from.x, to.x, eased)
    direction = Math.sign(to.x - from.x) || 1
  }

  const runFacing = direction > 0 ? -0.62 : 0.62
  const faceRun = smoothstep(0.04, 0.24, t)
  const faceArrival = smoothstep(0.7, 0.98, t)
  const rotationY = mix(mix(from.rotationY, runFacing, faceRun), to.rotationY, faceArrival)
  const arc = Math.sin(t * Math.PI)

  return {
    x,
    y: mix(from.y, to.y, eased) + arc * 0.045,
    scale: mix(from.scale, to.scale, eased),
    rotationY,
    rotationX: arc * 0.035,
    rotationZ: -direction * arc * 0.025,
  }
}

export function getTravelAction(progress, continuing = false) {
  if (progress >= 0.97) return 'idle'
  if (progress >= 0.78) return 'walk'
  if (continuing || progress >= 0.22) return 'run'
  return 'walk'
}
