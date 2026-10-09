// One wave field, written twice: in JS so the boat and the floating crates ride the
// same swell the GPU draws, and in GLSL for the sea surface itself. Keep them in step.

export function waveHeight(x: number, z: number, t: number) {
  return (
    Math.sin(x * 0.17 + t * 0.85) * 0.2 +
    Math.sin(z * 0.21 - t * 0.7) * 0.17 +
    Math.sin((x + z) * 0.09 + t * 0.45) * 0.24
  );
}

export const WAVE_GLSL = /* glsl */ `
float waveHeight(vec2 p, float t) {
  return sin(p.x * 0.17 + t * 0.85) * 0.2
    + sin(p.y * 0.21 - t * 0.7) * 0.17
    + sin((p.x + p.y) * 0.09 + t * 0.45) * 0.24;
}
`;
