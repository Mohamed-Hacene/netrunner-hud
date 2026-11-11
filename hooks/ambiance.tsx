// Netrunner dressing for the transcript and the prompt's surroundings.
// Every hook here is cheap on purpose: no state read (so nothing subscribes and no write redraws
// the transcript), no timer, and a fixed amount of work per row.
import type { On } from 'claude-code'

import { t } from './i18n'
import { CYAN, DIM_TEXT, RED, YELLOW } from './theme'

const OWN_COMMANDS = new Set(['hud', 'nightcity', 'netfx'])

// Past-tense words for the line that closes a turn ("Breached for 12s")
const TURN_WORDS = ['Breached', 'Decrypted', 'Jacked in', 'Overclocked', 'Uplinked', 'Netrunned']

// Footer mode labels, hint tails, reply headers and the other texts: `ambiance` in `i18n.ts`.

export const pick = (list: readonly string[]) => list[Math.floor(Date.now() / 4000) % list.length] ?? list[0] ?? ''

/** A small stable hash (FNV-1a) of the first characters of a text. */
const hash = (text: string) => {
  let h = 2166136261
  for (let i = 0; i < Math.min(64, text.length); i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export const registerAmbiance = (on: On) => {
  // ── Line that closes a turn: "Breached for 12s" (terminal) ──
  on('ui.render', { component: 'TurnDuration' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, word: TURN_WORDS[e.props.durationMs % TURN_WORDS.length] ?? e.props.word } }),
  )

  // ── Footer mode labels ──
  on('ui.render', { component: 'SessionMode' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, modes: e.props.modes.map(m => t().ambiance.modes[m] ?? `◢ ${m.toUpperCase()}`) } }),
  )

  // ── Hint line under the prompt: a dim tail, the engine's own line kept (terminal) ──
  on('ui.render', { component: 'PromptHint' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, tail: pick(e.props.isWorking ? t().ambiance.hintWorking : t().ambiance.hintIdle) } }),
  )

  // ── Claude's replies: a channel header above the first block of each reply ──
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const row = await next(e)
    if (!e.props.isFirstOfReply || e.props.isSummary) return row
    const { Box, Text } = $.ui.resolve(e)
    const h = hash(e.props.text)
    const channel = (h & 0xffff).toString(16).toUpperCase().padStart(4, '0')
    const { replyHeaders, channel: channelWord } = t().ambiance
    return (
      <Box flexDirection="column">
        <Text color={CYAN} size="caption" mono>
          {`◢ ${replyHeaders[h % replyHeaders.length]} · ${channelWord} ${channel}`}
        </Text>
        {row}
      </Box>
    )
  })

  // ── Your prompts: an uplink header (terminal; the desktop app does not draw this yet) ──
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const row = await next(e)
    if (e.props.isExpanded || e.props.origin.kind !== 'composer') return row
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={YELLOW} size="caption" mono>{t().ambiance.uplink}</Text>
        {row}
      </Box>
    )
  })

  // ── Folded runs of tool calls: a quickhack sequence header ──
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const row = await next(e)
    if (e.props.calls.length < 2) return row
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={e.props.isActive ? YELLOW : DIM_TEXT} size="caption" mono>
          {t().ambiance.sequence(e.props.calls.length)}
        </Text>
        {row}
      </Box>
    )
  })

  // ── Replies of this mod's own commands ──
  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    const row = await next(e)
    if (!OWN_COMMANDS.has(e.props.command)) return row
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={e.props.isErrored ? RED : YELLOW} size="caption" mono>◢ NETRUNNER-HUD //</Text>
        {row}
      </Box>
    )
  })

  // ── Questions Claude asks you: a Netwatch request header ──
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const node = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={RED} weight="bold" mono>{t().ambiance.netwatch}</Text>
        {node}
      </Box>
    )
  })
}
