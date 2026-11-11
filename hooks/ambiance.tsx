// Netrunner dressing for the transcript and the prompt's surroundings.
// Every hook here is cheap on purpose: no state read (so nothing subscribes and no write redraws
// the transcript), no timer, and a fixed amount of work per row.
import type { On } from 'claude-code'

import { CYAN, RED, YELLOW } from './palette'

const DIM = '#5A5A6E'
const OWN_COMMANDS = new Set(['hud', 'nightcity', 'netfx'])

// Past-tense words for the line that closes a turn ("Breached for 12s")
const TURN_WORDS = ['Breached', 'Decrypted', 'Jacked in', 'Overclocked', 'Uplinked', 'Netrunned']

// Footer mode labels; unknown ones are upper-cased with a chevron
const MODE_NAMES: Record<string, string> = {
  focus: '◢ FOCUS NEURAL',
  'memory paused': '◢ MÉMOIRE GELÉE',
}

// Dim tail after the hint line under the prompt (terminal only)
const HINT_IDLE = ['⟁ jack in, choom', '⟁ le Net t’attend', '⟁ ICE en veille']
const HINT_WORKING = ['⟁ netrunning…', '⟁ daemon actif', '⟁ breach en cours']

// Headers above Claude's replies, picked from the reply itself so a redraw keeps the same one
const REPLY_HEADERS = ['TRANSMISSION ENTRANTE', 'FLUX DÉCRYPTÉ', 'SIGNAL CAPTÉ', 'PAQUET REÇU', 'LIAISON ÉTABLIE']

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
    next({ ...e, props: { ...e.props, modes: e.props.modes.map(m => MODE_NAMES[m] ?? `◢ ${m.toUpperCase()}`) } }),
  )

  // ── Hint line under the prompt: a dim tail, the engine's own line kept (terminal) ──
  on('ui.render', { component: 'PromptHint' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, tail: pick(e.props.isWorking ? HINT_WORKING : HINT_IDLE) } }),
  )

  // ── Claude's replies: a channel header above the first block of each reply ──
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const row = await next(e)
    if (!e.props.isFirstOfReply || e.props.isSummary) return row
    const { Box, Text } = $.ui.resolve(e)
    const h = hash(e.props.text)
    const channel = (h & 0xffff).toString(16).toUpperCase().padStart(4, '0')
    return (
      <Box flexDirection="column">
        <Text color={CYAN} size="caption" mono>
          {`◢ ${REPLY_HEADERS[h % REPLY_HEADERS.length]} · CANAL ${channel}`}
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
        <Text color={YELLOW} size="caption" mono>◤ UPLINK ÉMIS</Text>
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
        <Text color={e.props.isActive ? YELLOW : DIM} size="caption" mono>
          {`◢ SÉQUENCE DE QUICKHACKS ×${e.props.calls.length}`}
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
        <Text color={RED} weight="bold" mono>⚠ REQUÊTE NETWATCH — RÉPONSE REQUISE</Text>
        {node}
      </Box>
    )
  })
}
