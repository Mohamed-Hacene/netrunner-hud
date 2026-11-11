// Cyberpunk-style HUD drawn as SVG for the desktop band: angled HP segments, RAM cells, glitch text,
// over a Night City scenery that follows the time of day and reacts to events.
import type { Reading } from '../types'
import { EVENT_MS, EVENT_PHASE_MS } from './events'
import { CYAN, GREEN, MAGENTA, RED, YELLOW } from './palette'

const HP = '#5EF6E0'
const RAM = '#3E8EFF'
const DIM = '#2A2F3A'
const MUTED = '#B4BCD6'
/** A dark outline painted under a text, so it stays readable over the scenery. */
const HALO = 'paint-order="stroke" stroke="#07060F" stroke-opacity="0.85" stroke-width="3" stroke-linejoin="round"'
const FONT = "Bahnschrift, 'Rajdhani', 'Segoe UI', sans-serif"
const W = 760
const H = 46

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)
/** A SMIL begin time `ms` into an effect that started `elapsedMs` ago. */
const atMs = (ms: number, elapsedMs: number) => `${((ms - elapsedMs) / 1000).toFixed(3)}s`

/** A parallelogram leaning right, like the in-game bars. */
const cell = (x: number, y: number, w: number, h: number, fill: string, extra = '', children = '') => {
  const s = h * 0.35
  const open = `<polygon points="${x + s},${y} ${x + w + s},${y} ${x + w},${y + h} ${x},${y + h}" fill="${fill}" ${extra}`
  return children ? `${open}>${children}</polygon>` : `${open}/>`
}

const corners = (color = YELLOW) =>
  `<path d="M1 10 V1 H14" stroke="${color}" stroke-width="1.5" fill="none"/>` +
  `<path d="M${W - 1} ${H - 10} V${H - 1} H${W - 14}" stroke="${color}" stroke-width="1.5" fill="none"/>`

/** "REGEN DANS 2H14" until the 5h window resets. */
export const regenLabel = (resetsAt: string | null | undefined, now = Date.now()) => {
  const at = resetsAt ? Date.parse(resetsAt) : NaN
  if (Number.isNaN(at)) return 'LIMITE TOKENS · 5H'
  const mins = Math.ceil((at - now) / 60_000)
  if (mins <= 0) return 'REGEN IMMINENTE'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `REGEN DANS ${h}H${String(m).padStart(2, '0')}` : `REGEN DANS ${m} MIN`
}

const pulse = '<animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite"/>'

/** How long the damage glitch plays, in ms. */
export const GLITCH_MS = 600
/** How long the RAM / HP healing plays, in ms. */
export const HEAL_MS = 2500
/** How long the sweep at the end of a reply plays, in ms. */
export const SWEEP_MS = 1200

/** Effects playing over the band. Their SMIL times are shifted by the time already elapsed, so a
 * redraw midway resumes them instead of restarting them. */
export type HudFx = {
  /** Time since the last hit while the damage glitch plays, else null. */
  glitchMs?: number | null
  /** An event replacing the status text, and the time since it started. */
  event?: { id: string; phases: readonly string[]; color: string; outcome: string; elapsedMs: number } | null
  /** RAM cells or HP segments refilling, and the time since it started. */
  heal?: { kind: 'ram' | 'hp'; elapsedMs: number } | null
  /** A light bar crossing the band (end of a reply), and the time since it started. */
  sweepMs?: number | null
  /** A text in place of the status text. */
  status?: { text: string; color: string } | null
}

export const hudSvg = (r: Reading, flavor: string, hpMax: number, ramMax: number, fx: HudFx = {}) => {
  const left = r.stamina === null ? null : Math.max(0, Math.min(100, 100 - r.stamina))
  if (left !== null && left <= 0) return flatlineSvg(r, ramMax)

  const glitchMs = fx.glitchMs ?? null
  const heal = fx.heal ?? null
  const parts: string[] = [corners()]

  // ── HP: what's left of the 5h token limit ──
  const hpColor = left === null ? MUTED : left <= 20 ? RED : left <= 50 ? YELLOW : HP
  const filled = left === null ? 0 : Math.ceil((left / 100) * hpMax)
  const critical = left !== null && left <= 20

  parts.push(`<text x="10" y="25" font-family="${FONT}" font-size="14" font-weight="700" fill="${hpColor}" letter-spacing="1" ${HALO}>HP</text>`)
  const hx = 36
  const segW = 8
  const gap = 2
  parts.push(`<g filter="url(#glow)">`)
  for (let i = 0; i < hpMax; i++) {
    const x = hx + i * (segW + gap)
    if (i >= filled) parts.push(cell(x, 13, segW, 14, DIM))
    else if (heal?.kind === 'hp') {
      // refilled one segment after another, in green
      const lit = `<set attributeName="opacity" to="1" begin="${atMs(i * 70, heal.elapsedMs)}" fill="freeze"/>`
      parts.push(cell(x, 13, segW, 14, DIM) + cell(x, 13, segW, 14, GREEN, 'opacity="0"', lit))
    } else parts.push(cell(x, 13, segW, 14, hpColor))
  }
  parts.push(`</g>`)
  if (critical && heal?.kind !== 'hp') parts.push(`<g opacity="1">${pulse}<rect x="${hx - 2}" y="11" width="${hpMax * (segW + gap) + 6}" height="18" fill="none" stroke="${RED}" stroke-width="1"/></g>`)
  const hpEnd = hx + hpMax * (segW + gap) + 8
  parts.push(
    `<text x="${hpEnd}" y="27" font-family="${FONT}" fill="${heal?.kind === 'hp' ? GREEN : hpColor}" font-weight="700" ${HALO}>` +
      `<tspan font-size="20">${left === null ? '--' : Math.round(left)}</tspan>` +
      `<tspan font-size="11" fill="${MUTED}" dx="2">/100</tspan></text>`,
  )
  parts.push(`<text x="${hx}" y="41" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1.5" ${HALO}>${left === null ? 'SYNCHRO…' : regenLabel(r.resetsAt)}</text>`)

  // ── divider ──
  const dx = hpEnd + 62
  parts.push(`<line x1="${dx + 5}" y1="8" x2="${dx - 3}" y2="38" stroke="${YELLOW}" stroke-opacity="0.5" stroke-width="1"/>`)

  // ── RAM: free context window ──
  const ramColor = heal?.kind === 'ram' ? GREEN : r.hearts > 2 ? RAM : RED
  const rx = dx + 14
  parts.push(`<text x="${rx}" y="25" font-family="${FONT}" font-size="14" font-weight="700" fill="${ramColor}" letter-spacing="1" ${HALO}>RAM</text>`)
  const cx = rx + 38
  const cW = 11
  const cGap = 4
  parts.push(`<g filter="url(#glow)">`)
  for (let i = 0; i < ramMax; i++) {
    const x = cx + i * (cW + cGap)
    const empty = cell(x, 13, cW, 14, 'none', `stroke="${DIM}" stroke-width="1.2"`)
    if (i < r.hearts && heal?.kind === 'ram') {
      // refilled one cell after another, in green
      const lit = `<set attributeName="opacity" to="1" begin="${atMs(i * 140, heal.elapsedMs)}" fill="freeze"/>`
      parts.push(empty + cell(x, 13, cW, 14, GREEN, 'opacity="0"', lit))
    } else if (i < r.hearts) parts.push(cell(x, 13, cW, 14, ramColor))
    else if (i === r.burst) parts.push(cell(x, 13, cW, 14, RED, `opacity="0.9"`))
    else parts.push(empty)
  }
  parts.push(`</g>`)
  const ramEnd = cx + ramMax * (cW + cGap) + 6
  parts.push(
    `<text x="${ramEnd}" y="26" font-family="${FONT}" fill="${ramColor}" font-weight="700" ${HALO}>` +
      `<tspan font-size="16">${r.hearts}</tspan><tspan font-size="11" fill="${MUTED}" dx="1">/${ramMax}</tspan></text>`,
  )
  parts.push(`<text x="${cx}" y="41" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1.5" ${HALO}>CONTEXTE · ${fmtK(r.tokens)} / ${fmtK(r.window)}</text>`)

  // ── status text: an event, an override, or the flavor with a chromatic glitch ──
  const textAt = (text: string, color: string, extra = '', children = '') =>
    `<text x="${W - 12}" y="27" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1" fill="${color}" ${HALO} ${extra}>${esc(text)}${children}</text>`
  if (fx.event) {
    const { phases, color, outcome, elapsedMs } = fx.event
    phases.forEach((phase, i) => {
      const last = i === phases.length - 1
      const show = `<set attributeName="opacity" to="1" begin="${atMs(i * EVENT_PHASE_MS, elapsedMs)}" ${last ? 'fill="freeze"' : `dur="${EVENT_PHASE_MS / 1000}s"`}/>`
      const blink = last ? '' : `<animate attributeName="fill-opacity" values="1;0.35;1" dur="0.5s" repeatCount="indefinite"/>`
      parts.push(textAt(phase, last ? outcome : color, 'opacity="0"', show + blink))
    })
    // an outline flashing around the band while the threat lasts
    parts.push(
      `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${color}" stroke-width="1" opacity="0">` +
        `<animate attributeName="opacity" values="0;0.9;0.25;0.9;0.25;0" dur="${(2 * EVENT_PHASE_MS) / 1000}s" begin="${atMs(0, elapsedMs)}" fill="freeze"/></rect>`,
    )
  } else if (fx.status) {
    parts.push(textAt(fx.status.text, fx.status.color))
  } else {
    const fColor = r.hearts <= 2 || critical ? RED : CYAN
    parts.push(textAt(flavor, RED, 'opacity="0.55" transform="translate(1.2,0)"'))
    parts.push(textAt(flavor, fColor))
  }

  // ── a light bar crossing the band: healing (green) or the end of a reply (cyan) ──
  const sweep = heal ? { color: GREEN, elapsedMs: heal.elapsedMs, dur: 900 } : fx.sweepMs != null ? { color: CYAN, elapsedMs: fx.sweepMs, dur: 800 } : null
  if (sweep) {
    parts.push(
      `<rect x="-60" y="0" width="60" height="${H}" fill="url(#nr-sweep-${sweep.color === GREEN ? 'g' : 'c'})" opacity="0.9">` +
        `<animate attributeName="x" values="-60;${W}" dur="${sweep.dur / 1000}s" begin="${atMs(0, sweep.elapsedMs)}" fill="freeze"/></rect>`,
    )
  }

  const overlay = fx.event ? sceneryReaction(fx.event.id, fx.event.color, fx.event.elapsedMs) : ''
  const body = parts.join('\n')
  if (glitchMs === null) return svgDoc(body, '', overlay)

  // ── damage glitch: red / cyan channel split and a short jitter ──
  const begin = atMs(0, glitchMs)
  const dur = `${GLITCH_MS / 1000}s`
  const shift = (values: string) =>
    `<animate attributeName="dx" values="${values}" dur="${dur}" begin="${begin}" fill="freeze"/>`
  const chroma = `<filter id="nr-chroma" x="-5%" y="-30%" width="110%" height="160%">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    <feOffset in="r" dx="0" result="ro">${shift('6;-4;5;-2;0')}</feOffset>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
    <feOffset in="gb" dx="0" result="gbo">${shift('-6;4;-5;2;0')}</feOffset>
    <feBlend in="ro" in2="gbo" mode="screen"/>
  </filter>`
  const jitter = `<animateTransform attributeName="transform" type="translate" values="0 0;-3 1;3 -1;-2 0;2 1;0 0" dur="${dur}" begin="${begin}" fill="freeze"/>`
  return svgDoc(`<g filter="url(#nr-chroma)">${jitter}\n${body}\n</g>`, chroma, overlay)
}

// ── FLATLINE: no HP left until the 5h window resets ──
const flatlineSvg = (r: Reading, ramMax: number) => {
  const y = 30
  const parts = [
    corners(RED),
    // the trace: one last weak beat, then flat
    `<path d="M12 ${y} H70 L74 ${y - 6} L78 ${y + 4} L82 ${y} H${W - 12}" stroke="${RED}" stroke-width="1.6" fill="none" filter="url(#glow)"/>`,
    `<text x="${W / 2}" y="20" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="700" letter-spacing="4" fill="${RED}" ${HALO}>☠ FLATLINE` +
      // a slow blink: the only endless animation, and only while you have no HP left
      `<animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite"/></text>`,
    `<text x="${W / 2}" y="43" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" letter-spacing="2" fill="${MUTED}" ${HALO}>${regenLabel(r.resetsAt)} · PLUS DE TOKENS</text>`,
    `<text x="${W - 12}" y="20" text-anchor="end" font-family="${FONT}" font-size="11" font-weight="700" letter-spacing="1" fill="${r.hearts > 2 ? RAM : RED}" ${HALO}>RAM ${r.hearts}/${ramMax}</text>`,
  ]
  return svgDoc(parts.join('\n'))
}

// ── Night City scenery behind the band ──
// Its shapes are drawn once when the module loads, and each sky's markup once when first used:
// a render only joins strings. It is static; only an event playing animates a reaction over it.

export type Sky = 'night' | 'dawn' | 'day'
/** Day 10h–16h (smog), dusk 16h–19h, night 19h–7h, dawn 7h–10h; dawn and dusk share their sky. */
export const skyAt = (hour: number): Sky =>
  hour >= 10 && hour < 16 ? 'day' : (hour >= 7 && hour < 10) || (hour >= 16 && hour < 19) ? 'dawn' : 'night'

const SKIES: Record<Sky, { stops: readonly [string, string, string]; far: string; near: string; glow: string; glowOpacity: number; windows: number }> = {
  night: { stops: ['#0E0B24', '#2A0F3E', '#5E0F45'], far: '#3A2160', near: '#150C2A', glow: RED, glowOpacity: 0.35, windows: 0.8 },
  dawn: { stops: ['#1C1440', '#6A2A5E', '#D8613F'], far: '#4A2A5A', near: '#1A0F28', glow: '#FF8A3D', glowOpacity: 0.5, windows: 0.55 },
  day: { stops: ['#2C3346', '#4F5568', '#7D6F68'], far: '#5A5F70', near: '#22252F', glow: '#C9A27A', glowOpacity: 0.25, windows: 0.35 },
}

const SHAPES = (() => {
  let seed = 2077
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const far: string[] = []
  const near: string[] = []
  const windows: { x: number; y: number; isCyan: boolean }[] = []
  const antennas: string[] = []
  for (let x = 0; x < W; ) {
    const w = 10 + Math.floor(rnd() * 22)
    const h = 10 + Math.floor(rnd() * 22)
    far.push(`<rect x="${x}" y="${H - h}" width="${w}" height="${h}"/>`)
    x += w + 1
  }
  for (let x = 0; x < W; ) {
    const w = 14 + Math.floor(rnd() * 30)
    const h = 6 + Math.floor(rnd() * 16)
    near.push(`<rect x="${x}" y="${H - h}" width="${w}" height="${h}"/>`)
    for (let i = 0; i < 3; i++) {
      if (rnd() > 0.6) {
        windows.push({
          x: x + 2 + Math.floor(rnd() * Math.max(1, w - 4)),
          y: H - h + 2 + Math.floor(rnd() * Math.max(1, h - 4)),
          isCyan: rnd() > 0.5,
        })
      }
    }
    if (rnd() > 0.85) antennas.push(`<rect x="${x + w / 2}" y="${H - h - 5}" width="1" height="5"/>`)
    x += w + Math.floor(rnd() * 4)
  }
  // acid rain: streaks over twice the band's height, scrolled down while it rains
  const rain: string[] = []
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * (W + 40)) - 20
    const y = Math.floor(rnd() * 2 * H)
    rain.push(`<line x1="${x}" y1="${y}" x2="${x - 2}" y2="${y + 7}"/>`)
  }
  const windowRects = (fill: (w: { isCyan: boolean }) => string) =>
    windows.map(w => `<rect x="${w.x}" y="${w.y}" width="1.5" height="2" fill="${fill(w)}"/>`).join('')
  return {
    far: far.join(''),
    near: near.join(''),
    antennas: antennas.join(''),
    windowRects,
    rain: rain.join(''),
  }
})()

const SCENERY_DEFS = `<linearGradient id="nr-haze" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#05050C" stop-opacity="0.2"/>
    <stop offset="0.5" stop-color="#05050C" stop-opacity="0.05"/>
    <stop offset="1" stop-color="#05050C" stop-opacity="0.2"/>
  </linearGradient>
  <linearGradient id="nr-fade-x" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000"/>
    <stop offset="0.1" stop-color="#fff"/>
    <stop offset="0.9" stop-color="#fff"/>
    <stop offset="1" stop-color="#000"/>
  </linearGradient>
  <linearGradient id="nr-fade-y" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000"/>
    <stop offset="0.45" stop-color="#fff"/>
    <stop offset="1" stop-color="#fff"/>
  </linearGradient>
  <mask id="nr-mask-x" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#nr-fade-x)"/>
  </mask>
  <mask id="nr-mask-y" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#nr-fade-y)"/>
  </mask>
  <pattern id="nr-lines" width="3" height="3" patternUnits="userSpaceOnUse">
    <rect width="3" height="1" fill="#000" opacity="0.15"/>
  </pattern>
  <linearGradient id="nr-sweep-c" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${CYAN}" stop-opacity="0"/>
    <stop offset="0.8" stop-color="${CYAN}" stop-opacity="0.35"/>
    <stop offset="1" stop-color="${CYAN}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="nr-sweep-g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${GREEN}" stop-opacity="0"/>
    <stop offset="0.8" stop-color="${GREEN}" stop-opacity="0.4"/>
    <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
  </linearGradient>`

const skyCache = new Map<Sky, { defs: string; body: string }>()
const scenery = (sky: Sky) => {
  const cached = skyCache.get(sky)
  if (cached) return cached
  const s = SKIES[sky]
  const built = {
    defs: `<linearGradient id="nr-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${s.stops[0]}"/>
    <stop offset="0.6" stop-color="${s.stops[1]}"/>
    <stop offset="1" stop-color="${s.stops[2]}"/>
  </linearGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#nr-sky)"/>
<circle cx="${W * 0.62}" cy="${H + 4}" r="24" fill="${s.glow}" opacity="${s.glowOpacity}"/>
<g fill="${s.far}" opacity="0.85">${SHAPES.far}</g>
<line x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}" stroke="#FF2A6D" stroke-opacity="0.8"/>
<g fill="${s.near}">${SHAPES.near}</g>
<g opacity="${s.windows}">${SHAPES.windowRects(w => (w.isCyan ? CYAN : YELLOW))}</g>
<g fill="${RED}" opacity="0.9">${SHAPES.antennas}</g>`,
  }
  skyCache.set(sky, built)
  return built
}

/** How the city reacts to an event playing: a few elements animated for the event's length only. */
const sceneryReaction = (id: string, color: string, elapsedMs: number) => {
  const begin = atMs(0, elapsedMs)
  const dur = `${EVENT_MS / 1000}s`
  if (id === 'intrusion' || id === 'breach' || id === 'daemon') {
    // the city's windows turn red, a red tint over it
    return (
      `<g opacity="0"><animate attributeName="opacity" values="0;1;0.6;1;0" dur="${dur}" begin="${begin}" fill="freeze"/>` +
      `<rect width="${W}" height="${H}" fill="${RED}" opacity="0.14"/>${SHAPES.windowRects(() => RED)}</g>`
    )
  }
  if (id === 'netwatch') {
    // a searchlight beam sweeping the skyline
    const bx = W * 0.62
    return (
      `<polygon points="${bx},${H} ${bx - 30},0 ${bx + 30},0" fill="${YELLOW}" opacity="0">` +
      `<animate attributeName="opacity" values="0;0.22;0.22;0" dur="${dur}" begin="${begin}" fill="freeze"/>` +
      `<animateTransform attributeName="transform" type="rotate" values="-40 ${bx} ${H};40 ${bx} ${H};-40 ${bx} ${H}" dur="3s" begin="${begin}" repeatCount="2" fill="freeze"/></polygon>`
    )
  }
  if (id === 'surge') {
    // the windows flicker with the power
    return (
      `<g opacity="0">${SHAPES.windowRects(() => YELLOW)}` +
      `<animate attributeName="opacity" values="0;1;0;1;0;0.8;0;1;0" dur="1s" begin="${begin}" repeatCount="4" fill="freeze"/></g>`
    )
  }
  if (id === 'acid-rain') {
    // green streaks falling, for the event's length
    return (
      `<g stroke="#9CFF6B" stroke-width="0.8" opacity="0">` +
      `<animate attributeName="opacity" values="0;0.55;0.55;0" keyTimes="0;0.1;0.85;1" dur="${dur}" begin="${begin}" fill="freeze"/>` +
      `<g>${SHAPES.rain}<animateTransform attributeName="transform" type="translate" values="0 ${-H};8 0" dur="0.45s" begin="${begin}" repeatDur="${dur}"/></g></g>`
    )
  }
  if (color === MAGENTA) {
    // legendary: the whole city glows magenta
    return (
      `<g opacity="0"><animate attributeName="opacity" values="0;1;0.7;1;0" dur="${dur}" begin="${begin}" fill="freeze"/>` +
      `<rect width="${W}" height="${H}" fill="${MAGENTA}" opacity="0.16"/>${SHAPES.windowRects(() => MAGENTA)}</g>`
    )
  }
  return ''
}

/** A whole band document: the current sky's scenery (with `overlay` over it), then `body`. */
const svgDoc = (body: string, defs = '', overlay = '') => {
  const sky = scenery(skyAt(new Date().getHours()))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="glow" x="-10%" y="-50%" width="120%" height="200%">
    <feGaussianBlur stdDeviation="1.6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${SCENERY_DEFS}
  ${sky.defs}
  ${defs}
</defs>
<g mask="url(#nr-mask-x)"><g mask="url(#nr-mask-y)">
${sky.body}
${overlay}
<rect width="${W}" height="${H}" fill="url(#nr-haze)"/>
<rect width="${W}" height="${H}" fill="url(#nr-lines)"/>
</g></g>
${body}
</svg>`
}

// ── Boot sequence shown in the band when a session starts ──

/** How long the boot sequence lasts, in ms. */
export const BOOT_MS = 3200
/** The boot steps, one after another; "JACK IN" follows the last. */
export const BOOT_STEPS = ['KIROSHI OS v2.0.77', 'SYNCHRO NEURALE', 'PARE-FEU ICE', 'CONNEXION AU NET']
/** Time given to each step (the last slot is the JACK IN flash), in ms. */
export const BOOT_STEP_MS = BOOT_MS / (BOOT_STEPS.length + 1)

/**
 * The boot sequence as a self-animating SVG.
 * @param elapsedMs time since the boot started; SMIL times are shifted by it so a redraw resumes it.
 */
export const bootSvg = (elapsedMs: number, cells = 20) => {
  const at = (ms: number) => atMs(ms, elapsedMs)
  const stepS = `${BOOT_STEP_MS / 1000}s`
  const parts: string[] = [corners()]

  // one step at a time: "> LABEL ...... OK"
  BOOT_STEPS.forEach((label, i) => {
    const start = i * BOOT_STEP_MS
    parts.push(
      `<text x="12" y="28" font-family="${FONT}" font-size="14" font-weight="600" letter-spacing="1.5" fill="${CYAN}" opacity="0">` +
        `&gt; ${esc(label)} <tspan fill="${MUTED}">${'.'.repeat(Math.max(3, 24 - label.length))}</tspan>` +
        `<tspan fill="${HP}" dx="6" opacity="0">OK<set attributeName="opacity" to="1" begin="${at(start + BOOT_STEP_MS * 0.55)}" dur="${(BOOT_STEP_MS * 0.45) / 1000}s"/></tspan>` +
        `<set attributeName="opacity" to="1" begin="${at(start)}" dur="${stepS}"/></text>`,
    )
  })
  parts.push(
    `<text x="12" y="29" font-family="${FONT}" font-size="18" font-weight="700" letter-spacing="4" fill="${YELLOW}" opacity="0" filter="url(#glow)">◢ JACK IN ◣` +
      `<set attributeName="opacity" to="1" begin="${at(BOOT_STEPS.length * BOOT_STEP_MS)}" fill="freeze"/>` +
      `<animate attributeName="fill-opacity" values="1;0.3;1;0.6;1" dur="0.4s" begin="${at(BOOT_STEPS.length * BOOT_STEP_MS)}" fill="freeze"/></text>`,
  )

  // progress bar filling over the whole boot
  const px = 400
  const segW = 12
  const gap = 3
  parts.push(`<text x="${px}" y="41" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1.5" ${HALO}>CONNEXION NEURALE</text>`)
  parts.push(`<g filter="url(#glow)">`)
  for (let i = 0; i < cells; i++) {
    const x = px + i * (segW + gap)
    const lit = `<set attributeName="opacity" to="1" begin="${at(((i + 1) / cells) * BOOT_MS * 0.95)}" fill="freeze"/>`
    parts.push(cell(x, 13, segW, 14, CYAN, 'opacity="0.12"', lit))
  }
  parts.push(`</g>`)

  // a scanline sweeping across the band
  parts.push(
    `<rect x="0" y="0" width="2" height="${H}" fill="${CYAN}" opacity="0.35">` +
      `<animate attributeName="x" values="0;${W}" dur="1.1s" begin="${at(0)}" repeatCount="indefinite"/></rect>`,
  )

  return svgDoc(parts.join('\n'))
}

// ── Welcome message shown after the boot sequence ──

/** How long the welcome message stays, in ms. */
export const WELCOME_MS = 3000
/** One is picked at random each session: a title and a line under it. */
export const WELCOMES: readonly (readonly [string, string])[] = [
  ['BIENVENUE À NIGHT CITY, CHOOM', 'LIAISON NEURALE ÉTABLIE · BONNE CHASSE SUR LE NET'],
  ['CONNEXION ÉTABLIE', 'LE NET T’ATTENDAIT, NETRUNNER'],
  ['JACK IN RÉUSSI', 'TOUS LES SYSTÈMES AU VERT · ICE EN VEILLE'],
  ['DE RETOUR SUR LE NET', 'CYBERDECK CHAUD · QUICKHACKS CHARGÉS'],
  ['LA NUIT EST JEUNE, CHOOM', 'NIGHT CITY NE DORT JAMAIS · TOI NON PLUS'],
]

/**
 * The welcome message as a self-animating SVG: typed in, held, faded out.
 * @param elapsedMs time since it started; SMIL times are shifted by it so a redraw resumes it.
 */
export const welcomeSvg = (elapsedMs: number, title: string, subtitle: string) => {
  const begin = atMs(0, elapsedMs)
  const parts: string[] = [corners()]
  parts.push(
    `<g clip-path="url(#nr-type)" opacity="0">` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.85;1" dur="${WELCOME_MS / 1000}s" begin="${begin}" fill="freeze"/>` +
      `<text x="${W / 2}" y="24" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="700" letter-spacing="3" fill="${YELLOW}" filter="url(#glow)">${esc(title)}</text>` +
      `<text x="${W / 2}" y="39" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" letter-spacing="2" fill="${CYAN}" ${HALO}>${esc(subtitle)}</text>` +
      `</g>`,
  )
  // the text is typed in from the left
  const clip = `<clipPath id="nr-type"><rect x="0" y="0" width="0" height="${H}">` +
    `<animate attributeName="width" values="0;${W}" dur="0.7s" begin="${begin}" fill="freeze"/></rect></clipPath>`
  return svgDoc(parts.join('\n'), clip)
}
