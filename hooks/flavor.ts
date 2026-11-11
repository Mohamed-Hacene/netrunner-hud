// The band's status text and the status line, from the HP and the RAM taken separately and together.
//
// Each gauge has a level: ok, mid, low or crit. The text has one message per pair of levels (`flavor.grid`
// in `i18n.ts`): a row or a column where the other gauge is ok speaks of one gauge alone, the rest of both.
import type { Reading } from '../types'
import { config } from './config'
import { t } from './i18n'
import { HP_CRITICAL, HP_WARN, RAM_LOW } from './theme'

export type Level = 'ok' | 'mid' | 'low' | 'crit'

/** HP above this many points left reads as full. */
const HP_FULL = 75

/** The HP level, from what is left of the 5h limit; unknown HP reads as ok. */
export const hpLevel = (r: Reading): Level => {
  if (r.stamina === null) return 'ok'
  const left = 100 - r.stamina
  return left > HP_FULL ? 'ok' : left > HP_WARN ? 'mid' : left > HP_CRITICAL ? 'low' : 'crit'
}

/** The RAM level, from the share of free cells, so it reads the same whatever their number. */
export const ramLevel = (r: Reading): Level => {
  if (r.hearts <= RAM_LOW) return 'crit'
  const share = r.hearts / config.ramCells
  return share >= 0.8 ? 'ok' : share >= 0.5 ? 'mid' : 'low'
}

/** The band's status text: one message for each pair of RAM and HP levels. */
export const flavorFor = (r: Reading): string => {
  const f = t().flavor
  const hp = hpLevel(r)
  const ram = ramLevel(r)
  return r.percent === 0 && hp === 'ok' ? f.idle : f.grid[ram][hp]
}

/** True when the status text should be drawn in red. */
export const isFlavorCritical = (r: Reading) => hpLevel(r) === 'crit' || ramLevel(r) === 'crit'

/** The mod's status line under the prompt: calm, or which gauge is in trouble. */
export const statusLineFor = (r: Reading | null): string => {
  const s = t().statusLine
  if (r === null) return s.calm
  const hp = hpLevel(r) === 'crit'
  const ram = ramLevel(r) === 'crit'
  return hp && ram ? s.bothAlert : ram ? s.ramAlert : hp ? s.hpAlert : s.calm
}
