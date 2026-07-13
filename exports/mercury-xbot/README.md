# Mercury Xbot game package

Rigged humanoid GLB prepared for reuse in a Three.js game. The mesh, skeleton and
seven animation clips are stored in `models/mercury-xbot.glb`. The mercury/Y2K
appearance used by the portfolio is applied at runtime by
`src/applyMercuryMaterial.js`.

## Included animation clips

- `idle`
- `walk`
- `run`
- `agree`
- `headShake`
- `sad_pose`
- `sneak_pose`

The face can be aimed independently through the `mixamorig:Head` bone. The neck
bone is named `mixamorig:Neck`.

## Three.js example

```js
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { applyMercuryMaterial } from './src/applyMercuryMaterial.js'

const loader = new GLTFLoader()

loader.load('./models/mercury-xbot.glb', (gltf) => {
  const character = gltf.scene
  scene.add(character)

  const mercury = applyMercuryMaterial(character)
  const mixer = new THREE.AnimationMixer(character)
  const clips = Object.fromEntries(gltf.animations.map((clip) => [clip.name, clip]))

  mixer.clipAction(clips.idle).play()

  // In the render loop:
  // mixer.update(delta)

  // Dispose this when the character is removed:
  // mercury.dispose()
})
```

The reflective material needs an environment map or bright scene lights to look
like polished mercury. Without reflections it will look much darker.

## Other engines

The GLB itself can be imported by engines that support glTF 2.0, including Unity,
Unreal and Godot. The JavaScript material helper is Three.js-specific, so recreate
the material in the destination engine with high metallic, low roughness,
clearcoat and cyan/purple environment lighting.

See `NOTICE/THIRD_PARTY_NOTICE.txt` for the original model source.
