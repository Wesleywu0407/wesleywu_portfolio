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

function Human() {
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
    // play whatever idle-like clip ships with the model (avoids a T-pose flash)
    const clip = actions['idle'] || actions[Object.keys(actions)[0]]
    if (clip) clip.reset().fadeIn(0.5).play()
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        o.frustumCulled = false
        o.material = mercury
      }
    })
    return () => clip && clip.fadeOut(0.3)
  }, [actions, scene, mercury])

  useEffect(() => () => mercury.dispose(), [mercury])

  // the figure lazily turns to face the cursor
  useFrame((state, delta) => {
    if (!group.current) return
    const targetY = state.pointer.x * 0.55
    const targetX = -state.pointer.y * 0.06
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 3)
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 3)
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

export default function Scene({ active = true }) {
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
        <Human />
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
