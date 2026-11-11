export type Reading = {
  /** Remaining hearts, 0..MAX */
  hearts: number
  /** Context used, 0..100 */
  percent: number
  tokens: number
  window: number
  /** Index of the heart that just burst, shown as an explosion for one frame */
  burst: number | null
  /** 5-hour rate-limit usage, 0..100, when known */
  stamina: number | null
  /** When the 5-hour window resets (ISO 8601); absent on readings stored before this field existed */
  resetsAt?: string | null
  /** When the last hit landed (ms since the epoch), for the damage glitch; absent on older readings */
  hitAt?: number | null
}

/** What plays in the band: the boot sequence, the welcome message (by its index) or a random event (by its id). */
export type Fx = { kind: 'boot' | 'welcome' | 'event'; id: string; startedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'netrunner-hud': {
      reading: Reading | null
      isHidden: boolean
      isThemeOff: boolean
      isFxOff: boolean
      fx: Fx | null
      frame: number
    }
  }
}
