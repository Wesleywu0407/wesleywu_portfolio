import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  useGLTF,
  useAnimations,
  ContactShadows,
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

function smoothstep(min, max, value) {
  const x = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return x * x * (3 - 2 * x)
}

function Human({ scrollProgress, reducedMotion }) {
  const group = useRef()
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)

  // Liquid-chrome material: a cool silver base, tight reflections and a subtle
  // blue-violet iridescent shift give the figure a polished Y2K mercury finish.
  const mercury = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color('#b9c7dc'),
        metalness: 1,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 2.8,
        iridescence: 0.72,
        iridescenceIOR: 1.45,
        iridescenceThicknessRange: [120, 460],
      }),
    [],
  )

  useEffect(() => {
    // Run the clips together and blend their weights from scroll progress.
    // This keeps transitions fluid instead of snapping between canned poses.
    const clips = ['idle', 'walk', 'agree', 'sneak_pose']
      .map((name) => actions[name])
      .filter(Boolean)

    clips.forEach((clip, index) => {
      clip.reset().play()
      clip.enabled = true
      clip.setEffectiveWeight(index === 0 ? 1 : 0)
    })

    if (actions.idle) actions.idle.timeScale = 0.65
    if (actions.walk) actions.walk.timeScale = 0.85
    if (actions.agree) actions.agree.timeScale = 0.72
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

  // the figure lazily turns to face the cursor
  useFrame((state, delta) => {
    if (!group.current) return
    const rawProgress = reducedMotion ? 0 : (scrollProgress?.get() ?? 0)
    const progress = smoothstep(0, 0.58, rawProgress)
    const follow = Math.min(1, delta * 4)

    const idleOut = smoothstep(0.05, 0.28, progress)
    const walkOut = smoothstep(0.46, 0.67, progress)
    const agreeOut = smoothstep(0.72, 0.93, progress)
    actions.idle?.setEffectiveWeight(1 - idleOut)
    actions.walk?.setEffectiveWeight(idleOut * (1 - walkOut))
    actions.agree?.setEffectiveWeight(walkOut * (1 - agreeOut))
    actions.sneak_pose?.setEffectiveWeight(agreeOut)

    const targetY = state.pointer.x * 0.34 + progress * 0.9
    const targetX = -state.pointer.y * 0.05 + progress * 0.1
    const targetZ = -Math.sin(progress * Math.PI) * 0.055
    group.current.rotation.y += (targetY - group.current.rotation.y) * follow
    group.current.rotation.x += (targetX - group.current.rotation.x) * follow
    group.current.rotation.z += (targetZ - group.current.rotation.z) * follow

    const targetScale = 1 - progress * 0.14
    group.current.scale.x += (targetScale - group.current.scale.x) * follow
    group.current.scale.y += (targetScale - group.current.scale.y) * follow
    group.current.scale.z += (targetScale - group.current.scale.z) * follow
    group.current.position.x += (Math.sin(progress * Math.PI) * 0.16 - group.current.position.x) * follow
    group.current.position.y += (progress * 0.28 - group.current.position.y) * follow
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

export default function Scene({ active = true, scrollProgress, reducedMotion = false }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.05, 3.4], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
      // canvas ignores pointer events, so read the cursor from the whole page
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      // pause the render loop when the hero is off-screen (saves GPU/battery)
      frameloop={active ? 'always' : 'never'}
    >
      <CameraRig />
      {/* Procedural studio cards keep the chrome readable without downloading an HDRI. */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={5}
          color="#ffffff"
          scale={[8, 2, 1]}
          position={[0, 5, -7]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#58e7ff"
          scale={[2, 7, 1]}
          position={[-5, 1, 0]}
          rotation-y={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={4.5}
          color="#a875ff"
          scale={[2, 7, 1]}
          position={[5, 1, 0]}
          rotation-y={-Math.PI / 2}
        />
        <Lightformer
          form="ring"
          intensity={3.5}
          color="#ff6fd8"
          scale={3}
          position={[0, 1, -5]}
        />
      </Environment>
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={3.6}
        color="#d9f4ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Cyan and violet edge lights create the cool Y2K colour split. */}
      <directionalLight position={[-5, 3, 1]} intensity={3.1} color="#50e6ff" />
      <directionalLight position={[4, 2, -4]} intensity={3.5} color="#9c6cff" />
      <directionalLight position={[0, 5, -6]} intensity={2.8} color="#ff70d7" />
      <Suspense fallback={null}>
        <Human scrollProgress={scrollProgress} reducedMotion={reducedMotion} />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.34}
          scale={4}
          blur={2.6}
          far={1.4}
          color="#455370"
        />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
