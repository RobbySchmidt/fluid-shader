<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import * as THREE from 'three'

type StyleKey = 'flow' | 'pulse' | 'waves'
const STYLE_MAP: Record<StyleKey, number> = { flow: 0, pulse: 1, waves: 2 }

const DEFAULTS = {
  style: 'flow' as StyleKey,
  speed: 0.025,
  scale: 1.8,
  warp: 1.2,
  sharpness: 0.55,
  brightness: 1.0,
  colors: ['#050811', '#0c2440', '#1d4a5e', '#3b8a98'] as const,
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

type PresetSettings = {
  style: StyleKey
  speed: number
  scale: number
  warp: number
  sharpness: number
  brightness: number
  colors: [string, string, string, string]
  autoMode: boolean
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
  autoMode.value = s.autoMode
}

async function deletePreset(p: Preset) {
  if (!confirm(`Preset „${p.name}" löschen?`)) return
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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  p /= u_scale;
  float t = u_time * u_speed;

  float n;
  if (u_style == 0) {
    // Flow — domain-warped fbm (organic flow)
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(3.2, 1.3)));
    vec2 r = vec2(fbm(p + u_warp * q + vec2(0.9 + t * 0.6, 4.1)),
                  fbm(p + u_warp * q + vec2(3.7, 1.4)));
    n = fbm(p + u_warp * r);
  } else if (u_style == 1) {
    // Pulse — radial breathing
    float radius = length(p);
    float pulse = sin(t * 3.5) * 0.25;
    vec2 q = vec2(fbm(p * 1.3 + pulse), fbm(p * 1.3 - vec2(0.0, t)));
    n = fbm(p * 1.3 + u_warp * q + radius * 0.4);
  } else {
    // Waves — directional layered flow
    vec2 flow = vec2(t * 1.5, sin(t * 0.7) * 0.3);
    vec2 q = vec2(fbm(p + flow), fbm(p * 1.3 + flow.yx));
    n = fbm(p + u_warp * q) + sin(p.y * 2.5 + t * 1.5) * 0.15;
  }

  // Screen-space film grain — adds high-frequency detail without animating with the warp
  float grain = snoise(gl_FragCoord.xy * 0.55 + u_time * 30.0) * 0.12 * u_sharpness;
  n += grain;

  // Color band tightness scales with sharpness — sharper = harder edges
  float bw = mix(0.45, 0.10, u_sharpness);

  // Brightness as a threshold shift: shifts which colors dominate the image without
  // touching their intensity. Higher brightness → more of c3/c4 visible (lighter
  // areas grow). Lower brightness → more of c1/c2 visible. Saturation stays intact.
  float bShift = (1.0 - u_brightness) * 0.5;

  vec3 col = mix(u_c1, u_c2, smoothstep(-0.55 + bShift, -0.55 + bw + bShift, n));
  col = mix(col, u_c3, smoothstep(-0.10 + bShift, -0.10 + bw + bShift, n));
  col = mix(col, u_c4, smoothstep( 0.35 + bShift,  0.35 + bw + bShift, n) * 0.75);

  // Subtle vignette
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
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#050811] text-white">
    <!-- Custom Three.js fluid shader background -->
    <div ref="containerRef" class="absolute inset-0 z-0" />

    <!-- Header -->
    <header class="relative z-10 flex items-center justify-between px-8 pt-8 pb-6">
      <div class="text-xl font-semibold tracking-tight">Demo Co.</div>
      <nav class="hidden md:flex items-center gap-8 text-sm">
        <a href="#" class="hover:opacity-70 transition-opacity">Platform</a>
        <a href="#" class="hover:opacity-70 transition-opacity">Company</a>
        <a href="#" class="hover:opacity-70 transition-opacity">Newsroom</a>
      </nav>
      <Button class="bg-white text-black hover:bg-white/90">Work with us</Button>
    </header>

    <!-- Hero -->
    <section class="relative z-10 px-8 pt-24 pb-32 max-w-4xl">
      <h1 class="text-5xl md:text-7xl font-medium tracking-tight leading-[1.05]">
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
          </select>
        </div>

        <div>
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Geschwindigkeit</span><span>{{ speed.toFixed(3) }}</span>
          </div>
          <input v-model.number="speed" type="range" min="0" max="0.15" step="0.005" class="w-full" />
        </div>

        <div>
          <div class="flex justify-between text-xs uppercase tracking-wider text-white/60 mb-1.5">
            <span>Zoom</span><span>{{ scale.toFixed(2) }}</span>
          </div>
          <input v-model.number="scale" type="range" min="0.3" max="4" step="0.05" class="w-full" />
        </div>

        <div>
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
