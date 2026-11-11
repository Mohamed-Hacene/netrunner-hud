// The mod's look in one place: colors, thresholds and number formatting, shared by the band,
// the transcript and the events. The HP and RAM colors below are defaults: the config can change them.

export const YELLOW = '#FCEE0A'
export const CYAN = '#00F0FF'
export const RED = '#FF003C'
/** Legendary events. */
export const MAGENTA = '#FF2BD6'
/** Healing: RAM recharged, HP restored. */
export const GREEN = '#39FF88'

/** Default color of the HP bar (`hpColor` in the config). */
export const HP_COLOR = '#5EF6E0'
/** Default color of the RAM cells (`ramColor` in the config). */
export const RAM_COLOR = '#3E8EFF'

/** Dim text and separators, in the terminal and the transcript. */
export const DIM_TEXT = '#5A5A6E'
/** Empty HP segments and RAM cell outlines, in the desktop band. */
export const CELL_OFF = '#2A2F3A'
/** Secondary text in the desktop band. */
export const MUTED = '#B4BCD6'

/** HP turns yellow at or below this many points left (out of 100). */
export const HP_WARN = 50
/** HP turns red, and pulses on desktop, at or below this many points left. */
export const HP_CRITICAL = 20
/** RAM turns red at or below this many free cells. */
export const RAM_LOW = 2

/** 64000 → "64k". */
export const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)
