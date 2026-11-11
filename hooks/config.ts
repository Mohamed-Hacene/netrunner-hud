// The options a person sets in Claude Code's config menu (the manifest's `userConfig`), checked and
// with their defaults filled in. `register` calls `configure` each time the module loads, and a
// change in the menu reloads the module, so every reader sees the current values.
import type { PluginOptions } from 'claude-code'

import { HP_COLOR, RAM_COLOR } from './theme'

export type Language = 'fr' | 'en'

/** Fewest and most RAM cells: below, the band says too little; above, the cells run into the status text
 * (the band has a fixed width for now). */
export const RAM_CELLS_MIN = 5
export const RAM_CELLS_MAX = 10

/** Chance that a random event starts at each one-minute check, per `eventFrequency`. */
const EVENT_CHANCES = { rare: 0.05, normal: 0.12, frequent: 0.3 } as const

const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

export const config = {
  language: 'fr' as Language,
  ramCells: 10,
  eventChance: EVENT_CHANCES.normal as number,
  hpColor: HP_COLOR,
  ramColor: RAM_COLOR,
}

export const configure = (options: PluginOptions | undefined) => {
  const o = options ?? {}
  config.language = o.language === 'en' ? 'en' : 'fr'
  const cells = typeof o.ramCells === 'number' && Number.isFinite(o.ramCells) ? Math.round(o.ramCells) : 10
  config.ramCells = Math.min(RAM_CELLS_MAX, Math.max(RAM_CELLS_MIN, cells))
  const freq = o.eventFrequency
  config.eventChance = freq === 'rare' || freq === 'frequent' ? EVENT_CHANCES[freq] : EVENT_CHANCES.normal
  config.hpColor = isColor(o.hpColor) ? o.hpColor : HP_COLOR
  config.ramColor = isColor(o.ramColor) ? o.ramColor : RAM_COLOR
}
