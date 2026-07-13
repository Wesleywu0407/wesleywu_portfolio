import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  useGLTF,
  useAnimations,
  Environment,
  Lightformer,
} from '@react-three/drei'
import { MeshPhysicalMaterial, Color } from 'three'

// Keep the whole figure framed on any aspect ratio — pull the camera back
// on narrow / portrait screens so arms never get cropped.
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

// X Bot — humanoid character from the official three.js examples (Mixamo rig).
// Swap this URL for your own scanned avatar GLB whenever you have one.
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Xbot.glb'

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function mix(from, to, amount) {
  return from + (to - from) * amount
}

function smoothstep(min, max, value) {
  const x = clamp01((value - min) / (max - min))
  return x * x * (3 - 2 * x)
}

function motionPulse(time, start, peak, end) {
  return smoothstep(start, peak, time) * (1 - smoothstep(peak, end, time))
}

function idlePerformance(elapsed, zone = 0) {
  const cycle = (elapsed + zone * 1.85) % 12
  const agree = motionPulse(cycle, 1.4, 2.15, 3.25) * 0.7
  const headShake = motionPulse(cycle, 4.8, 5.55, 6.75) * 0.55
  const sneakPose = motionPulse(cycle, 8.05, 8.9, 10.3) * 0.45
  const gestureTotal = agree + headShake + sneakPose

  return {
    idle: Math.max(0, 1 - gestureTotal),
    walk: 0,
    run: 0,
    agree,
    headShake,
    sneak_pose: sneakPose,
  }
}

function useCharacterStory(layerRef) {
  const story = useRef({
    scrollY: 0,
    velocity: 0,
    direction: 1,
    viewportHeight: 1,
    viewportWidth: 1,
    sections: {},
    rows: [],
    activeWork: 0,
    hoveredWork: null,
    reducedMotion: false,
    zone: null,
    runStartedAt: 0,
    runUntil: 0,
    transitionDirection: 1,
    transitionFrom: null,
    transitionTo: null,
  })

  useEffect(() => {
    let frame = 0
    let lastY = window.scrollY
    let lastTime = performance.now()
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
        marquee: readBox('[data-character-zone="marquee"]'),
        work: readBox('#work'),
        about: readBox('#about'),
        journey: readBox('#journey'),
        contact: readBox('#contact'),
      }
      current.rows = Array.from(document.querySelectorAll('.work-row')).map((row) => {
        const rect = row.getBoundingClientRect()
        const top = rect.top + window.scrollY
        return { top, center: top + rect.height / 2 }
      })
    }

    const update = () => {
      frame = 0
      const now = performance.now()
      const y = window.scrollY
      const elapsed = Math.max(16, now - lastTime)
      const delta = y - lastY
      const current = story.current
      const instantVelocity = delta / elapsed

      current.velocity = current.velocity * 0.68 + instantVelocity * 0.32
      if (Math.abs(delta) > 0.5) current.direction = Math.sign(delta)
      current.scrollY = y
      current.viewportHeight = window.innerHeight
      current.viewportWidth = window.innerWidth

      if (current.rows.length) {
        const readingLine = y + window.innerHeight * 0.52
        let closest = 0
        let distance = Infinity
        current.rows.forEach((row, index) => {
          const nextDistance = Math.abs(row.center - readingLine)
          if (nextDistance < distance) {
            closest = index
            distance = nextDistance
          }
        })
        current.activeWork = current.hoveredWork ?? closest
      }

      const heroEnd = current.sections.marquee?.top || current.sections.hero?.bottom || window.innerHeight
      const workStart = (current.sections.work?.top ?? heroEnd + window.innerHeight) - window.innerHeight * 0.82
      const aboutStart = (current.sections.about?.top ?? workStart + window.innerHeight) - window.innerHeight * 0.82
      const journeyStart = (current.sections.journey?.top ?? aboutStart + window.innerHeight) - window.innerHeight * 0.82
      const contactStart = (current.sections.contact?.top ?? journeyStart + window.innerHeight) - window.innerHeight * 0.82
      const nextZone = y < workStart ? 0 : y < aboutStart ? 1 : y < journeyStart ? 2 : y < contactStart ? 3 : 4

      if (current.zone === null) {
        current.zone = nextZone
      } else if (nextZone !== current.zone) {
        current.transitionFrom = current.zone
        current.transitionTo = nextZone
        current.transitionDirection = Math.sign(nextZone - current.zone) || current.direction
        current.zone = nextZone
        current.runStartedAt = now
        current.runUntil = current.reducedMotion ? now : now + 1150
      }

      if (layerRef.current) layerRef.current.style.zIndex = y > workStart * 0.72 ? '2' : '1'

      lastY = y
      lastTime = now
    }

    const queueUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const onProjectFocus = (event) => {
      story.current.hoveredWork = event.detail
      update()
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
    window.addEventListener('character-project-focus', onProjectFocus)
    media.addEventListener('change', onMotionPreference)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', measure)
      window.removeEventListener('character-project-focus', onProjectFocus)
      media.removeEventListener('change', onMotionPreference)
    }
  }, [layerRef])

  return story
}

function Human({ story }) {
  const group = useRef()
  const body = useRef()
  const initialized = useRef(false)
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)
  const chromeDay = useMemo(() => new Color('#b9c7dc'), [])
  const chromeNight = useMemo(() => new Color('#e0ecff'), [])

  // Liquid-chrome material: a cool silver base, tight reflections and a subtle
  // blue-violet iridescent shift give the figure a polished Y2K mercury finish.
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
    // Run the clips together and blend their weights from scroll progress.
    // This keeps transitions fluid instead of snapping between canned poses.
    const clips = ['idle', 'walk', 'run', 'agree', 'headShake', 'sneak_pose']
      .map((name) => actions[name])
      .filter(Boolean)

    clips.forEach((clip, index) => {
      clip.reset().play()
      clip.enabled = true
      clip.setEffectiveWeight(index === 0 ? 1 : 0)
    })

    if (actions.idle) actions.idle.timeScale = 0.65
    if (actions.walk) actions.walk.timeScale = 0.85
    if (actions.run) actions.run.timeScale = 1
    if (actions.agree) actions.agree.timeScale = 0.72
    if (actions.headShake) actions.headShake.timeScale = 0.7
    if (actions.sneak_pose) actions.sneak_pose.timeScale = 0.55

    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        o.frustumCulled = false
        o.material = mercury
      }
    })
    return () => clips.forEach((clip) => clip.fadeOut(0.25))
  }, [actions, scene, mercury])

  useEffect(() => () => mercury.dispose(), [mercury])

  // One continuous character performance, choreographed from measured page sections.
  useFrame((state, delta) => {
    if (!group.current || !body.current) return
    const current = story.current
    current.velocity *= Math.exp(-delta * 5)

    const { sections } = current
    const viewportHeight = current.viewportHeight || state.size.height
    const viewportWidth = current.viewportWidth || state.size.width
    const y = current.scrollY
    const heroEnd = sections.marquee?.top || sections.hero?.bottom || viewportHeight
    const workStart = (sections.work?.top ?? heroEnd + viewportHeight) - viewportHeight * 0.82
    const aboutStart = (sections.about?.top ?? workStart + viewportHeight) - viewportHeight * 0.82
    const journeyStart = (sections.journey?.top ?? aboutStart + viewportHeight) - viewportHeight * 0.82
    const contactStart = (sections.contact?.top ?? journeyStart + viewportHeight) - viewportHeight * 0.82
    const narrow = viewportWidth < 900
    const aspect = viewportWidth / Math.max(1, viewportHeight)
    const rail = Math.min(1.38, Math.max(0.92, aspect * 0.78))
    const speed = Math.abs(current.velocity)
    const now = performance.now()

    let targetX = 0
    let targetY = 0
    let targetScale = 1
    let targetRotationX = 0
    let targetRotationY = state.pointer.x * 0.3
    let targetRotationZ = 0
    let darkStage = 0
    let weights = { idle: 1, walk: 0, run: 0, agree: 0, headShake: 0, sneak_pose: 0 }

    if (narrow) {
      const progress = clamp01(y / Math.max(1, heroEnd * 0.72))
      const stride = smoothstep(0.06, 0.42, progress)
      const exit = smoothstep(0.55, 0.9, progress)
      targetScale = (1 - progress * 0.12) * (1 - exit)
      targetY = progress * 0.12
      targetRotationY += progress * 0.45
      weights = {
        idle: 1 - stride,
        walk: stride,
        run: 0,
        agree: 0,
        headShake: 0,
        sneak_pose: 0,
      }
    } else if (y < workStart) {
      targetX = 0
      targetY = 0
      targetScale = 1
      weights = { idle: 1, walk: 0, run: 0, agree: 0, headShake: 0, sneak_pose: 0 }
    } else if (y < aboutStart) {
      const rowCount = Math.max(1, current.rows.length - 1)
      const rowPhase = current.activeWork / rowCount - 0.5
      const gesture = current.activeWork % 2 ? 0.2 : 0
      targetX = rail
      targetY = 0.22 + rowPhase * 0.1
      targetScale = 0.53
      targetRotationY = -0.5
      targetRotationZ = rowPhase * 0.035
      weights = {
        idle: 1 - gesture,
        walk: 0,
        run: 0,
        agree: gesture,
        headShake: 0,
        sneak_pose: 0,
      }
    } else if (y < journeyStart) {
      targetX = rail
      targetY = 0.2
      targetScale = 0.5
      targetRotationX = 0.025
      targetRotationY = -0.52
      darkStage = 1
      weights = {
        idle: 0.62,
        walk: 0,
        run: 0,
        agree: 0.38,
        headShake: 0,
        sneak_pose: 0,
      }
    } else if (y < contactStart) {
      targetX = -rail
      targetY = 0.2
      targetScale = 0.47
      targetRotationY = 0.48
      weights = {
        idle: 1,
        walk: 0,
        run: 0,
        agree: 0,
        headShake: 0,
        sneak_pose: 0,
      }
    } else {
      const contact = sections.contact
      const progress = clamp01(
        (y - contactStart) / Math.max(1, (contact?.height ?? viewportHeight) + viewportHeight * 0.15),
      )
      const exit = smoothstep(0.8, 0.98, progress)
      targetX = rail * 0.95
      targetY = 0.16
      targetScale = 0.62 * (1 - exit)
      targetRotationY = state.pointer.x * 0.16
      targetRotationX = -state.pointer.y * 0.035
      darkStage = 1
      weights = {
        idle: 0.08,
        walk: 0,
        run: 0,
        agree: 0.74,
        headShake: 0.18,
        sneak_pose: 0,
      }
    }

    const standingBlend = current.reducedMotion ? 0 : 1 - smoothstep(0.025, 0.24, speed)
    const idlePose = idlePerformance(state.clock.elapsedTime, current.zone ?? 0)
    Object.keys(weights).forEach((name) => {
      weights[name] = mix(weights[name], idlePose[name], standingBlend)
    })

    const runDuration = Math.max(1, current.runUntil - current.runStartedAt)
    const runElapsed = now - current.runStartedAt
    const runProgress = clamp01(runElapsed / runDuration)
    const runBurst = current.reducedMotion || now >= current.runUntil
      ? 0
      : smoothstep(0, 140, runElapsed) * (1 - smoothstep(runDuration - 260, runDuration, runElapsed))

    if (runBurst > 0) {
      Object.keys(weights).forEach((name) => {
        if (name !== 'run') weights[name] *= 1 - runBurst
      })
      weights.run = weights.run + (1 - weights.run) * runBurst
      targetRotationX += runBurst * 0.08
      targetRotationZ -= runBurst * current.transitionDirection * 0.035
      targetY += Math.sin(runProgress * Math.PI) * 0.055

      // Work and About share the right rail, so the character visibly runs
      // offstage and back in instead of running in place between them.
      const loopsRightRail = [current.transitionFrom, current.transitionTo]
        .sort()
        .join('-') === '1-2'
      if (loopsRightRail) {
        targetX += Math.sin(runProgress * Math.PI) * 0.82
        targetY += Math.sin(runProgress * Math.PI) * 0.08
      }
    }

    const idleEnergy = standingBlend * (1 - runBurst)
    targetY += Math.sin(state.clock.elapsedTime * 1.25) * 0.012 * idleEnergy
    targetRotationY += Math.sin(state.clock.elapsedTime * 0.58) * 0.04 * idleEnergy
    targetRotationZ += Math.sin(state.clock.elapsedTime * 0.82) * 0.012 * idleEnergy

    Object.entries(weights).forEach(([name, weight]) => {
      actions[name]?.setEffectiveWeight(current.reducedMotion && name !== 'idle' ? 0 : weight)
    })
    if (current.reducedMotion) actions.idle?.setEffectiveWeight(1)

    mercury.color.copy(chromeDay).lerp(chromeNight, darkStage)
    mercury.envMapIntensity = mix(2.8, 3.55, darkStage)

    const follow = 1 - Math.exp(-delta * (runBurst > 0 ? 6.8 : 4.6))
    if (!initialized.current) {
      group.current.position.set(targetX, targetY, 0)
      body.current.rotation.set(targetRotationX, targetRotationY, targetRotationZ)
      group.current.scale.setScalar(targetScale)
      initialized.current = true
    } else {
      group.current.position.x += (targetX - group.current.position.x) * follow
      group.current.position.y += (targetY - group.current.position.y) * follow
      body.current.rotation.x += (targetRotationX - body.current.rotation.x) * follow
      body.current.rotation.y += (targetRotationY - body.current.rotation.y) * follow
      body.current.rotation.z += (targetRotationZ - body.current.rotation.z) * follow
      group.current.scale.x += (targetScale - group.current.scale.x) * follow
      group.current.scale.y += (targetScale - group.current.scale.y) * follow
      group.current.scale.z += (targetScale - group.current.scale.z) * follow
    }
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
        {/* Procedural studio cards keep the chrome readable without downloading an HDRI. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={5} color="#ffffff" scale={[8, 2, 1]} position={[0, 5, -7]} />
          <Lightformer form="rect" intensity={4} color="#58e7ff" scale={[2, 7, 1]} position={[-5, 1, 0]} rotation-y={Math.PI / 2} />
          <Lightformer form="rect" intensity={4.5} color="#a875ff" scale={[2, 7, 1]} position={[5, 1, 0]} rotation-y={-Math.PI / 2} />
          <Lightformer form="ring" intensity={3.5} color="#ff6fd8" scale={3} position={[0, 1, -5]} />
        </Environment>
        <ambientLight intensity={0.28} />
        <directionalLight position={[4, 7, 5]} intensity={3.6} color="#d9f4ff" castShadow shadow-mapSize={[1024, 1024]} />
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
