// Cosmetic events: a short three-step story played in the band ("intrusion detected",
// "countermeasures", "ICE repelled"). They carry no information and change nothing.
import { CYAN, MAGENTA, RED, YELLOW } from './palette'

export type NetEvent = {
  id: string
  /** Color of the first two steps; the last one, the outcome, is drawn in cyan (magenta when legendary). */
  color: string
  phases: readonly [string, string, string]
  /** `legendary`: about 1 draw in 100. `hidden`: only a keyword in your prompt plays it. */
  rarity?: 'legendary' | 'hidden'
}

export const EVENTS: readonly NetEvent[] = [
  { id: 'intrusion', color: RED, phases: ['⚠ INTRUSION DÉTECTÉE', 'CONTRE-MESURES ACTIVÉES…', '✔ ICE REPOUSSÉ'] },
  { id: 'netwatch', color: YELLOW, phases: ['◉ SCAN NETWATCH EN COURS', 'BROUILLAGE DE LA SIGNATURE…', '✔ TRACE PERDUE'] },
  { id: 'daemon', color: RED, phases: ['☣ DAEMON HOSTILE DÉTECTÉ', 'MISE EN QUARANTAINE…', '✔ DAEMON PURGÉ'] },
  { id: 'shard', color: YELLOW, phases: ['✉ PAQUET CRYPTÉ INTERCEPTÉ', 'DÉCRYPTAGE…', '« LE NET SE SOUVIENT DE TOI »'] },
  { id: 'surge', color: YELLOW, phases: ['⚡ SURTENSION DU CYBERDECK', 'DÉLESTAGE DES IMPLANTS…', '✔ TENSION STABILISÉE'] },
  { id: 'ghost', color: CYAN, phases: ['◌ SIGNAL FANTÔME SUR LE RÉSEAU', 'TRIANGULATION…', '✖ SOURCE INTROUVABLE'] },
  { id: 'breach', color: RED, phases: ['⚠ BREACH ENTRANT', 'PARE-FEU EN SURCHARGE…', '✔ CONNEXION COUPÉE'] },
  { id: 'acid-rain', color: YELLOW, phases: ['☂ PLUIE ACIDE SUR NIGHT CITY', 'BOUCLIERS DU CYBERDECK…', '✔ AVERSE TERMINÉE'] },
  // legendary: rare draws, with a color and a story of their own
  {
    id: 'legend-black-ice',
    color: MAGENTA,
    phases: ['✦ BLACK ICE LÉGENDAIRE', 'IL TE REGARDE AUSSI…', '✦ TU AS SURVÉCU, NETRUNNER'],
    rarity: 'legendary',
  },
  {
    id: 'legend-rogue-ai',
    color: MAGENTA,
    phases: ['✦ UNE IA ROGUE FRAPPE AU PARE-FEU', 'ELLE CONNAÎT TON NOM…', '✦ CONTACT ROMPU · POUR L’INSTANT'],
    rarity: 'legendary',
  },
  {
    id: 'legend-old-net',
    color: MAGENTA,
    phases: ['✦ UN FANTÔME DU VIEUX NET', 'IL MURMURE DES COORDONNÉES…', '✦ SIGNAL ÉVANOUI DANS LE BRUIT'],
    rarity: 'legendary',
  },
  // hidden: only a keyword plays it
  {
    id: 'choom',
    color: YELLOW,
    phases: ['◢ CHOOM DÉTECTÉ', 'ANALYSE DU PROFIL…', '✔ NETRUNNER CONFIRMÉ · SALUT, CHOOM'],
    rarity: 'hidden',
  },
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
/** Chance that an event starts at each one-minute check. */
export const EVENT_CHANCE = 0.12
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
/** The step shown `elapsedMs` into an event: 0, 1 or 2. */
export const phaseAt = (elapsedMs: number) => Math.min(2, Math.max(0, Math.floor(elapsedMs / EVENT_PHASE_MS)))
/** The color of the last step: cyan, or magenta for a legendary event. */
export const outcomeColor = (ev: NetEvent) => (ev.rarity === 'legendary' ? MAGENTA : CYAN)
