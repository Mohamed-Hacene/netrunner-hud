// Cyberpunk-style HUD drawn as SVG for the desktop band: angled HP segments, RAM cells, glitch text.
import type { Reading } from '../types'

const YELLOW = '#FCEE0A'
const RED = '#FF003C'
const CYAN = '#00F0FF'
const HP = '#5EF6E0'
const RAM = '#3E8EFF'
const DIM = '#2A2F3A'
const MUTED = '#6B7280'
const FONT = "Bahnschrift, 'Rajdhani', 'Segoe UI', sans-serif"

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

/** A parallelogram leaning right, like the in-game bars. */
const cell = (x: number, y: number, w: number, h: number, fill: string, extra = '') => {
  const s = h * 0.35
  return `<polygon points="${x + s},${y} ${x + w + s},${y} ${x + w},${y + h} ${x},${y + h}" fill="${fill}" ${extra}/>`
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

export const hudSvg = (r: Reading, flavor: string, hpMax: number, ramMax: number) => {
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
    parts.push(i < filled ? cell(x, 13, segW, 14, hpColor, critical ? '' : '') : cell(x, 13, segW, 14, DIM))
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

  // ── flavor text with chromatic glitch ──
  const f = esc(flavor)
  const fColor = r.hearts <= 2 || critical ? RED : CYAN
  parts.push(`<text x="${W - 12}" y="27" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1" fill="${RED}" opacity="0.55" transform="translate(1.2,0)">${f}</text>`)
  parts.push(`<text x="${W - 12}" y="27" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1" fill="${fColor}">${f}</text>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="glow" x="-10%" y="-50%" width="120%" height="200%">
    <feGaussianBlur stdDeviation="1.6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
${parts.join('\n')}
</svg>`
}
