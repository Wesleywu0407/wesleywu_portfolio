import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import {
  BackSide,
  Color,
  Euler,
  Group,
  LoopOnce,
  LoopRepeat,
  MeshBasicMaterial,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from 'three'
import {
  ZONE,
  clamp01,
  getNarrowHeroStation,
  getStation,
  getThresholds,
  getTravelAction,
  getTravelDuration,
  getTravelPose,
  getZone,
  smoothstep,
} from './characterMotion.js'
import { createSuitMaterial, createToonRamp } from './characterSuit.js'
import {
  EYE_PITCH_LIMIT,
  EYE_YAW_LIMIT,
  createCap,
  createEyeRig,
} from './characterFace.js'
import { clampAngle, createGazeState, readGaze, updateGaze } from './characterGaze.js'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Xbot.glb'

const ACTION_SPEED = {
  idle: 0.72,
  walk: 0.82,
  run: 0.88,
  agree: 0.8,
  headShake: 0.78,
}

// Inverted hull: a back-faced copy of the body pushed out along the raw vertex
// normal. The push happens on `normal` (object space, before <skinning_vertex>)
// so the offset is skinned with the pose instead of on top of it.
function createOutlineMaterial(thickness) {
  const material = new MeshBasicMaterial({ color: new Color('#0e0e0c'), side: BackSide })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.outlineThickness = { value: thickness }
    shader.vertexShader = `uniform float outlineThickness;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n\ttransformed += normal * outlineThickness;',
    )
  }
  return material
}

const scratch = {
  ray: new Vector3(),
  head: new Vector3(),
  target: new Vector3(),
  euler: new Euler(),
  offset: new Quaternion(),
}

const TWO_PI = Math.PI * 2

/* Shortest signed angle, so a body turned to face left doesn't make the head
 * take the long way round. */
function wrapAngle(angle) {
  const wrapped = (angle + Math.PI) % TWO_PI
  return (wrapped < 0 ? wrapped + TWO_PI : wrapped) - Math.PI
}

/* Lay a rotation on top of whatever the animation put on a bone.
 *
 * Which correction is right depends on something we cannot know up front: the
 * mixer overwrites a bone's quaternion only while some clip animates it. If it
 * did, the pose is already fresh and ours must simply be composed onto it; if it
 * did not, last frame's offset is still sitting there and would compound every
 * frame into a spin. Comparing against the exact value we left behind tells the
 * two cases apart — nothing else writes these bones, so an untouched bone is
 * bit-identical to what we stored.
 */
function addBoneOffset(bone, store, x, y) {
  if (!store.clean) {
    store.clean = new Quaternion()
    store.left = new Quaternion()
    store.primed = false
  }

  if (store.primed && bone.quaternion.equals(store.left)) {
    bone.quaternion.copy(store.clean) // untouched by the mixer: undo ourselves
  }
  store.clean.copy(bone.quaternion)

  scratch.euler.set(x, y, 0, 'XYZ')
  bone.quaternion.multiply(scratch.offset.setFromEuler(scratch.euler))

  store.left.copy(bone.quaternion)
  store.primed = true
}

function CameraRig() {
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    const z = aspect < 0.7 ? 5.4 : aspect < 1 ? 4.4 : 3.4
    camera.position.set(0, 1.05, z)
    camera.lookAt(0, 0.92, 0)
    camera.updateProjectionMatrix()
  }, [camera, size])

  return null
}

function useCharacterStory(layerRef) {
  const story = useRef({
    scrollY: 0,
    viewportHeight: 1,
    viewportWidth: 1,
    sections: {},
    reducedMotion: false,
    pointerInside: false,
    pointerAt: 0,
    zone: null,
    transitionId: 0,
    transitionFrom: null,
    transitionTo: null,
  })

  useEffect(() => {
    let frame = 0
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    const readBox = (selector) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const rect = element.getBoundingClientRect()
      const top = rect.top + window.scrollY
      return { top, bottom: top + rect.height, height: rect.height }
    }

    const measure = () => {
      const current = story.current
      current.viewportHeight = window.innerHeight
      current.viewportWidth = window.innerWidth
      current.reducedMotion = media.matches
      current.sections = {
        hero: readBox('#top'),
        work: readBox('#work'),
        about: readBox('#about'),
        journey: readBox('#journey'),
        contact: readBox('#contact'),
      }
    }

    const update = () => {
      frame = 0
      const current = story.current
      const y = window.scrollY
      current.scrollY = y
      current.viewportHeight = window.innerHeight
      current.viewportWidth = window.innerWidth

      const thresholds = getThresholds(current.sections, window.innerHeight)
      const nextZone = getZone(y, thresholds)

      if (current.zone === null) {
        current.zone = nextZone
      } else if (nextZone !== current.zone) {
        current.transitionFrom = current.zone
        current.transitionTo = nextZone
        current.zone = nextZone
        current.transitionId += 1
      }

      if (layerRef.current) {
        layerRef.current.style.zIndex = y > thresholds.work * 0.72 ? '2' : '1'
      }
    }

    const queueUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const onMotionPreference = () => {
      story.current.reducedMotion = media.matches
    }

    // The character only tracks a pointer that is actually present and moving.
    // R3F leaves `state.pointer` frozen at its last value when the mouse leaves
    // the window, and a figure locked onto a cursor that is no longer there is
    // the exact thing that makes an avatar feel dead rather than attentive.
    const onPointerMove = () => {
      story.current.pointerAt = performance.now()
      story.current.pointerInside = true
    }
    const onPointerLeave = () => {
      story.current.pointerInside = false
    }

    measure()
    update()
    document.fonts?.ready.then(() => {
      measure()
      update()
    })

    const resizeObserver = new ResizeObserver(() => {
      measure()
      update()
    })
    resizeObserver.observe(document.body)
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', measure)
    media.addEventListener('change', onMotionPreference)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', measure)
      media.removeEventListener('change', onMotionPreference)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
    }
  }, [layerRef])

  return story
}

function Human({ story }) {
  const group = useRef()
  const body = useRef()
  const head = useRef()
  const chest = useRef()
  const face = useRef(null)
  const initialized = useRef(false)
  const materialStage = useRef(0)
  const travel = useRef({ id: 0, active: false })
  const gaze = useRef(createGazeState())
  // One offset store per bone we lay a rotation onto — see addBoneOffset.
  const applied = useRef({ head: {}, chest: {} })
  const actionState = useRef({
    name: null,
    gestureEnd: 0,
    nextGestureAt: Infinity,
    gestureIndex: 0,
  })

  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)

  // Paper sections: light figure, ink line. Inverted sections: the panel flips
  // and the line carries the drawing instead of the fill.
  const skinDay = useMemo(() => new Color('#f2f1ec'), [])
  const skinNight = useMemo(() => new Color('#d8d7d0'), [])
  const clothDay = useMemo(() => new Color('#3a3a40'), [])
  const clothNight = useMemo(() => new Color('#26262b'), [])
  const lineDay = useMemo(() => new Color('#0e0e0c'), [])
  const lineNight = useMemo(() => new Color('#f2f1ec'), [])

  const ramp = useMemo(createToonRamp, [])
  const suit = useMemo(() => createSuitMaterial(ramp), [ramp])
  const cel = suit.material
  const outline = useMemo(() => createOutlineMaterial(0.014), [])

  useEffect(() => {
    const names = ['idle', 'walk', 'run', 'agree', 'headShake']
    const clips = names.map((name) => actions[name]).filter(Boolean)

    clips.forEach((clip) => clip.stop())
    names.forEach((name) => {
      if (actions[name]) actions[name].timeScale = ACTION_SPEED[name]
    })

    const idle = actions.idle
    if (idle) {
      idle.reset().setLoop(LoopRepeat, Infinity).setEffectiveWeight(1).play()
      actionState.current.name = 'idle'
      actionState.current.nextGestureAt = 6
    }

    const hulls = []
    scene.traverse((object) => {
      if (!object.isMesh || object.userData.isOutlineHull) return
      object.frustumCulled = false
      object.material = cel
      if (!object.isSkinnedMesh) return

      const hull = new SkinnedMesh(object.geometry, outline)
      hull.bind(object.skeleton, object.bindMatrix)
      hull.userData.isOutlineHull = true
      hull.frustumCulled = false
      hull.renderOrder = -1
      hulls.push([object, hull])
    })
    // Added after the traversal so the new meshes are never walked themselves.
    hulls.forEach(([object, hull]) => object.add(hull))

    // Bones in this GLB are named without the colon Mixamo normally uses
    // (`mixamorigHead`, not `mixamorig:Head`) — the colonised lookup this used
    // to do silently returned undefined, which is why head tracking never
    // actually moved anything.
    head.current = scene.getObjectByName('mixamorigHead')
    chest.current = scene.getObjectByName('mixamorigSpine2')

    // A Mixamo bone's local frame is aligned to the bone, not to the model, so
    // anything parented straight onto it inherits that rotation. Hanging a
    // wrapper that carries the head's INVERSE bind matrix cancels it exactly:
    // inside the wrapper, coordinates are plain model-space bind coordinates —
    // the ones the face and cap were measured in — and the whole thing still
    // rides the head through every animation.
    const skinned = scene.getObjectByProperty('isSkinnedMesh', true)
    const boneIndex = skinned ? skinned.skeleton.bones.indexOf(head.current) : -1

    const eyes = createEyeRig()
    const cap = createCap(outline)
    let wrapper = null

    if (head.current && boneIndex >= 0) {
      wrapper = new Group()
      wrapper.matrixAutoUpdate = false
      wrapper.matrix.copy(skinned.skeleton.boneInverses[boneIndex])
      wrapper.add(eyes.pivot)
      wrapper.add(cap.group)
      head.current.add(wrapper)
    }
    face.current = { eyes, cap }

    return () => {
      if (head.current && wrapper) head.current.remove(wrapper)
      eyes.dispose()
      cap.dispose()
      face.current = null
      head.current = null
      chest.current = null
      hulls.forEach(([object, hull]) => object.remove(hull))
      clips.forEach((clip) => clip.stop())
    }
  }, [actions, scene, cel, outline])

  useEffect(
    () => () => {
      cel.dispose()
      outline.dispose()
      ramp.dispose()
    },
    [cel, outline, ramp],
  )

  /* Aim the eyes at the actual cursor, not at a fraction of the pointer's
   * screen coordinate. The figure spends most of the page parked off to one
   * side and scaled down, so a straight pointer-to-angle mapping has it staring
   * into the middle distance. Projecting the cursor onto the plane the head
   * stands on and measuring the real angle is what makes it read as eye
   * contact from anywhere on the page. */
  const applyGaze = (state, delta, elapsed, current) => {
    const rig = face.current
    if (!rig || !head.current || !body.current) return

    const camera = state.camera
    let yaw = 0
    let pitch = 0

    const headPos = head.current.getWorldPosition(scratch.head)
    scratch.ray.set(state.pointer.x, state.pointer.y, 0.5).unproject(camera).sub(camera.position)

    if (Math.abs(scratch.ray.z) > 1e-4) {
      const distance = (headPos.z - camera.position.z) / scratch.ray.z
      scratch.target.copy(camera.position).addScaledVector(scratch.ray, distance)

      const dx = scratch.target.x - headPos.x
      const dy = scratch.target.y - headPos.y
      const dz = scratch.target.z - headPos.z
      // Measured against the way the body is currently turned, so the gaze
      // stays on the cursor while he pivots between sections.
      yaw = wrapAngle(Math.atan2(dx, dz) - body.current.rotation.y)
      pitch = -Math.atan2(dy, Math.hypot(dx, dz))
    }

    const idle = performance.now() - (current.pointerAt || 0) > 4000
    const attentive =
      current.pointerInside && !idle && !travel.current.active && !current.reducedMotion

    updateGaze(gaze.current, {
      delta,
      elapsed,
      yaw: clampAngle(yaw, EYE_YAW_LIMIT),
      pitch: clampAngle(pitch, EYE_PITCH_LIMIT),
      attentive,
      reducedMotion: current.reducedMotion,
    })

    const look = readGaze(gaze.current)
    rig.eyes.aim(clampAngle(look.eyeYaw, EYE_YAW_LIMIT), clampAngle(look.eyePitch, EYE_PITCH_LIMIT))
    rig.eyes.blink(look.blink)

    addBoneOffset(head.current, applied.current.head, look.headPitch, look.headYaw)
    if (chest.current) {
      addBoneOffset(chest.current, applied.current.chest, 0, look.chestYaw)
    }
  }

  const switchAction = (name, fade = 0.3, once = false) => {
    const next = actions[name]
    const previousName = actionState.current.name
    if (!next || previousName === name) return

    const previous = actions[previousName]
    next.enabled = true
    next.reset()
    next.setEffectiveWeight(1)
    next.setEffectiveTimeScale(ACTION_SPEED[name] ?? 1)
    next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity)
    next.clampWhenFinished = once
    next.play()
    if (previous) previous.crossFadeTo(next, fade, true)
    actionState.current.name = name
  }

  useFrame((state, delta) => {
    if (!group.current || !body.current) return

    const current = story.current
    const elapsed = state.clock.elapsedTime
    const viewportHeight = current.viewportHeight || state.size.height
    const viewportWidth = current.viewportWidth || state.size.width
    const narrow = viewportWidth < 900
    const compact = viewportWidth < 1024
    const aspect = viewportWidth / Math.max(1, viewportHeight)
    const rail = Math.min(1.38, Math.max(0.92, aspect * 0.78))
    const thresholds = getThresholds(current.sections, viewportHeight)
    const zone = current.zone ?? getZone(current.scrollY, thresholds)
    const contactHeight = current.sections.contact?.height ?? viewportHeight
    const contactProgress = clamp01(
      (current.scrollY - thresholds.contact) / Math.max(1, contactHeight + viewportHeight * 0.15),
    )
    const contactExit = smoothstep(0.8, 0.98, contactProgress)

    const station = getStation(zone, {
      rail,
      contactExit,
      compact,
    })

    if (narrow) {
      const heroEnd = current.sections.hero?.bottom ?? viewportHeight
      const progress = clamp01(current.scrollY / Math.max(1, heroEnd * 0.72))
      // Clears out early so it is already gone by the time the facts below the
      // hero stage scroll into view.
      const exit = smoothstep(0.25, 0.6, progress)
      const mobileStation = getNarrowHeroStation()
      mobileStation.y += progress * 0.12
      mobileStation.scale *= (1 - progress * 0.12) * (1 - exit)

      group.current.position.set(mobileStation.x, mobileStation.y, 0)
      group.current.scale.setScalar(mobileStation.scale)
      body.current.rotation.set(0, mobileStation.rotationY + progress * 0.45, 0)
      travel.current.id = current.transitionId
      travel.current.active = false
      switchAction(progress > 0.08 && !current.reducedMotion ? 'walk' : 'idle', 0.35)
      group.current.visible = mobileStation.scale > 0.012
      return
    }

    if (!initialized.current) {
      group.current.position.set(station.x, station.y, 0)
      group.current.scale.setScalar(station.scale)
      body.current.rotation.set(0, station.rotationY, 0)
      travel.current.id = current.transitionId
      actionState.current.nextGestureAt = elapsed + 5.5
      initialized.current = true
    }

    if (current.transitionId !== travel.current.id) {
      const wasMoving = travel.current.active
      const fromZone = current.transitionFrom ?? zone
      const toZone = current.transitionTo ?? zone
      const duration = current.reducedMotion ? 0 : getTravelDuration(fromZone, toZone)

      travel.current = {
        id: current.transitionId,
        active: duration > 0,
        continuing: wasMoving,
        fromZone,
        toZone,
        start: elapsed,
        duration,
        from: {
          x: group.current.position.x,
          y: group.current.position.y,
          scale: group.current.scale.x,
          rotationY: body.current.rotation.y,
        },
        to: { ...station },
      }

      actionState.current.gestureEnd = 0
      actionState.current.nextGestureAt = Infinity

      if (duration === 0) {
        group.current.position.set(station.x, station.y, 0)
        group.current.scale.setScalar(station.scale)
        body.current.rotation.set(0, station.rotationY, 0)
        switchAction('idle', 0.2)
      } else {
        switchAction(wasMoving ? 'run' : 'walk', wasMoving ? 0.22 : 0.5)
      }
    }

    if (travel.current.active) {
      const progress = clamp01((elapsed - travel.current.start) / travel.current.duration)
      const pose = getTravelPose({
        from: travel.current.from,
        to: travel.current.to,
        fromZone: travel.current.fromZone,
        toZone: travel.current.toZone,
        progress,
        rail,
      })

      group.current.position.set(pose.x, pose.y, 0)
      group.current.scale.setScalar(pose.scale)
      body.current.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ)

      const action = getTravelAction(progress, travel.current.continuing)
      const fade = action === 'run' ? 0.48 : action === 'walk' ? 0.42 : 0.52
      switchAction(action, fade)

      if (progress >= 1) {
        travel.current.active = false
        group.current.position.set(station.x, station.y, 0)
        group.current.scale.setScalar(station.scale)
        body.current.rotation.set(0, station.rotationY, 0)
        switchAction('idle', 0.55)
        actionState.current.nextGestureAt = elapsed + 5.5 + zone * 0.35
      }
    } else {
      const follow = 1 - Math.exp(-delta * 3.6)
      group.current.position.x += (station.x - group.current.position.x) * follow
      group.current.position.y += (station.y - group.current.position.y) * follow
      group.current.scale.x += (station.scale - group.current.scale.x) * follow
      group.current.scale.y += (station.scale - group.current.scale.y) * follow
      group.current.scale.z += (station.scale - group.current.scale.z) * follow
      body.current.rotation.x += (0 - body.current.rotation.x) * follow
      body.current.rotation.y += (station.rotationY - body.current.rotation.y) * follow
      body.current.rotation.z += (0 - body.current.rotation.z) * follow

      const performance = actionState.current
      const isGesture = performance.name === 'agree' || performance.name === 'headShake'

      if (current.reducedMotion) {
        switchAction('idle', 0.2)
      } else if (isGesture && elapsed >= performance.gestureEnd) {
        switchAction('idle', 0.38)
        performance.gestureEnd = 0
        performance.nextGestureAt = elapsed + 6.5
      } else if (!isGesture && elapsed >= performance.nextGestureAt) {
        const gestureName = performance.gestureIndex % 2 === 0 ? 'agree' : 'headShake'
        const gesture = actions[gestureName]
        const duration = gesture?.getClip().duration / ACTION_SPEED[gestureName]
        if (gesture && duration) {
          switchAction(gestureName, 0.4, true)
          performance.gestureEnd = elapsed + Math.max(0.8, duration - 0.28)
          performance.nextGestureAt = Infinity
          performance.gestureIndex += 1
        }
      }
    }

    applyGaze(state, delta, elapsed, current)

    const darkTarget = zone === ZONE.ABOUT || zone === ZONE.CONTACT ? 1 : 0
    materialStage.current += (darkTarget - materialStage.current) * (1 - Math.exp(-delta * 3.2))
    suit.uniforms.uSkin.value.copy(skinDay).lerp(skinNight, materialStage.current)
    suit.uniforms.uShirt.value.copy(skinDay).lerp(skinNight, materialStage.current)
    suit.uniforms.uCloth.value.copy(clothDay).lerp(clothNight, materialStage.current)
    suit.uniforms.uInk.value.copy(lineDay).lerp(lineNight, materialStage.current)
    outline.color.copy(lineDay).lerp(lineNight, materialStage.current)
    group.current.visible = group.current.scale.x > 0.012
  })

  return (
    <group ref={group}>
      <group ref={body}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

// The portfolio must read perfectly without the character. If the GLB fails to
// download, or the GPU rejects the context, this swallows the error and the
// layer simply renders nothing.
class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.warn('Character scene disabled:', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function hasWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function CharacterGuide() {
  const layerRef = useRef()
  const story = useCharacterStory(layerRef)
  const [supported] = useState(hasWebGL)
  // Starts true on purpose: some embedded/restored tabs report `hidden` at load
  // even though they are on screen, and `frameloop: never` would skip the first
  // render entirely. Browsers already throttle rAF in a genuinely hidden tab, so
  // this only ever pauses on a real visibility change.
  const [active, setActive] = useState(true)

  useEffect(() => {
    const sync = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  if (!supported) return null

  return (
    <div className="character-layer" ref={layerRef} aria-hidden="true">
      <SceneBoundary>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.05, 3.4], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <CameraRig />
        {/* Toon shading ignores env maps, so the whole IBL rig is dead weight.
            One key light sets where the bands break; the fill keeps the shadow
            side on the second band instead of crushing it to black. */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[3.5, 5, 4]} intensity={2.4} />
        <Suspense fallback={null}>
          <Human story={story} />
        </Suspense>
      </Canvas>
      </SceneBoundary>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
