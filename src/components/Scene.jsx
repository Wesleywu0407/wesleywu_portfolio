import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, ContactShadows } from '@react-three/drei'
import { MeshStandardMaterial, Color } from 'three'

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

  // one shared white-plaster material so the figure reads as a sculpture,
  // not a stock 3D asset — keeps the whole hero strictly black & white.
  const plaster = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color('#eceae2'),
        roughness: 0.95,
        metalness: 0.0,
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
        o.material = plaster
      }
    })
    return () => clip && clip.fadeOut(0.3)
  }, [actions, scene, plaster])

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
      {/* sculptural lighting: soft ambient + strong key so the white form reads */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -2]} intensity={1.1} color="#ffffff" />
      {/* rim light from behind to separate the figure from the paper */}
      <directionalLight position={[0, 4, -6]} intensity={2.4} color="#ffffff" />
      <Suspense fallback={null}>
        <Human />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.42}
          scale={4}
          blur={2.6}
          far={1.4}
          color="#0e0e0c"
        />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
