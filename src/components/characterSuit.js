/* Dresses the bare mannequin in a suit without any new geometry.
 *
 * The body is painted in the fragment shader from the vertex's BIND-POSE
 * position, not its animated position. Bind pose is a T-pose, so the body maps
 * onto a very convenient set of axes — y runs head to foot, x runs out along the
 * arms — and because the coordinates are fixed at bind time the tailoring stays
 * welded to the body no matter how the figure moves.
 *
 * Measured off the actual mesh: model is 1.806 tall, hands start at |x| = 0.72,
 * head box starts at y = 1.540, hips at y = 1.040.
 */
import { Color, DataTexture, MeshToonMaterial, NearestFilter, RedFormat } from 'three'

// Four hard bands instead of a smooth falloff. Four steps also keeps the row
// byte-aligned for the default unpackAlignment.
const TOON_BANDS = new Uint8Array([46, 122, 206, 255])

export function createToonRamp() {
  const ramp = new DataTexture(TOON_BANDS, TOON_BANDS.length, 1, RedFormat)
  ramp.minFilter = NearestFilter
  ramp.magFilter = NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

const SUIT_CHUNK = /* glsl */ `
  float y = vBindPos.y;
  float ax = abs(vBindPos.x);
  float z = vBindPos.z;

  // Charcoal rather than true black: the toon bands need somewhere to land, or
  // the whole figure collapses into an unreadable silhouette.
  vec3 tone = uCloth;

  // Shirt shows as a V at the collar, widening as it rises.
  float vee = 0.012 + (y - 1.335) * 0.30;
  if (z > 0.0 && y > 1.335 && y < 1.525 && ax < vee) tone = uShirt;

  // Cuffs, then the hands beyond them.
  if (ax > 0.665 && ax <= 0.725) tone = uShirt;
  if (ax > 0.725) tone = uSkin;

  // Head and neck.
  if (y > 1.525) tone = uSkin;

  // Shoes.
  if (y < 0.085) tone = uInk;

  // --- tailoring lines, drawn rather than modelled ---
  // Jacket hem.
  if (y > 0.952 && y < 0.962 && ax < 0.30) tone = uInk;
  // Centre front opening, below the collar V.
  if (z > 0.02 && ax < 0.005 && y > 0.96 && y < 1.35) tone = uInk;
  // Cuff edge.
  if (ax > 0.6615 && ax < 0.6665) tone = uInk;
  // Collar seam.
  if (y > 1.520 && y < 1.528 && ax < 0.09) tone = uInk;

  diffuseColor.rgb = tone;
`

/* Returns the material plus the colour uniforms, so the scene can cross-fade
 * the whole figure between the paper sections and the inverted ones. */
export function createSuitMaterial(ramp) {
  const uniforms = {
    uSkin: { value: new Color('#f2f1ec') },
    uShirt: { value: new Color('#f2f1ec') },
    uCloth: { value: new Color('#3a3a40') },
    uInk: { value: new Color('#0e0e0c') },
  }

  const material = new MeshToonMaterial({ color: '#ffffff', gradientMap: ramp })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = `varying vec3 vBindPos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n\tvBindPos = position;',
    )

    shader.fragmentShader = `
      varying vec3 vBindPos;
      uniform vec3 uSkin;
      uniform vec3 uShirt;
      uniform vec3 uCloth;
      uniform vec3 uInk;
      ${shader.fragmentShader}
    `.replace('#include <color_fragment>', `#include <color_fragment>\n${SUIT_CHUNK}`)
  }

  return { material, uniforms }
}
