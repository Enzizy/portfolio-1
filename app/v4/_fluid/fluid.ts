// A small real-time fluid solver on the GPU (WebGL2), after Jos Stam's "Stable
// Fluids": every frame the velocity field is given extra swirl, made
// incompressible with a pressure solve, then carries itself and a coloured "ink"
// field forward. The pointer injects velocity and ink; left alone it drifts.
//
// Everything lives in half-float textures at low resolution, so it is cheap: the
// simulation grid is ~128 cells across, the ink a few hundred pixels.

export type FluidOptions = {
  canvas: HTMLCanvasElement;
  /** Background the ink glows on, linear 0..1. */
  background: [number, number, number];
  /** Ink colours to cycle through, linear 0..1 (kept dim: they add up). */
  palette: [number, number, number][];
  reduced?: boolean;
};

export type Fluid = { dispose: () => void };

const VERTEX = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEADER = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
`;

const SHADERS = {
  splat: `${HEADER}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  outColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,
  advect: `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  outColor = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`,
  divergence: `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  curl: `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  outColor = vec4(velocity, 0.0, 1.0);
}`,
  fade: `${HEADER}
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  outColor = uValue * texture(uTexture, vUv);
}`,
  display: `${HEADER}
uniform sampler2D uDye;
uniform vec3 uBackground;
uniform vec2 uTexel;
void main() {
  vec3 ink = texture(uDye, vUv).rgb;
  // Shade the ink by its own density gradient: it reads as a glossy liquid
  // rather than flat smoke.
  float l = length(texture(uDye, vL).rgb);
  float r = length(texture(uDye, vR).rgb);
  float t = length(texture(uDye, vT).rgb);
  float b = length(texture(uDye, vB).rgb);
  vec3 normal = normalize(vec3(r - l, t - b, length(uTexel) * 2.0));
  float light = clamp(dot(normal, normalize(vec3(-0.4, 0.5, 1.0))) * 0.6 + 0.55, 0.5, 1.25);
  vec3 color = uBackground + ink * light;
  // Soft roll-off so dense ink glows instead of clipping to flat white.
  color = 1.0 - exp(-color * 1.6);
  // A gentle vignette keeps the eye in the middle.
  vec2 centered = vUv - 0.5;
  color *= 1.0 - dot(centered, centered) * 0.55;
  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`,
} as const;

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };
type Target = { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texel: [number, number] };
type DoubleTarget = { read: Target; write: Target; swap: () => void; width: number; height: number; texel: [number, number] };

const SIM_RESOLUTION = 128;
const PRESSURE_ITERATIONS = 18;
const CURL = 26;
const SPLAT_RADIUS = 0.22;
const SPLAT_FORCE = 5200;
const VELOCITY_DISSIPATION = 0.25;
const DYE_DISSIPATION = 0.42;

export function createFluid(options: FluidOptions): Fluid | null {
  const { canvas } = options;
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
  if (!gl) return null;
  // Rendering into half-float textures needs this extension in WebGL2.
  if (!gl.getExtension("EXT_color_buffer_float")) return null;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const dyeResolution = coarse || window.innerWidth < 900 ? 512 : 768;

  /* ---------------------------------------------------------------- setup */

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("[v4 fluid] shader:", gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  if (!vertex) return null;
  const programs: Program[] = [];
  const makeProgram = (source: string): Program | null => {
    const fragment = compile(gl.FRAGMENT_SHADER, source);
    if (!fragment) return null;
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[v4 fluid] link:", gl.getProgramInfoLog(program));
      return null;
    }
    const uniforms: Program["uniforms"] = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i)!.name;
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    const made = { program, uniforms };
    programs.push(made);
    return made;
  };
  const p = {
    splat: makeProgram(SHADERS.splat),
    advect: makeProgram(SHADERS.advect),
    divergence: makeProgram(SHADERS.divergence),
    curl: makeProgram(SHADERS.curl),
    vorticity: makeProgram(SHADERS.vorticity),
    pressure: makeProgram(SHADERS.pressure),
    gradient: makeProgram(SHADERS.gradient),
    fade: makeProgram(SHADERS.fade),
    display: makeProgram(SHADERS.display),
  };
  if (Object.values(p).some((program) => !program)) return null;
  const P = p as { [K in keyof typeof p]: Program };

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const createTarget = (width: number, height: number): Target | null => {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width, height, texel: [1 / width, 1 / height] };
  };
  const createDouble = (width: number, height: number): DoubleTarget | null => {
    let a = createTarget(width, height);
    let b = createTarget(width, height);
    if (!a || !b) return null;
    return {
      get read() { return a!; },
      get write() { return b!; },
      swap() { [a, b] = [b, a]; },
      width,
      height,
      texel: [1 / width, 1 / height],
    };
  };
  const destroyTarget = (target: Target) => {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.fbo);
  };

  /** Width/height for a field whose short side is `resolution`. */
  const sizeFor = (resolution: number) => {
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const long = Math.round(resolution * Math.max(aspect, 1 / aspect));
    return aspect >= 1 ? [long, resolution] : [resolution, long];
  };

  let velocity: DoubleTarget, dye: DoubleTarget, pressure: DoubleTarget, divergence: Target, curl: Target;
  const allocate = () => {
    const [sw, sh] = sizeFor(SIM_RESOLUTION);
    const [dw, dh] = sizeFor(dyeResolution);
    const v = createDouble(sw, sh);
    const d = createDouble(dw, dh);
    const pr = createDouble(sw, sh);
    const dv = createTarget(sw, sh);
    const c = createTarget(sw, sh);
    if (!v || !d || !pr || !dv || !c) return false;
    velocity = v;
    dye = d;
    pressure = pr;
    divergence = dv;
    curl = c;
    return true;
  };
  const release = () => {
    if (!velocity) return;
    for (const target of [velocity.read, velocity.write, dye.read, dye.write, pressure.read, pressure.write, divergence, curl]) destroyTarget(target);
  };

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  };
  resizeCanvas();
  if (!allocate()) return null;

  /* ---------------------------------------------------------------- drawing */

  const activate = (program: Program) => {
    gl.useProgram(program.program);
    return program.uniforms;
  };
  const bind = (unit: number, target: Target) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  };
  const blit = (target: Target | null) => {
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  const step = (dt: number) => {
    let u = activate(P.curl);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    blit(curl);

    u = activate(P.vorticity);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uCurl, bind(1, curl));
    gl.uniform1f(u.uStrength, CURL);
    gl.uniform1f(u.uDt, dt);
    blit(velocity.write);
    velocity.swap();

    u = activate(P.divergence);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    blit(divergence);

    u = activate(P.fade);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uTexture, bind(0, pressure.read));
    gl.uniform1f(u.uValue, 0.8);
    blit(pressure.write);
    pressure.swap();

    u = activate(P.pressure);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uDivergence, bind(0, divergence));
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(u.uPressure, bind(1, pressure.read));
      blit(pressure.write);
      pressure.swap();
    }

    u = activate(P.gradient);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uPressure, bind(0, pressure.read));
    gl.uniform1i(u.uVelocity, bind(1, velocity.read));
    blit(velocity.write);
    velocity.swap();

    u = activate(P.advect);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(0, velocity.read));
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDissipation, VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(1, dye.read));
    gl.uniform1f(u.uDissipation, DYE_DISSIPATION);
    blit(dye.write);
    dye.swap();
  };

  const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
    const aspect = canvas.width / canvas.height;
    const u = activate(P.splat);
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1i(u.uTarget, bind(0, velocity.read));
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uPoint, x, y);
    gl.uniform3f(u.uColor, dx, dy, 0);
    gl.uniform1f(u.uRadius, (SPLAT_RADIUS / 100) * (aspect > 1 ? aspect : 1));
    blit(velocity.write);
    velocity.swap();
    gl.uniform1i(u.uTarget, bind(0, dye.read));
    gl.uniform3fv(u.uColor, color);
    blit(dye.write);
    dye.swap();
  };

  const render = () => {
    const u = activate(P.display);
    gl.uniform2fv(u.uTexel, dye.texel);
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform3fv(u.uBackground, options.background);
    blit(null);
  };

  /* ---------------------------------------------------------------- input */

  let colorIndex = 0;
  const nextColor = (): [number, number, number] => {
    const [r, g, b] = options.palette[colorIndex++ % options.palette.length];
    return [r, g, b];
  };
  const randomSplat = (strength = 1) => {
    const angle = Math.random() * Math.PI * 2;
    const force = (380 + Math.random() * 520) * strength;
    splat(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, Math.cos(angle) * force, Math.sin(angle) * force, nextColor());
  };

  const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, down: false, primed: false, color: nextColor() };
  let lastInput = 0;
  const onPointerMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    if (event.clientY < box.top || event.clientY > box.bottom) return;
    const x = (event.clientX - box.left) / box.width;
    const y = 1 - (event.clientY - box.top) / box.height;
    if (!pointer.primed) {
      pointer.x = x;
      pointer.y = y;
      pointer.primed = true;
      return;
    }
    const aspect = box.width / box.height;
    pointer.dx += (x - pointer.x) * (aspect < 1 ? aspect : 1);
    pointer.dy += (y - pointer.y) / (aspect > 1 ? aspect : 1);
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;
    lastInput = performance.now();
  };
  const onPointerDown = (event: PointerEvent) => {
    onPointerMove(event);
    // A tap or click drops a bright bloom of ink.
    const color = nextColor();
    splat(pointer.x, pointer.y, (Math.random() - 0.5) * 900, (Math.random() - 0.5) * 900, [color[0] * 4, color[1] * 4, color[2] * 4]);
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });

  /* ------------------------------------------------------------------- loop */

  let raf = 0;
  let visible = true;
  let last = performance.now();
  let ambientClock = 0;
  let colorClock = 0;

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 60);
    last = now;
    if (resizeCanvas()) {
      release();
      allocate();
    }

    colorClock += dt;
    if (colorClock > 0.6) {
      colorClock = 0;
      pointer.color = nextColor();
    }
    if (pointer.moved) {
      pointer.moved = false;
      splat(pointer.x, pointer.y, pointer.dx * SPLAT_FORCE, pointer.dy * SPLAT_FORCE, pointer.color);
      pointer.dx = 0;
      pointer.dy = 0;
    }
    // Left alone, the ink keeps drifting and blooming on its own.
    ambientClock += dt;
    if (now - lastInput > 1600 && ambientClock > 0.55) {
      ambientClock = 0;
      randomSplat(0.9);
    }

    step(dt);
    render();
  };
  const start = () => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // An opening burst, so the hero is alive from the first frame.
  for (let i = 0; i < 7; i++) randomSplat(1.2);
  if (options.reduced) {
    // Still ink, no motion: a few steps to soften the splats, then one frame.
    for (let i = 0; i < 24; i++) step(1 / 60);
    render();
  } else {
    start();
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !options.reduced) start();
  });
  observer.observe(canvas);
  const onVisibility = () => {
    if (!document.hidden && !options.reduced) start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      release();
      programs.forEach(({ program }) => gl.deleteProgram(program));
      gl.deleteShader(vertex);
      gl.deleteBuffer(quad);
      gl.deleteBuffer(indices);
    },
  };
}
