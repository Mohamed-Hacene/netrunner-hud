// Cosmetic events: a short three-step story played in the band ("intrusion detected",
// "countermeasures", "ICE repelled"). They carry no information and change nothing.
import { t } from './i18n'
import { CYAN, MAGENTA, RED, YELLOW } from './theme'

export type NetEvent = {
  id: string
  /** Color of the first two steps; the last one, the outcome, is drawn in cyan (magenta when legendary). */
  color: string
  /** `legendary`: about 1 draw in 100. `hidden`: only a keyword in your prompt plays it. */
  rarity?: 'legendary' | 'hidden'
}

// Their three steps, in each language, are in `i18n.ts` under the same id.
export const EVENTS: readonly NetEvent[] = [
  { id: 'intrusion', color: RED },
  { id: 'netwatch', color: YELLOW },
  { id: 'daemon', color: RED },
  { id: 'shard', color: YELLOW },
  { id: 'surge', color: YELLOW },
  { id: 'ghost', color: CYAN },
  { id: 'breach', color: RED },
  { id: 'acid-rain', color: YELLOW },
  // legendary: rare draws, with a color and a story of their own
  { id: 'legend-black-ice', color: MAGENTA, rarity: 'legendary' },
  { id: 'legend-rogue-ai', color: MAGENTA, rarity: 'legendary' },
  { id: 'legend-old-net', color: MAGENTA, rarity: 'legendary' },
  // hidden: only a keyword plays it
  { id: 'choom', color: YELLOW, rarity: 'hidden' },
]

/** Words in your prompt that play an event, checked in this order. */
const KEYWORDS: readonly (readonly [RegExp, string])[] = [
  [/\bchooms?\b/, 'choom'],
  [/\bbreach\b/, 'breach'],
  [/\bnetwatch\b/, 'netwatch'],
  [/\bdaemons?\b/, 'daemon'],
  [/\b(pluie|rain)\b/, 'acid-rain'],
]

/** How long each of the three steps lasts, in ms. */
export const EVENT_PHASE_MS = 2000
export const EVENT_MS = EVENT_PHASE_MS * 3
/** Chance that a drawn event is a legendary one. */
export const LEGENDARY_CHANCE = 0.01
/** Minimum time between two random events, in ms. */
export const EVENT_COOLDOWN_MS = 4 * 60_000

const COMMON = EVENTS.filter(ev => ev.rarity === undefined)
const LEGENDARY = EVENTS.filter(ev => ev.rarity === 'legendary')
const any = (list: readonly NetEvent[]): NetEvent => list[Math.floor(Math.random() * list.length)] ?? EVENTS[0]!

export const eventById = (id: string) => EVENTS.find(ev => ev.id === id)
export const randomEvent = (): NetEvent => (Math.random() < LEGENDARY_CHANCE ? any(LEGENDARY) : any(COMMON))
/** The event a prompt's keyword plays, if any; only its first 2,000 characters are read. */
export const keywordEvent = (text: string) => {
  const head = text.slice(0, 2000).toLowerCase()
  const hit = KEYWORDS.find(([re]) => re.test(head))
  return hit ? eventById(hit[1]) : undefined
}
/** The three steps of an event, in the config's language. */
export const eventPhases = (ev: NetEvent) => t().events[ev.id] ?? ([ev.id, ev.id, ev.id] as const)
/** The step shown `elapsedMs` into an event: 0, 1 or 2. */
export const phaseAt = (elapsedMs: number) => Math.min(2, Math.max(0, Math.floor(elapsedMs / EVENT_PHASE_MS)))
/** The color of the last step: cyan, or magenta for a legendary event. */
export const outcomeColor = (ev: NetEvent) => (ev.rarity === 'legendary' ? MAGENTA : CYAN)
