import { Color, MeshPhysicalMaterial } from 'three'

export const MERCURY_MATERIAL_OPTIONS = Object.freeze({
  color: '#b9c7dc',
  metalness: 1,
  roughness: 0.12,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  envMapIntensity: 2.8,
  iridescence: 0.72,
  iridescenceIOR: 1.45,
  iridescenceThicknessRange: [120, 460],
})

export function createMercuryMaterial(overrides = {}) {
  const options = { ...MERCURY_MATERIAL_OPTIONS, ...overrides }

  return new MeshPhysicalMaterial({
    ...options,
    color: new Color(options.color),
    iridescenceThicknessRange: [...options.iridescenceThicknessRange],
  })
}

export function applyMercuryMaterial(root, overrides = {}) {
  const material = createMercuryMaterial(overrides)

  root.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = true
    object.receiveShadow = true
    object.frustumCulled = false
    object.material = material
  })

  return material
}
