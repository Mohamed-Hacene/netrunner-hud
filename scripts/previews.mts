// Regenerates the preview images in docs/ from the mod's own drawing code.
//
//   npx tsx scripts/previews.mts
//
// Each preview is a still frame: the SVG's SMIL animations are evaluated at the moment chosen
// below and then removed, so a viewer sees that moment (an event mid-way, the RAM refilling)
// instead of an animation that played once before anyone looked at it.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Reading } from '../types/index.d.ts'

// The hooks are TypeScript modules without a package.json: load them whichever way tsx exposes them.
const load = async (path: string) => {
  const mod: any = await import(path)
  return mod.default && !mod.hudSvg && !mod.EVENTS ? mod.default : mod
}
const svg = await load('../hooks/hud-svg.ts')
const ev = await load('../hooks/events.ts')
const i18n = await load('../hooks/i18n.ts')

const DOCS = fileURLToPath(new URL('../docs/', import.meta.url))
const MIN = 60_000

// ── State shown in the previews ──
const healthy: Reading = {
  hearts: 7,
  percent: 32,
  tokens: 64_000,
  window: 200_000,
  burst: null,
  stamina: 28,
  resetsAt: new Date(Date.now() + 134 * MIN - 30_000).toISOString(), // "REGEN DANS 2H14"
  hitAt: null,
}
const critical: Reading = { ...healthy, hearts: 2, percent: 84, tokens: 168_000, burst: 2, stamina: 86 }

// ── Still frames: evaluate SMIL at the moment the document starts, then drop it ──
type Node = { tag: string; attrs: Map<string, string>; children: (Node | string)[] }

const parse = (source: string): Node => {
  const root: Node = { tag: '#root', attrs: new Map(), children: [] }
  const stack = [root]
  for (const token of source.match(/<[^>]+>|[^<]+/g) ?? []) {
    const top = stack[stack.length - 1]!
    if (!token.startsWith('<')) top.children.push(token)
    else if (token.startsWith('</')) stack.pop()
    else {
      const [, tag = ''] = token.match(/^<([\w:-]+)/) ?? []
      const attrs = new Map([...token.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1]!, m[2]!] as const))
      const node: Node = { tag, attrs, children: [] }
      top.children.push(node)
      if (!token.endsWith('/>')) stack.push(node)
    }
  }
  return root
}

const serialize = (node: Node | string): string => {
  if (typeof node === 'string') return node
  if (node.tag === '#root') return node.children.map(serialize).join('')
  const attrs = [...node.attrs].map(([k, v]) => ` ${k}="${v}"`).join('')
  return node.children.length === 0 ? `<${node.tag}${attrs}/>` : `<${node.tag}${attrs}>${node.children.map(serialize).join('')}</${node.tag}>`
}

const seconds = (v: string | undefined) => (v === undefined ? undefined : Number.parseFloat(v))
const numbers = (v: string) => v.trim().split(/[\s,]+/).map(Number)

/** The value an animation element gives its attribute at the document's start, or undefined. */
const valueAtStart = (anim: Node): string | undefined => {
  const a = anim.attrs
  const t = -(seconds(a.get('begin')) ?? 0)
  if (t < 0) return undefined
  if (anim.tag === 'set') {
    const dur = seconds(a.get('dur'))
    return dur === undefined || t < dur ? a.get('to') : undefined
  }
  const dur = seconds(a.get('dur')) ?? 0
  const values = (a.get('values') ?? '').split(';')
  const count = a.get('repeatCount')
  const active =
    count === 'indefinite' ? Infinity : seconds(a.get('repeatDur')) ?? (count ? Number(count) * dur : dur)
  if (t >= active) return a.get('fill') === 'freeze' ? values[values.length - 1] : undefined
  const p = (t % dur) / dur
  const times = a.has('keyTimes') ? a.get('keyTimes')!.split(';').map(Number) : values.map((_, i) => i / (values.length - 1))
  let i = times.findIndex((k, j) => p >= k && p <= (times[j + 1] ?? 1))
  if (i < 0 || i >= values.length - 1) return values[values.length - 1]
  const span = (times[i + 1] ?? 1) - times[i]!
  const f = span === 0 ? 0 : (p - times[i]!) / span
  const from = numbers(values[i]!)
  const to = numbers(values[i + 1]!)
  return from.map((x, k) => +(x + ((to[k] ?? x) - x) * f).toFixed(3)).join(' ')
}

const freeze = (node: Node) => {
  for (const child of [...node.children]) {
    if (typeof child === 'string') continue
    if (child.tag === 'set' || child.tag === 'animate' || child.tag === 'animateTransform') {
      const value = valueAtStart(child)
      const name = child.attrs.get('attributeName')!
      if (value !== undefined) {
        node.attrs.set(name, child.tag === 'animateTransform' ? `${child.attrs.get('type')}(${value})` : value)
      }
      node.children.splice(node.children.indexOf(child), 1)
    } else freeze(child)
  }
}

const still = (source: string) => {
  const root = parse(source)
  freeze(root)
  return serialize(root)
}

/** Draws with the sky of a given hour. */
const atHour = <T,>(hour: number, draw: () => T): T => {
  const real = Date.prototype.getHours
  Date.prototype.getHours = () => hour
  try {
    return draw()
  } finally {
    Date.prototype.getHours = real
  }
}

const eventFx = (id: string, elapsedMs: number) => {
  const e = ev.eventById(id)
  return { id, phases: ev.eventPhases(e), color: e.color, outcome: ev.outcomeColor(e), elapsedMs }
}

const NIGHT = 23
const previews: Record<string, () => string> = {
  'hud-healthy': () => svg.hudSvg(healthy, 'NEURAL LINK STABLE', 20, 10),
  'hud-critical': () => svg.hudSvg(critical, '⚠ CYBERPSYCHOSE IMMINENTE', 20, 10),
  'sky-dawn': () => atHour(8, () => svg.hudSvg(healthy, 'NEURAL LINK STABLE', 20, 10)),
  'sky-day': () => atHour(13, () => svg.hudSvg(healthy, 'NEURAL LINK STABLE', 20, 10)),
  boot: () => svg.bootSvg(svg.BOOT_STEP_MS * 1.8),
  welcome: () => svg.welcomeSvg(1500, ...i18n.t().welcomes[0]),
  glitch: () => svg.hudSvg({ ...critical, hitAt: Date.now() }, 'x', 20, 10, { glitchMs: 40 }),
  'heal-ram': () =>
    svg.hudSvg({ ...healthy, hearts: 9 }, 'x', 20, 10, {
      heal: { kind: 'ram', elapsedMs: 750 },
      status: { text: '✚ RIPPERDOC · RAM RECHARGÉE', color: '#39FF88' },
    }),
  flatline: () => svg.hudSvg({ ...healthy, stamina: 100 }, 'x', 20, 10),
  'event-intrusion': () => svg.hudSvg(healthy, 'x', 20, 10, { event: eventFx('intrusion', 1500) }),
  'event-netwatch': () => svg.hudSvg(healthy, 'x', 20, 10, { event: eventFx('netwatch', 2400) }),
  'event-acid-rain': () => svg.hudSvg(healthy, 'x', 20, 10, { event: eventFx('acid-rain', 2600) }),
  'event-legendary': () => svg.hudSvg(healthy, 'x', 20, 10, { event: eventFx('legend-black-ice', 1500) }),
}

for (const [name, draw] of Object.entries(previews)) {
  const source = still(atHour(NIGHT, draw))
  writeFileSync(`${DOCS}${name}.svg`, `${source}\n`)
  console.log(`docs/${name}.svg`)
}
