import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useAnimations, useGLTF } from '@react-three/drei'
import { Color, LoopOnce, LoopRepeat, MeshPhysicalMaterial } from 'three'
import {
  ZONE,
  clamp01,
  getStation,
  getThresholds,
  getTravelAction,
  getTravelDuration,
  getTravelPose,
  getZone,
  mix,
  smoothstep,
} from './characterMotion.js'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Xbot.glb'

const ACTION_SPEED = {
  idle: 0.72,
  walk: 0.82,
  run: 0.88,
  agree: 0.8,
  headShake: 0.78,
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

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', measure)
      media.removeEventListener('change', onMotionPreference)
    }
  }, [layerRef])

  return story
}

function Human({ story }) {
  const group = useRef()
  const body = useRef()
  const head = useRef()
  const initialized = useRef(false)
  const materialStage = useRef(0)
  const travel = useRef({ id: 0, active: false })
  const headTracking = useRef({ yaw: 0, pitch: 0, appliedYaw: 0, appliedPitch: 0 })
  const actionState = useRef({
    name: null,
    gestureEnd: 0,
    nextGestureAt: Infinity,
    gestureIndex: 0,
  })

  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)
  const chromeDay = useMemo(() => new Color('#b9c7dc'), [])
  const chromeNight = useMemo(() => new Color('#e0ecff'), [])
  const mercury = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: chromeDay.clone(),
        metalness: 1,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 2.8,
        iridescence: 0.72,
        iridescenceIOR: 1.45,
        iridescenceThicknessRange: [120, 460],
      }),
    [chromeDay],
  )

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

    scene.traverse((object) => {
      if (!object.isMesh) return
      object.castShadow = true
      object.receiveShadow = true
      object.frustumCulled = false
      object.material = mercury
    })

    head.current = scene.getObjectByName('mixamorig:Head')

    return () => {
      head.current = null
      clips.forEach((clip) => clip.stop())
    }
  }, [actions, scene, mercury])

  useEffect(() => () => mercury.dispose(), [mercury])

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
    })

    if (narrow) {
      const heroEnd = current.sections.hero?.bottom ?? viewportHeight
      const progress = clamp01(current.scrollY / Math.max(1, heroEnd * 0.72))
      const exit = smoothstep(0.55, 0.9, progress)
      const mobileStation = getStation(ZONE.HERO, { rail })
      mobileStation.y = progress * 0.12
      mobileStation.scale = (1 - progress * 0.12) * (1 - exit)

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

    if (head.current) {
      const tracking = headTracking.current
      head.current.rotation.y -= tracking.appliedYaw
      head.current.rotation.x -= tracking.appliedPitch

      const attention = travel.current.active || current.reducedMotion ? 0 : 1
      const targetYaw = state.pointer.x * 0.34 * attention
      const targetPitch = -state.pointer.y * 0.16 * attention
      const headFollow = 1 - Math.exp(-delta * 4.2)

      tracking.yaw += (targetYaw - tracking.yaw) * headFollow
      tracking.pitch += (targetPitch - tracking.pitch) * headFollow
      tracking.appliedYaw = tracking.yaw
      tracking.appliedPitch = tracking.pitch

      head.current.rotation.y += tracking.appliedYaw
      head.current.rotation.x += tracking.appliedPitch
    }

    const darkTarget = zone === ZONE.ABOUT || zone === ZONE.CONTACT ? 1 : 0
    materialStage.current += (darkTarget - materialStage.current) * (1 - Math.exp(-delta * 3.2))
    mercury.color.copy(chromeDay).lerp(chromeNight, materialStage.current)
    mercury.envMapIntensity = mix(2.8, 3.55, materialStage.current)
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

export default function CharacterGuide() {
  const layerRef = useRef()
  const story = useCharacterStory(layerRef)

  return (
    <div className="character-layer" ref={layerRef} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.05, 3.4], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <CameraRig />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={5} color="#ffffff" scale={[8, 2, 1]} position={[0, 5, -7]} />
          <Lightformer form="rect" intensity={4} color="#58e7ff" scale={[2, 7, 1]} position={[-5, 1, 0]} rotation-y={Math.PI / 2} />
          <Lightformer form="rect" intensity={4.5} color="#a875ff" scale={[2, 7, 1]} position={[5, 1, 0]} rotation-y={-Math.PI / 2} />
          <Lightformer form="ring" intensity={3.5} color="#ff6fd8" scale={3} position={[0, 1, -5]} />
        </Environment>
        <ambientLight intensity={0.28} />
        <directionalLight position={[4, 7, 5]} intensity={3.6} color="#d9f4ff" />
        <directionalLight position={[-5, 3, 1]} intensity={3.1} color="#50e6ff" />
        <directionalLight position={[4, 2, -4]} intensity={3.5} color="#9c6cff" />
        <directionalLight position={[0, 5, -6]} intensity={2.8} color="#ff70d7" />
        <Suspense fallback={null}>
          <Human story={story} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
