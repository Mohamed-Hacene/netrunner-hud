import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Reading } from '../types'
import { NIGHT_CITY_SVG } from './backdrop'
import { hudSvg } from './hud-svg'

const reading = atom({ plugin: 'netrunner-hud', key: 'reading' } as const, null)
const isHidden = atom({ plugin: 'netrunner-hud', key: 'isHidden' } as const, false)
const isThemeOff = atom({ plugin: 'netrunner-hud', key: 'isThemeOff' } as const, false)

const MAX = 10
const BACKDROP = 'night-city'
// Night City palette
const YELLOW = '#FCEE0A'
const CYAN = '#00F0FF'
const RED = '#FF003C'
const DIM = '#5A5A6E'
const HP_COLOR = '#5EF6E0' // teal HP bar
const RAM_COLOR = '#3E8EFF' // blue RAM cells

const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

const flavor = (hearts: number, percent: number) => {
  if (percent === 0) return 'SYSTÈMES EN LIGNE'
  if (hearts >= 8) return 'NEURAL LINK STABLE'
  if (hearts >= 5) return 'CHARGE RAM MODÉRÉE'
  if (hearts >= 3) return 'SURCHAUFFE CYBERDECK'
  if (hearts >= 1) return '⚠ CYBERPSYCHOSE IMMINENTE'
  return '☠ FLATLINE'
}

// Quickhack names per tool
const QUICKHACK: Record<string, string> = {
  Bash: 'SHORT CIRCUIT',
  PowerShell: 'SHORT CIRCUIT',
  Read: 'PING',
  Grep: 'BREACH PROTOCOL',
  Glob: 'SCAN',
  Edit: 'REBOOT OPTICS',
  Write: 'SYSTEM RESET',
  WebFetch: 'REMOTE UPLINK',
  WebSearch: 'NET DIVE',
  Agent: 'SUMMON DAEMON',
}

const SPIN_WORDS: Record<string, string[]> = {
  thinking: ['Breach Protocol', 'Décryptage ICE', 'Calcul neural', 'Analyse Braindance'],
  requesting: ['Uplink Netwatch', 'Ping Relic', 'Connexion au Net'],
  responding: ['Transmission', 'Upload holo', 'Émission sur le Net'],
  'tool-input': ['Chargement quickhack'],
  'tool-use': ['Quickhack en cours', 'Daemon actif'],
}
const pick = (list: string[]) => list[Math.floor(Date.now() / 4000) % list.length] ?? list[0] ?? ''

const applyTheme = async ($: EngineInterface) => {
  return $.theme.set({
    backdrop: {
      id: BACKDROP,
      glass: { blur: 12, tint: '#0A0A14', opacity: 0.62 },
      colorScheme: 'dark',
    },
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hud', description: 'Afficher / masquer la barre RAM Netrunner' })
    await $.command.register({ name: 'nightcity', description: 'Activer / couper le fond Night City' })
    if (!(await read($, isThemeOff))) await applyTheme($)
    // redraw the band every minute so the regen countdown stays current
    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))
    return next(e)
  })

  on('command.run', { command: 'hud' }, async $ => {
    const hidden = await update($, isHidden, v => !v)
    return { text: hidden ? 'HUD Netrunner masqué.' : 'HUD Netrunner affiché.' }
  })

  on('command.run', { command: 'nightcity' }, async $ => {
    const off = await update($, isThemeOff, v => !v)
    if (off) {
      await $.theme.clear()
      return { text: 'Night City déconnecté.' }
    }
    const res = await applyTheme($)
    return {
      text: res.isDrawn
        ? 'Bienvenue à Night City, choom.'
        : "Night City en attente : ta version de l'app ne dessine pas encore de fond. Il s'affichera tout seul après une mise à jour.",
    }
  })

  // ── Background: Night City skyline (desktop / mobile) ──
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== 'netrunner-hud' || e.props.id !== BACKDROP) return next(e)
    const els = $.ui.resolve(e)
    if (!('Svg' in els)) return next(e)
    const { Svg } = els
    return <Svg source={NIGHT_CITY_SVG} alt="Skyline néon de Night City" isInteractive />
  })

  // ── "Working" indicator rewritten as netrunning ──
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    const words = SPIN_WORDS[e.props.mode] ?? SPIN_WORDS.thinking ?? []
    const word =
      e.surface === 'desktop' && e.props.mode === 'tool-use'
        ? `⟁ ${e.props.word}`
        : `⟁ ${pick(words)}`
    return next({ ...e, props: { ...e.props, word } })
  })

  // ── Tool rows: quickhack tag ──
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const row = await next(e)
    if (e.props.isExpanded) return row
    const { Box, Text } = $.ui.resolve(e)
    const hack = QUICKHACK[e.props.tool] ?? 'QUICKHACK'
    const [label, color] = e.props.isInterrupted
      ? ['◼ QUICKHACK ANNULÉ', DIM]
      : e.props.isErrored
        ? ['✖ ICE DÉTECTÉ — CONTRE-HACK', RED]
        : e.props.isRunning
          ? [`◢ UPLOAD ${hack}…`, YELLOW]
          : [`◆ ${hack} EXÉCUTÉ`, CYAN]
    return (
      <Box flexDirection="column">
        {row}
        <Text color={color} size="caption" mono>
          {label}
        </Text>
      </Box>
    )
  })

  // ── Context (RAM) + 5h token limit (HP) readings ──
  on('session.measure', async ($, e, next) => {
    const { context, rateLimits } = e
    const percent = context.percent ?? 0
    const hearts = Math.max(0, Math.ceil(((100 - percent) / 100) * MAX))
    const five = rateLimits.find(r => r.kind === 'five_hour')

    const prev = await read($, reading)
    const lost = prev !== null && hearts < prev.hearts
    const healed = prev !== null && hearts > prev.hearts

    const fresh: Reading = {
      hearts,
      percent,
      tokens: context.tokens ?? 0,
      window: context.window,
      burst: lost ? hearts : null,
      stamina: five ? five.percentUsed : null,
      resetsAt: five?.resetsAt ?? null,
    }
    await update($, reading, () => fresh)

    $.ui.status(undefined)

    if (prev !== null) {
      // RAM (context)
      if (healed) $.ui.toast('🔋 RAM rechargée : contexte purgé')
      else if (lost && hearts === 0) $.ui.toast('⛔ RAM vide — contexte saturé, lance /compact')
      else if (lost && hearts <= 2 && prev.hearts > 2) $.ui.toast('⚠ RAM faible — pense à /compact, choom')

      // HP (5h token limit)
      const hp = fresh.stamina === null ? null : 100 - fresh.stamina
      const hpPrev = prev.stamina === null ? null : 100 - prev.stamina
      if (hp !== null && hpPrev !== null) {
        if (hp > hpPrev + 20) $.ui.toast('🩺 RIPPERDOC : HP restaurés, limite réinitialisée')
        else if (hp <= 0 && hpPrev > 0) $.ui.toast('☠ FLATLINE — plus de tokens jusqu’à la réinitialisation')
        else if (hp <= 20 && hpPrev > 20) $.ui.toast('⚠ HP CRITIQUES — utilise un MaxDoc, choom')
      }
    }

    return next(e)
  })

  // ── HP (token limit) + RAM (context) band above the prompt ──
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, reading)
    if (e.props.hasSurvey || r === null || (await read($, isHidden))) {
      return next(e)
    }

    const els = $.ui.resolve(e)
    const { Box, Text } = els
    if (e.surface === "desktop" && "Svg" in els) {
      const { Svg } = els
      const label = r.stamina === null ? "HP inconnu" : `HP ${Math.round(100 - r.stamina)} sur 100`
      return (
        <Box>
          <Svg source={hudSvg(r, flavor(r.hearts, r.percent), 20, MAX)} alt={`${label}, RAM ${r.hearts} sur ${MAX}`} />
        </Box>
      )
    }
    const sep = <Text color={DIM}>{'  │  '}</Text>

    // HP bar — what is LEFT of the 5-hour token limit, drains as you code
    const HP_CELLS = 20
    let hpBar
    if (r.stamina === null) {
      hpBar = (
        <Text>
          <Text color={HP_COLOR} weight="bold">HP </Text>
          <Text color={DIM}>{'░'.repeat(HP_CELLS)} synchro…</Text>
        </Text>
      )
    } else {
      const left = Math.max(0, Math.min(100, 100 - r.stamina))
      const filled = Math.max(0, Math.min(HP_CELLS, Math.ceil((left / 100) * HP_CELLS)))
      const c = left <= 20 ? RED : left <= 50 ? YELLOW : HP_COLOR
      hpBar = (
        <Text>
          <Text color={c} weight="bold">HP </Text>
          <Text color={c}>{'█'.repeat(filled)}</Text>
          <Text color={DIM}>{'░'.repeat(HP_CELLS - filled)}</Text>
          <Text color={c} tabular weight="bold">{` ${Math.round(left)}`}</Text>
          <Text color={DIM} tabular>/100</Text>
        </Text>
      )
    }

    // RAM cells — free context window
    const ramColor = r.hearts > 2 ? RAM_COLOR : RED
    const cells = Array.from({ length: MAX }, (_, i) => {
      if (i < r.hearts) return <Text key={`r${i}`} color={ramColor}>▮</Text>
      if (i === r.burst) return <Text key={`r${i}`} color={RED} weight="bold">✸</Text>
      return <Text key={`r${i}`} color={DIM}>▯</Text>
    })

    return (
      <Box>
        <Text mono>
          {hpBar}
          {sep}
          <Text color={ramColor} weight="bold">RAM </Text>
          {cells}
          <Text color={ramColor} tabular>{` ${r.hearts}/${MAX}`}</Text>
          <Text color={DIM} tabular>{` (${fmtK(r.tokens)}/${fmtK(r.window)})`}</Text>
          {sep}
          <Text color={r.hearts <= 2 ? RED : CYAN} italic>{flavor(r.hearts, r.percent)}</Text>
        </Text>
      </Box>
    )
  })
}
