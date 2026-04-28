<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import * as THREE from 'three'

type StyleKey = 'flow' | 'pulse' | 'waves' | 'shapes'
const STYLE_MAP: Record<StyleKey, number> = { flow: 0, pulse: 1, waves: 2, shapes: 3 }

type ShapeKey = 'sphere' | 'cube' | 'torus' | 'blob' | 'cluster'
const SHAPE_MAP: Record<ShapeKey, number> = { sphere: 0, cube: 1, torus: 2, blob: 3, cluster: 4 }

const DEFAULTS = {
  style: 'waves' as StyleKey,
  speed: 0.045,
  scale: 1.25,
  warp: 1.8,
  sharpness: 0,
  brightness: 0.2,
  colors: ['#0d0019', '#1c023b', '#a791d9', '#c1b4fd'] as const,
  shape: 'sphere' as ShapeKey,
  size: 1.0,
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  distortion: 0.4,
  wobble: 0.5,
}

const style = ref<StyleKey>(DEFAULTS.style)
const speed = ref<number>(DEFAULTS.speed)
const scale = ref<number>(DEFAULTS.scale)
const warp = ref<number>(DEFAULTS.warp)
const sharpness = ref<number>(DEFAULTS.sharpness)
const brightness = ref<number>(DEFAULTS.brightness)
const c1 = ref<string>(DEFAULTS.colors[0])
const c2 = ref<string>(DEFAULTS.colors[1])
const c3 = ref<string>(DEFAULTS.colors[2])
const c4 = ref<string>(DEFAULTS.colors[3])
const autoMode = ref<boolean>(false)
const showControls = ref<boolean>(true)
const shape = ref<ShapeKey>(DEFAULTS.shape)
const size = ref<number>(DEFAULTS.size)
const posX = ref<number>(DEFAULTS.posX)
const posY = ref<number>(DEFAULTS.posY)
const posZ = ref<number>(DEFAULTS.posZ)
const rotX = ref<number>(DEFAULTS.rotX)
const rotY = ref<number>(DEFAULTS.rotY)
const rotZ = ref<number>(DEFAULTS.rotZ)
const distortion = ref<number>(DEFAULTS.distortion)
const wobble = ref<number>(DEFAULTS.wobble)

type PresetSettings = {
  style: StyleKey
  speed: number
  scale: number
  warp: number
  sharpness: number
  brightness: number
  colors: [string, string, string, string]
  autoMode: boolean
  // Shape-mode fields. Optional for backward compatibility with presets saved
  // before the geometry style existed — load fills missing fields with defaults.
  shape?: ShapeKey
  size?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  distortion?: number
  wobble?: number
}
type Preset = {
  id: string
  name: string
  settings: PresetSettings
  date_created: string
}

const presets = ref<Preset[]>([])
const newPresetName = ref<string>('')
const presetSaving = ref<boolean>(false)
const presetError = ref<string | null>(null)

async function fetchPresets() {
  presetError.value = null
  try {
    presets.value = await $fetch<Preset[]>('/api/presets')
  } catch (e: any) {
    presetError.value = e?.statusMessage || e?.message || 'Presets konnten nicht geladen werden'
  }
}

async function savePreset() {
  const name = newPresetName.value.trim()
  if (!name) return
  presetSaving.value = true
  presetError.value = null
  try {
    const settings: PresetSettings = {
      style: style.value,
      speed: speed.value,
      scale: scale.value,
      warp: warp.value,
      sharpness: sharpness.value,
      brightness: brightness.value,
      colors: [c1.value, c2.value, c3.value, c4.value],
      autoMode: autoMode.value,
      shape: shape.value,
      size: size.value,
      position: [posX.value, posY.value, posZ.value],
      rotation: [rotX.value, rotY.value, rotZ.value],
      distortion: distortion.value,
      wobble: wobble.value,
    }
    const created = await $fetch<Preset>('/api/presets', {
      method: 'POST',
      body: { name, settings },
    })
    presets.value = [created, ...presets.value]
    newPresetName.value = ''
  } catch (e: any) {
    presetError.value = e?.statusMessage || e?.message || 'Preset konnte nicht gespeichert werden'
  } finally {
    presetSaving.value = false
  }
}

function loadPreset(p: Preset) {
  const s = p.settings
  // Disable autoMode first so colour writes don't trigger harmony derivation,
  // then restore all values, then set autoMode last to its target state.
  autoMode.value = false
  style.value = s.style
  speed.value = s.speed
  scale.value = s.scale
  warp.value = s.warp
  sharpness.value = s.sharpness
  brightness.value = s.brightness
  c1.value = s.colors[0]
  c2.value = s.colors[1]
  c3.value = s.colors[2]
  c4.value = s.colors[3]
  shape.value = s.shape ?? DEFAULTS.shape
  size.value = s.size ?? DEFAULTS.size
  posX.value = s.position?.[0] ?? DEFAULTS.posX
  posY.value = s.position?.[1] ?? DEFAULTS.posY
  posZ.value = s.position?.[2] ?? DEFAULTS.posZ
  rotX.value = s.rotation?.[0] ?? DEFAULTS.rotX
  rotY.value = s.rotation?.[1] ?? DEFAULTS.rotY
  rotZ.value = s.rotation?.[2] ?? DEFAULTS.rotZ
  distortion.value = s.distortion ?? DEFAULTS.distortion
  wobble.value = s.wobble ?? DEFAULTS.wobble
  autoMode.value = s.autoMode
}

// ───── Pointer-drag rotation ─────
// Horizontal drag → rotate around Y (yaw); vertical drag → rotate around X
// (pitch). Z is slider-only. Values wrap into -180..180 so the slider stays
// in sync with the underlying state during long drags. Drag is opt-in via a
// panel checkbox so scrolling/text-selection on the page isn't intercepted.
const dragRotate = ref(false)
const dragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragStartRotX = 0
let dragStartRotY = 0

function wrap180(v: number): number {
  return ((v + 180) % 360 + 360) % 360 - 180
}

function onPointerDown(e: PointerEvent) {
  if (style.value !== 'shapes' || !dragRotate.value) return
  // Only react to left-button / primary pointer; ignore right-clicks etc.
  if (e.button !== 0 && e.pointerType === 'mouse') return
  dragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartRotX = rotX.value
  dragStartRotY = rotY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  const sensitivity = 0.5 // degrees per pixel
  rotY.value = wrap180(dragStartRotY + dx * sensitivity)
  rotX.value = wrap180(dragStartRotX + dy * sensitivity)
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}

async function deletePreset(p: Preset) {
  presetError.value = null
  try {
    await $fetch(`/api/presets/${p.id}`, { method: 'DELETE' })
    presets.value = presets.value.filter(x => x.id !== p.id)
  } catch (e: any) {
    presetError.value = e?.statusMessage || e?.message || 'Preset konnte nicht gelöscht werden'
  }
}

function deriveHarmony(baseHex: string): [string, string, string] {
  const base = new THREE.Color().setStyle(baseHex)
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  const make = (lightnessFrac: number, satMult: number, hueShift: number) => {
    let h = hsl.h + hueShift
    if (h < 0) h += 1
    if (h > 1) h -= 1
    const s = Math.min(1, Math.max(0, hsl.s * satMult))
    const l = Math.min(1, Math.max(0, hsl.l * lightnessFrac))
    return '#' + new THREE.Color().setHSL(h, s, l).getHexString()
  }
  return [
    make(0.12, 1.15, 0.04),  // darkest — cooler hue shift, slightly more saturated
    make(0.38, 1.10, 0.025),
    make(0.65, 1.00, 0.010),
  ]
}

function applyAutoHarmony() {
  const [d1, d2, d3] = deriveHarmony(c4.value)
  c1.value = d1
  c2.value = d2
  c3.value = d3
}

type Uniforms = {
  u_time: { value: number }
  u_resolution: { value: THREE.Vector2 }
  u_speed: { value: number }
  u_scale: { value: number }
  u_warp: { value: number }
  u_sharpness: { value: number }
  u_brightness: { value: number }
  u_style: { value: number }
  u_c1: { value: THREE.Color }
  u_c2: { value: THREE.Color }
  u_c3: { value: THREE.Color }
  u_c4: { value: THREE.Color }
  u_shape: { value: number }
  u_size: { value: number }
  u_position: { value: THREE.Vector3 }
  u_rotation: { value: THREE.Vector3 }
  u_distortion: { value: number }
  u_wobble: { value: number }
}

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let material: THREE.ShaderMaterial | null = null
let uniforms: Uniforms | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null

const fragmentShader = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_speed;
uniform float u_scale;
uniform float u_warp;
uniform float u_sharpness;
uniform float u_brightness;
uniform int   u_style;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform vec3  u_c4;
uniform int   u_shape;
uniform float u_size;
uniform vec3  u_position;
uniform vec3  u_rotation;
uniform float u_distortion;
uniform float u_wobble;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                          dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// ───── SDF helpers (geometry style) ─────
float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 twist(vec3 p, float k) {
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  vec2 xz = mat2(c, -s, s, c) * p.xz;
  return vec3(xz.x, p.y, xz.y);
}

vec3 rotateX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotateZ(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

float sceneSDF(vec3 p) {
  // Apply user rotation (degrees in uniform → radians for trig).
  // Order: X then Y then Z — gives intuitive "tumble in 3D" behaviour for
  // mouse drag (X = pitch / vertical drag, Y = yaw / horizontal drag,
  // Z = roll / slider only).
  vec3 q = rotateZ(
    rotateY(
      rotateX(p, radians(u_rotation.x)),
      radians(u_rotation.y)
    ),
    radians(u_rotation.z)
  );
  // Twist the input space — gives a rotational "verzerrung" effect on all
  // shapes except cluster (which already animates its layout).
  if (u_shape != 4) q = twist(q, u_distortion * 1.2);

  float d;
  if (u_shape == 0) {
    d = sdSphere(q, u_size);
  } else if (u_shape == 1) {
    d = sdBox(q, vec3(u_size * 0.85));
  } else if (u_shape == 2) {
    d = sdTorus(q, vec2(u_size, u_size * 0.32));
  } else if (u_shape == 3) {
    // Blob — smooth-min between sphere and box: gives a rounded-cube look.
    float ds = sdSphere(q, u_size);
    float db = sdBox(q, vec3(u_size * 0.85));
    d = smin(ds, db, 0.45);
  } else {
    // Cluster — three spheres orbiting in 3D, smooth-merged like metaballs.
    float r = u_size * 0.55;
    float t = u_time * u_speed * 4.0;
    float w = 0.7;
    vec3 o1 = vec3(sin(t)         * w, cos(t * 1.3)  * w, sin(t * 0.7) * w * 0.5);
    vec3 o2 = vec3(cos(t * 0.8)   * w, sin(t * 0.6)  * w, cos(t * 0.4) * w * 0.5);
    vec3 o3 = vec3(sin(t * 1.2)   * w, -sin(t)       * w, sin(t * 1.5) * w * 0.5);
    float s1 = sdSphere(q - o1, r);
    float s2 = sdSphere(q - o2, r);
    float s3 = sdSphere(q - o3, r);
    d = smin(smin(s1, s2, 0.4), s3, 0.4);
  }

  // Surface wobble — low-freq sin displacement (in rotated object space, so
  // the pattern follows the rotation instead of stuck to the world).
  float ta = u_time * u_speed * 8.0;
  d += sin(q.x * 3.5 + ta) * sin(q.y * 3.5 + ta * 0.8) * sin(q.z * 3.5 + ta * 1.3)
       * u_wobble * 0.08;
  return d;
}

vec3 calcNormal(vec3 p) {
  const float e = 0.0015;
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * sceneSDF(p + k.xyy * e) +
    k.yyx * sceneSDF(p + k.yyx * e) +
    k.yxy * sceneSDF(p + k.yxy * e) +
    k.xxx * sceneSDF(p + k.xxx * e)
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  if (u_style == 3) {
    // ───── Geometry / Raymarched SDF style ─────
    vec2 sp = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(sp, 1.2));

    float t = 0.0;
    bool hit = false;
    for (int i = 0; i < 48; i++) {
      vec3 p = ro + rd * t - u_position;
      float d = sceneSDF(p);
      if (d < 0.001) { hit = true; break; }
      t += d;
      if (t > 8.0) break;
    }

    vec3 col;
    if (hit) {
      vec3 p = ro + rd * t - u_position;
      vec3 n = calcNormal(p);
      vec3 lightDir = normalize(vec3(0.55, 0.75, -0.5));
      float diffuse = max(dot(n, lightDir), 0.0);
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
      vec3 r = reflect(rd, n);
      float spec = pow(max(dot(r, lightDir), 0.0), mix(8.0, 96.0, u_sharpness));

      // Color the surface by depth + lighting:
      // far → c1 (darkest), near → c4 (brightest), middle blended via diffuse.
      float depthFactor = clamp((t - 1.5) / 3.0, 0.0, 1.0);
      vec3 base = mix(u_c4, u_c1, depthFactor);
      vec3 lit = mix(u_c2, base, diffuse);
      lit = mix(lit, u_c3, diffuse * 0.7);
      lit = mix(lit, u_c4, rim * 0.45);

      col = lit * u_brightness + spec * u_c4 * (0.4 + u_sharpness * 0.6);
    } else {
      // Background — soft vertical gradient between c1 and c2.
      col = mix(u_c1, u_c2, uv.y * 0.6 + 0.2);
    }

    float v = smoothstep(1.4, 0.5, length(uv - 0.5));
    col *= mix(0.92, 1.0, v);
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  // ───── Fluid styles (flow / pulse / waves) ─────
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  p /= u_scale;
  float t = u_time * u_speed;

  float n;
  if (u_style == 0) {
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(3.2, 1.3)));
    vec2 r = vec2(fbm(p + u_warp * q + vec2(0.9 + t * 0.6, 4.1)),
                  fbm(p + u_warp * q + vec2(3.7, 1.4)));
    n = fbm(p + u_warp * r);
  } else if (u_style == 1) {
    float radius = length(p);
    float pulse = sin(t * 3.5) * 0.25;
    vec2 q = vec2(fbm(p * 1.3 + pulse), fbm(p * 1.3 - vec2(0.0, t)));
    n = fbm(p * 1.3 + u_warp * q + radius * 0.4);
  } else {
    vec2 flow = vec2(t * 1.5, sin(t * 0.7) * 0.3);
    vec2 q = vec2(fbm(p + flow), fbm(p * 1.3 + flow.yx));
    n = fbm(p + u_warp * q) + sin(p.y * 2.5 + t * 1.5) * 0.15;
  }

  float grain = snoise(gl_FragCoord.xy * 0.55 + u_time * 30.0) * 0.12 * u_sharpness;
  n += grain;
  float bw = mix(0.45, 0.10, u_sharpness);
  float bShift = (1.0 - u_brightness) * 0.5;

  vec3 col = mix(u_c1, u_c2, smoothstep(-0.55 + bShift, -0.55 + bw + bShift, n));
  col = mix(col, u_c3, smoothstep(-0.10 + bShift, -0.10 + bw + bShift, n));
  col = mix(col, u_c4, smoothstep( 0.35 + bShift,  0.35 + bw + bShift, n) * 0.75);

  float v = smoothstep(1.4, 0.5, length(uv - 0.5));
  col *= mix(0.92, 1.0, v);

  gl_FragColor = vec4(col, 1.0);
}
`

const vertexShader = /* glsl */ `
void main() {
  gl_Position = vec4(position, 1.0);
}
`

onMounted(() => {
  if (!containerRef.value) return
  const el = containerRef.value

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
    u_speed: { value: speed.value },
    u_scale: { value: scale.value },
    u_warp: { value: warp.value },
    u_sharpness: { value: sharpness.value },
    u_brightness: { value: brightness.value },
    u_style: { value: STYLE_MAP[style.value] },
    u_c1: { value: new THREE.Color().setStyle(c1.value) },
    u_c2: { value: new THREE.Color().setStyle(c2.value) },
    u_c3: { value: new THREE.Color().setStyle(c3.value) },
    u_c4: { value: new THREE.Color().setStyle(c4.value) },
    u_shape: { value: SHAPE_MAP[shape.value] },
    u_size: { value: size.value },
    u_position: { value: new THREE.Vector3(posX.value, posY.value, posZ.value) },
    u_rotation: { value: new THREE.Vector3(rotX.value, rotY.value, rotZ.value) },
    u_distortion: { value: distortion.value },
    u_wobble: { value: wobble.value },
  }

  material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  const start = performance.now()
  const tick = () => {
    if (!renderer || !scene || !camera || !uniforms) return
    uniforms.u_time.value = (performance.now() - start) / 1000
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !uniforms || !el) return
    renderer.setSize(el.clientWidth, el.clientHeight)
    uniforms.u_resolution.value.set(el.clientWidth, el.clientHeight)
  })
  resizeObserver.observe(el)

  fetchPresets()
})

watch(speed,     v => { if (uniforms) uniforms.u_speed.value     = v })
watch(scale,     v => { if (uniforms) uniforms.u_scale.value     = v })
watch(warp,      v => { if (uniforms) uniforms.u_warp.value      = v })
watch(sharpness,  v => { if (uniforms) uniforms.u_sharpness.value  = v })
watch(brightness, v => { if (uniforms) uniforms.u_brightness.value = v })
watch(style,      v => { if (uniforms) uniforms.u_style.value      = STYLE_MAP[v] })
watch(c1, v => { if (uniforms) uniforms.u_c1.value.setStyle(v) })
watch(c2, v => { if (uniforms) uniforms.u_c2.value.setStyle(v) })
watch(c3, v => { if (uniforms) uniforms.u_c3.value.setStyle(v) })
watch(c4, v => {
  if (uniforms) uniforms.u_c4.value.setStyle(v)
  if (autoMode.value) applyAutoHarmony()
})

watch(autoMode, on => {
  if (on) applyAutoHarmony()
})

watch(shape,      v => { if (uniforms) uniforms.u_shape.value      = SHAPE_MAP[v] })
watch(size,       v => { if (uniforms) uniforms.u_size.value       = v })
watch(posX,       v => { if (uniforms) uniforms.u_position.value.x = v })
watch(posY,       v => { if (uniforms) uniforms.u_position.value.y = v })
watch(posZ,       v => { if (uniforms) uniforms.u_position.value.z = v })
watch(rotX,       v => { if (uniforms) uniforms.u_rotation.value.x = v })
watch(rotY,       v => { if (uniforms) uniforms.u_rotation.value.y = v })
watch(rotZ,       v => { if (uniforms) uniforms.u_rotation.value.z = v })
watch(distortion, v => { if (uniforms) uniforms.u_distortion.value = v })
watch(wobble,     v => { if (uniforms) uniforms.u_wobble.value     = v })

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  resizeObserver = null
  material?.dispose()
  renderer?.dispose()
  if (renderer?.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  renderer = null
  scene = null
  camera = null
  material = null
  uniforms = null
})

function reset() {
  autoMode.value = false
  style.value = DEFAULTS.style
  speed.value = DEFAULTS.speed
  scale.value = DEFAULTS.scale
  warp.value = DEFAULTS.warp
  sharpness.value = DEFAULTS.sharpness
  brightness.value = DEFAULTS.brightness
  c1.value = DEFAULTS.colors[0]
  c2.value = DEFAULTS.colors[1]
  c3.value = DEFAULTS.colors[2]
  c4.value = DEFAULTS.colors[3]
  shape.value = DEFAULTS.shape
  size.value = DEFAULTS.size
  posX.value = DEFAULTS.posX
  posY.value = DEFAULTS.posY
  posZ.value = DEFAULTS.posZ
  rotX.value = DEFAULTS.rotX
  rotY.value = DEFAULTS.rotY
  rotZ.value = DEFAULTS.rotZ
  distortion.value = DEFAULTS.distortion
  wobble.value = DEFAULTS.wobble
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#050811] text-white">
    <!-- Custom Three.js fluid shader background -->
    <div
      ref="containerRef"
      class="absolute inset-0 z-0"
      :class="style === 'shapes' && dragRotate ? [dragging ? 'cursor-grabbing' : 'cursor-grab', 'select-none', 'touch-none'] : ''"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />

    <!-- Header (fixed so it stays visible while scrolling past the shader hero) -->
    <header class="fixed top-0 inset-x-0 z-30 backdrop-blur-md bg-[#050811]/50">
      <div class="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
        <div class="text-xl font-semibold tracking-tight">Demo Co.</div>
        <nav class="hidden md:flex items-center gap-8 text-sm">
          <a href="#" class="hover:opacity-70 transition-opacity">Platform</a>
          <a href="#" class="hover:opacity-70 transition-opacity">Company</a>
          <a href="#" class="hover:opacity-70 transition-opacity">Newsroom</a>
        </nav>
        <Button class="bg-white text-black hover:bg-white/90">Work with us</Button>
      </div>
    </header>

    <!-- Hero — wrapper at content width, text constrained inside,
         vertically centred in the viewport-sized Shade block -->
    <section class="relative z-10 max-w-6xl mx-auto px-8 min-h-screen flex flex-col justify-center pt-24 pb-16">
      <h1 class="text-5xl md:text-7xl font-medium tracking-tight leading-[1.05] max-w-4xl">
        Variante C — Custom Three.js
      </h1>
      <p class="mt-6 text-lg text-white/70 max-w-xl">
        Eigener GLSL-Fragment-Shader. Parameter über das Panel oben rechts live anpassen.
      </p>
      <div class="mt-8 flex gap-3">
        <Button class="bg-white text-black hover:bg-white/90">Discover our platform</Button>
      </div>
    </section>

    <!-- Controls panel -->
    <div class="fixed top-4 right-4 z-50">
      <button
        v-if="!showControls"
        @click="showControls = true"
        class="px-3 py-2 text-sm rounded-md bg-black/70 backdrop-blur border border-white/20 hover:bg-black/90"
      >
        ⚙ Anpassen
      </button>

      <div
        v-else
        class="w-80 p-5 rounded-lg bg-black/80 backdrop-blur border border-white/20 space-y-4 text-sm"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Shader-Anpassung</h3>
          <button
            @click="showControls = false"
            class="text-white/60 hover:text-white text-lg leading-none px-2"
            aria-label="Panel schließen"
          >×</button>
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wider text-white/60 mb-1.5">Stil</label>
          <select
            v-model="style"
            class="w-full bg-black/50 border border-white/20 rounded px-2 py-1.5 outline-none focus:border-white/50"
          >
            <option value="flow">Flow (organisch)</option>
            <option value="pulse">Pulse (radial)</option>
            <option value="waves">Waves (gerichtet)</option>
            <option value="shapes">Geometrie (3D)</option>
          </select>
        </div>

        <template v-if="style === 'shapes'">
          <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1.5">Form</label>
            <select
              v-model="shape"
              class="w-full bg-black/50 border border-white/20 rounded px-2 py-1.5 outline-none focus:border-white/50"
            >
              <option value="sphere">Kugel</option>
              <option value="cube">Würfel</option>
              <option value="torus">Torus</option>
              <option value="blob">Blob</option>
              <option value="cluster">Cluster (3 Kugeln)</option>
            </select>
          </div>

          <div>
            <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
              <span>Größe</span><span>{{ size.toFixed(2) }}</span>
            </div>
            <input v-model.number="size" type="range" min="0.2" max="2" step="0.05" class="w-full" />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Pos X</span><span>{{ posX.toFixed(1) }}</span>
              </div>
              <input v-model.number="posX" type="range" min="-2" max="2" step="0.1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Pos Y</span><span>{{ posY.toFixed(1) }}</span>
              </div>
              <input v-model.number="posY" type="range" min="-2" max="2" step="0.1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Tiefe</span><span>{{ posZ.toFixed(1) }}</span>
              </div>
              <input v-model.number="posZ" type="range" min="-3" max="3" step="0.1" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Rot X</span><span>{{ rotX.toFixed(0) }}°</span>
              </div>
              <input v-model.number="rotX" type="range" min="-180" max="180" step="1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Rot Y</span><span>{{ rotY.toFixed(0) }}°</span>
              </div>
              <input v-model.number="rotY" type="range" min="-180" max="180" step="1" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
                <span>Rot Z</span><span>{{ rotZ.toFixed(0) }}°</span>
              </div>
              <input v-model.number="rotZ" type="range" min="-180" max="180" step="1" class="w-full" />
            </div>
          </div>

          <label class="flex items-center gap-2 text-xs cursor-pointer select-none -mt-1">
            <input v-model="dragRotate" type="checkbox" class="cursor-pointer accent-white" />
            <span>Mit Maus drehen (Hintergrund ziehen)</span>
          </label>

          <div>
            <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
              <span>Verzerrung</span><span>{{ distortion.toFixed(2) }}</span>
            </div>
            <input v-model.number="distortion" type="range" min="0" max="2" step="0.05" class="w-full" />
          </div>

          <div>
            <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
              <span>Wobble-Stärke</span><span>{{ wobble.toFixed(2) }}</span>
            </div>
            <input v-model.number="wobble" type="range" min="0" max="1" step="0.05" class="w-full" />
          </div>
        </template>

        <div>
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Geschwindigkeit</span><span>{{ speed.toFixed(3) }}</span>
          </div>
          <input v-model.number="speed" type="range" min="0" max="0.15" step="0.005" class="w-full" />
        </div>

        <div v-if="style !== 'shapes'">
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Zoom</span><span>{{ scale.toFixed(2) }}</span>
          </div>
          <input v-model.number="scale" type="range" min="0.3" max="4" step="0.05" class="w-full" />
        </div>

        <div v-if="style !== 'shapes'">
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Strömung</span><span>{{ warp.toFixed(2) }}</span>
          </div>
          <input v-model.number="warp" type="range" min="0" max="3" step="0.1" class="w-full" />
        </div>

        <div>
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Schärfe</span><span>{{ sharpness.toFixed(2) }}</span>
          </div>
          <input v-model.number="sharpness" type="range" min="0" max="1" step="0.05" class="w-full" />
        </div>

        <div>
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Helligkeit</span><span>{{ brightness.toFixed(2) }}</span>
          </div>
          <input v-model.number="brightness" type="range" min="0.2" max="1.8" step="0.05" class="w-full" />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wider text-white/60 mb-1.5">Farben (dunkel → hell)</label>
          <label class="flex items-center gap-2 mb-2 text-xs cursor-pointer select-none">
            <input v-model="autoMode" type="checkbox" class="cursor-pointer accent-white" />
            <span>Auto-Harmonie aus hellster Farbe ableiten</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="c1"
              type="color"
              :disabled="autoMode"
              class="w-full h-10 rounded border border-white/20 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              v-model="c2"
              type="color"
              :disabled="autoMode"
              class="w-full h-10 rounded border border-white/20 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              v-model="c3"
              type="color"
              :disabled="autoMode"
              class="w-full h-10 rounded border border-white/20 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              v-model="c4"
              type="color"
              class="w-full h-10 rounded bg-transparent cursor-pointer transition-all"
              :class="autoMode ? 'border-2 border-white/70 ring-2 ring-white/20' : 'border border-white/20'"
            />
          </div>
        </div>

        <div class="border-t border-white/10 pt-4 space-y-2">
          <label class="block text-xs uppercase tracking-wider text-white/60">Presets</label>
          <div class="flex gap-2">
            <input
              v-model="newPresetName"
              type="text"
              placeholder="Name eingeben…"
              class="flex-1 min-w-0 bg-black/50 border border-white/20 rounded px-2 py-1.5 outline-none focus:border-white/50 text-sm"
              @keydown.enter="savePreset"
            />
            <button
              @click="savePreset"
              :disabled="presetSaving || !newPresetName.trim()"
              class="px-3 py-1.5 text-xs uppercase tracking-wider border border-white/20 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Speichern
            </button>
          </div>

          <p v-if="presetError" class="text-xs text-red-400">{{ presetError }}</p>

          <ul v-if="presets.length" class="space-y-1 max-h-48 overflow-y-auto">
            <li
              v-for="p in presets"
              :key="p.id"
              class="flex items-center gap-2 group"
            >
              <button
                @click="loadPreset(p)"
                class="flex-1 min-w-0 text-left px-2 py-1 rounded hover:bg-white/10 text-sm truncate"
                :title="p.name"
              >
                {{ p.name }}
              </button>
              <button
                @click="deletePreset(p)"
                class="text-white/40 hover:text-red-400 px-1.5 py-1 text-base leading-none"
                :aria-label="`Preset ${p.name} löschen`"
                title="Löschen"
              >×</button>
            </li>
          </ul>
          <p v-else-if="!presetError" class="text-xs text-white/40 italic">Noch keine Presets gespeichert.</p>
        </div>

        <button
          @click="reset"
          class="w-full py-1.5 text-xs uppercase tracking-wider border border-white/20 rounded hover:bg-white/10"
        >
          Auf Standard zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>
