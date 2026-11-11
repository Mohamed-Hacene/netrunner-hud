// Cyberpunk-style HUD drawn as SVG for the desktop band: angled HP segments, RAM cells, glitch text.
import type { Reading } from '../types'
import { EVENT_PHASE_MS } from './events'
import { CYAN, RED, YELLOW } from './palette'

const HP = '#5EF6E0'
const RAM = '#3E8EFF'
const DIM = '#2A2F3A'
const MUTED = '#B4BCD6'
/** A dark outline painted under a text, so it stays readable over the scenery. */
const HALO = 'paint-order="stroke" stroke="#07060F" stroke-opacity="0.85" stroke-width="3" stroke-linejoin="round"'
const FONT = "Bahnschrift, 'Rajdhani', 'Segoe UI', sans-serif"

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

/** A parallelogram leaning right, like the in-game bars. */
const cell = (x: number, y: number, w: number, h: number, fill: string, extra = '', children = '') => {
  const s = h * 0.35
  const open = `<polygon points="${x + s},${y} ${x + w + s},${y} ${x + w},${y + h} ${x},${y + h}" fill="${fill}" ${extra}`
  return children ? `${open}>${children}</polygon>` : `${open}/>`
}

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

const pulse ='<animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite"/>'

/** How long the damage glitch plays, in ms. */
export const GLITCH_MS = 600

/** Effects playing over the band. Their SMIL times are shifted by the time already elapsed, so a
 * redraw midway resumes them instead of restarting them. */
export type HudFx = {
  /** Time since the last hit while the damage glitch plays, else null. */
  glitchMs?: number | null
  /** A random event replacing the status text, and the time since it started. */
  event?: { phases: readonly string[]; color: string; elapsedMs: number } | null
}

export const hudSvg = (r: Reading, flavor: string, hpMax: number, ramMax: number, fx: HudFx = {}) => {
  const glitchMs = fx.glitchMs ?? null
  const W = 760
  const H = 46
  const parts: string[] = []

  // ── frame accents ──
  parts.push(`<path d="M1 10 V1 H14" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)
  parts.push(`<path d="M${W - 1} ${H - 10} V${H - 1} H${W - 14}" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)

  // ── HP: what's left of the 5h token limit ──
  const left = r.stamina === null ? null : Math.max(0, Math.min(100, 100 - r.stamina))
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
    parts.push(i < filled ? cell(x, 13, segW, 14, hpColor) : cell(x, 13, segW, 14, DIM))
  }
  parts.push(`</g>`)
  if (critical) parts.push(`<g opacity="1">${pulse}<rect x="${hx - 2}" y="11" width="${hpMax * (segW + gap) + 6}" height="18" fill="none" stroke="${RED}" stroke-width="1"/></g>`)
  const hpEnd = hx + hpMax * (segW + gap) + 8
  parts.push(
    `<text x="${hpEnd}" y="27" font-family="${FONT}" fill="${hpColor}" font-weight="700" ${HALO}>` +
      `<tspan font-size="20">${left === null ? '--' : Math.round(left)}</tspan>` +
      `<tspan font-size="11" fill="${MUTED}" dx="2">/100</tspan></text>`,
  )
  parts.push(`<text x="${hx}" y="41" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1.5" ${HALO}>${left === null ? 'SYNCHRO…' : regenLabel(r.resetsAt)}</text>`)

  // ── divider ──
  const dx = hpEnd + 62
  parts.push(`<line x1="${dx + 5}" y1="8" x2="${dx - 3}" y2="38" stroke="${YELLOW}" stroke-opacity="0.5" stroke-width="1"/>`)

  // ── RAM: free context window ──
  const ramColor = r.hearts > 2 ? RAM : RED
  const rx = dx + 14
  parts.push(`<text x="${rx}" y="25" font-family="${FONT}" font-size="14" font-weight="700" fill="${ramColor}" letter-spacing="1" ${HALO}>RAM</text>`)
  const cx = rx + 38
  const cW = 11
  const cGap = 4
  parts.push(`<g filter="url(#glow)">`)
  for (let i = 0; i < ramMax; i++) {
    const x = cx + i * (cW + cGap)
    if (i < r.hearts) parts.push(cell(x, 13, cW, 14, ramColor))
    else if (i === r.burst) parts.push(cell(x, 13, cW, 14, RED, `opacity="0.9"`))
    else parts.push(cell(x, 13, cW, 14, 'none', `stroke="${DIM}" stroke-width="1.2"`))
  }
  parts.push(`</g>`)
  const ramEnd = cx + ramMax * (cW + cGap) + 6
  parts.push(
    `<text x="${ramEnd}" y="26" font-family="${FONT}" fill="${ramColor}" font-weight="700" ${HALO}>` +
      `<tspan font-size="16">${r.hearts}</tspan><tspan font-size="11" fill="${MUTED}" dx="1">/${ramMax}</tspan></text>`,
  )
  parts.push(`<text x="${cx}" y="41" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1.5" ${HALO}>CONTEXTE · ${fmtK(r.tokens)} / ${fmtK(r.window)}</text>`)

  // ── flavor text with chromatic glitch, or the random event playing ──
  const textAt = (text: string, color: string, extra = '', children = '') =>
    `<text x="${W - 12}" y="27" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1" fill="${color}" ${HALO} ${extra}>${esc(text)}${children}</text>`
  if (fx.event) {
    const { phases, color, elapsedMs } = fx.event
    const at = (ms: number) => `${((ms - elapsedMs) / 1000).toFixed(3)}s`
    phases.forEach((phase, i) => {
      const last = i === phases.length - 1
      const show = `<set attributeName="opacity" to="1" begin="${at(i * EVENT_PHASE_MS)}" ${last ? 'fill="freeze"' : `dur="${EVENT_PHASE_MS / 1000}s"`}/>`
      const blink = last ? '' : `<animate attributeName="fill-opacity" values="1;0.35;1" dur="0.5s" repeatCount="indefinite"/>`
      parts.push(textAt(phase, last ? CYAN : color, 'opacity="0"', show + blink))
    })
    // an outline flashing around the band while the threat lasts
    parts.push(
      `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${color}" stroke-width="1" opacity="0">` +
        `<animate attributeName="opacity" values="0;0.9;0.25;0.9;0.25;0" dur="${(2 * EVENT_PHASE_MS) / 1000}s" begin="${at(0)}" fill="freeze"/></rect>`,
    )
  } else {
    const fColor = r.hearts <= 2 || critical ? RED : CYAN
    parts.push(textAt(flavor, RED, 'opacity="0.55" transform="translate(1.2,0)"'))
    parts.push(textAt(flavor, fColor))
  }

  const body = parts.join('\n')
  if (glitchMs === null) return svgDoc(W, H, body)

  // ── damage glitch: red / cyan channel split and a short jitter ──
  const begin = `${(-glitchMs / 1000).toFixed(3)}s`
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
  return svgDoc(W, H, `<g filter="url(#nr-chroma)">${jitter}\n${body}\n</g>`, chroma)
}

// ── Night City scenery behind the band ──
// Built once when the module loads and static: no animation runs while the band is on screen.
const SCENERY = ((W: number, H: number) => {
  let seed = 2077
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const far: string[] = []
  const near: string[] = []
  // far skyline, faint
  for (let x = 0; x < W; ) {
    const w = 10 + Math.floor(rnd() * 22)
    const h = 10 + Math.floor(rnd() * 22)
    far.push(`<rect x="${x}" y="${H - h}" width="${w}" height="${h}"/>`)
    x += w + 1
  }
  // near skyline with a few lit windows and antenna lights
  for (let x = 0; x < W; ) {
    const w = 14 + Math.floor(rnd() * 30)
    const h = 6 + Math.floor(rnd() * 16)
    near.push(`<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="#150C2A"/>`)
    for (let i = 0; i < 3; i++) {
      if (rnd() > 0.6) {
        const wx = x + 2 + Math.floor(rnd() * Math.max(1, w - 4))
        const wy = H - h + 2 + Math.floor(rnd() * Math.max(1, h - 4))
        near.push(`<rect x="${wx}" y="${wy}" width="1.5" height="2" fill="${rnd() > 0.5 ? CYAN : YELLOW}" opacity="0.8"/>`)
      }
    }
    if (rnd() > 0.85) near.push(`<rect x="${x + w / 2}" y="${H - h - 5}" width="1" height="5" fill="${RED}" opacity="0.9"/>`)
    x += w + Math.floor(rnd() * 4)
  }
  return {
    defs: `<linearGradient id="nr-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0E0B24"/>
    <stop offset="0.6" stop-color="#2A0F3E"/>
    <stop offset="1" stop-color="#5E0F45"/>
  </linearGradient>
  <linearGradient id="nr-haze" x1="0" y1="0" x2="1" y2="0">
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
  </pattern>`,
    body: `<g mask="url(#nr-mask-x)"><g mask="url(#nr-mask-y)">
<rect width="${W}" height="${H}" fill="url(#nr-sky)"/>
<circle cx="${W * 0.62}" cy="${H + 4}" r="24" fill="${RED}" opacity="0.35"/>
<g fill="#3A2160" opacity="0.85">${far.join('')}</g>
<line x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}" stroke="#FF2A6D" stroke-opacity="0.8"/>
<g>${near.join('')}</g>
<rect width="${W}" height="${H}" fill="url(#nr-haze)"/>
<rect width="${W}" height="${H}" fill="url(#nr-lines)"/>
</g></g>`,
  }
})(760, 46)

const svgDoc = (W: number, H: number, body: string, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="glow" x="-10%" y="-50%" width="120%" height="200%">
    <feGaussianBlur stdDeviation="1.6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${SCENERY.defs}
  ${defs}
</defs>
${SCENERY.body}
${body}
</svg>`

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
  const W = 760
  const H = 46
  const at = (ms: number) => `${((ms - elapsedMs) / 1000).toFixed(3)}s`
  const stepS = `${BOOT_STEP_MS / 1000}s`
  const parts: string[] = []

  parts.push(`<path d="M1 10 V1 H14" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)
  parts.push(`<path d="M${W - 1} ${H - 10} V${H - 1} H${W - 14}" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)

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

  return svgDoc(W, H, parts.join('\n'))
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
  const W = 760
  const H = 46
  const begin = `${(-elapsedMs / 1000).toFixed(3)}s`
  const parts: string[] = []
  parts.push(`<path d="M1 10 V1 H14" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)
  parts.push(`<path d="M${W - 1} ${H - 10} V${H - 1} H${W - 14}" stroke="${YELLOW}" stroke-width="1.5" fill="none"/>`)
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
  return svgDoc(W, H, parts.join('\n'), clip)
}
