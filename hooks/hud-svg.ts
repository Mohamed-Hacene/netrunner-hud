// Cyberpunk-style HUD drawn as SVG for the desktop band: angled HP segments, RAM cells, glitch text.
import type { Reading } from '../types'
import { EVENT_PHASE_MS } from './events'
import { CYAN, RED, YELLOW } from './palette'

const HP = '#5EF6E0'
const RAM = '#3E8EFF'
const DIM = '#2A2F3A'
const MUTED = '#6B7280'
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

  parts.push(`<text x="10" y="25" font-family="${FONT}" font-size="14" font-weight="700" fill="${hpColor}" letter-spacing="1">HP</text>`)
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
    `<text x="${hpEnd}" y="27" font-family="${FONT}" fill="${hpColor}" font-weight="700">` +
      `<tspan font-size="20">${left === null ? '--' : Math.round(left)}</tspan>` +
      `<tspan font-size="11" fill="${MUTED}" dx="2">/100</tspan></text>`,
  )
  parts.push(`<text x="${hx}" y="41" font-family="${FONT}" font-size="9" fill="${MUTED}" letter-spacing="1.5">${left === null ? 'SYNCHRO…' : regenLabel(r.resetsAt)}</text>`)

  // ── divider ──
  const dx = hpEnd + 62
  parts.push(`<line x1="${dx + 5}" y1="8" x2="${dx - 3}" y2="38" stroke="${YELLOW}" stroke-opacity="0.5" stroke-width="1"/>`)

  // ── RAM: free context window ──
  const ramColor = r.hearts > 2 ? RAM : RED
  const rx = dx + 14
  parts.push(`<text x="${rx}" y="25" font-family="${FONT}" font-size="14" font-weight="700" fill="${ramColor}" letter-spacing="1">RAM</text>`)
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
    `<text x="${ramEnd}" y="26" font-family="${FONT}" fill="${ramColor}" font-weight="700">` +
      `<tspan font-size="16">${r.hearts}</tspan><tspan font-size="11" fill="${MUTED}" dx="1">/${ramMax}</tspan></text>`,
  )
  parts.push(`<text x="${cx}" y="41" font-family="${FONT}" font-size="9" fill="${MUTED}" letter-spacing="1.5">CONTEXTE · ${fmtK(r.tokens)} / ${fmtK(r.window)}</text>`)

  // ── flavor text with chromatic glitch, or the random event playing ──
  const textAt = (text: string, color: string, extra = '', children = '') =>
    `<text x="${W - 12}" y="27" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1" fill="${color}" ${extra}>${esc(text)}${children}</text>`
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

const svgDoc = (W: number, H: number, body: string, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="glow" x="-10%" y="-50%" width="120%" height="200%">
    <feGaussianBlur stdDeviation="1.6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${defs}
</defs>
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
  parts.push(`<text x="${px}" y="41" font-family="${FONT}" font-size="9" fill="${MUTED}" letter-spacing="1.5">CONNEXION NEURALE</text>`)
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
