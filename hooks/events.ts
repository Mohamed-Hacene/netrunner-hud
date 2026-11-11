// Random cosmetic events: a short three-step story played in the band ("intrusion detected",
// "countermeasures", "ICE repelled"). They carry no information and change nothing.
import { CYAN, RED, YELLOW } from './palette'

export type NetEvent = {
  id: string
  /** Color of the first two steps; the last one, the outcome, is drawn in cyan. */
  color: string
  phases: readonly [string, string, string]
}

export const EVENTS: readonly NetEvent[] = [
  { id: 'intrusion', color: RED, phases: ['⚠ INTRUSION DÉTECTÉE', 'CONTRE-MESURES ACTIVÉES…', '✔ ICE REPOUSSÉ'] },
  { id: 'netwatch', color: YELLOW, phases: ['◉ SCAN NETWATCH EN COURS', 'BROUILLAGE DE LA SIGNATURE…', '✔ TRACE PERDUE'] },
  { id: 'daemon', color: RED, phases: ['☣ DAEMON HOSTILE DÉTECTÉ', 'MISE EN QUARANTAINE…', '✔ DAEMON PURGÉ'] },
  { id: 'shard', color: YELLOW, phases: ['✉ PAQUET CRYPTÉ INTERCEPTÉ', 'DÉCRYPTAGE…', '« LE NET SE SOUVIENT DE TOI »'] },
  { id: 'surge', color: YELLOW, phases: ['⚡ SURTENSION DU CYBERDECK', 'DÉLESTAGE DES IMPLANTS…', '✔ TENSION STABILISÉE'] },
  { id: 'ghost', color: CYAN, phases: ['◌ SIGNAL FANTÔME SUR LE RÉSEAU', 'TRIANGULATION…', '✖ SOURCE INTROUVABLE'] },
  { id: 'breach', color: RED, phases: ['⚠ BREACH ENTRANT', 'PARE-FEU EN SURCHARGE…', '✔ CONNEXION COUPÉE'] },
]

/** How long each of the three steps lasts, in ms. */
export const EVENT_PHASE_MS = 2000
export const EVENT_MS = EVENT_PHASE_MS * 3
/** Chance that an event starts at each one-minute check. */
export const EVENT_CHANCE = 0.12
/** Minimum time between two events, in ms. */
export const EVENT_COOLDOWN_MS = 4 * 60_000

export const eventById = (id: string) => EVENTS.find(ev => ev.id === id)
export const randomEvent = (): NetEvent => EVENTS[Math.floor(Math.random() * EVENTS.length)] ?? EVENTS[0]!
/** The step shown `elapsedMs` into an event: 0, 1 or 2. */
export const phaseAt = (elapsedMs: number) => Math.min(2, Math.max(0, Math.floor(elapsedMs / EVENT_PHASE_MS)))
