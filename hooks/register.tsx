import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Fx, Reading } from '../types'
import { pick, registerAmbiance } from './ambiance'
import { NIGHT_CITY_SVG } from './backdrop'
import {
  EVENT_CHANCE,
  EVENT_COOLDOWN_MS,
  EVENT_MS,
  EVENT_PHASE_MS,
  eventById,
  keywordEvent,
  outcomeColor,
  phaseAt,
  randomEvent,
  type NetEvent,
} from './events'
import {
  BOOT_MS,
  BOOT_STEPS,
  BOOT_STEP_MS,
  GLITCH_MS,
  HEAL_MS,
  SWEEP_MS,
  WELCOMES,
  WELCOME_MS,
  bootSvg,
  hudSvg,
  regenLabel,
  welcomeSvg,
} from './hud-svg'
import { CYAN, GREEN, RED, YELLOW } from './palette'

// ── Session state ──
// The band animates through these values rather than `$.ui.invalidate`: a write redraws only what
// reads the value (the band), never the transcript. They stay in this file: the engine reads the
// state a module uses from the module itself.
const reading = atom({ plugin: 'netrunner-hud', key: 'reading' } as const, null)
const isHidden = atom({ plugin: 'netrunner-hud', key: 'isHidden' } as const, false)
const isThemeOff = atom({ plugin: 'netrunner-hud', key: 'isThemeOff' } as const, false)
const isFxOff = atom({ plugin: 'netrunner-hud', key: 'isFxOff' } as const, false)
/** What plays in the band (boot, welcome, event, healing, end-of-reply sweep), if anything. */
const fx = atom({ plugin: 'netrunner-hud', key: 'fx' } as const, null)
/** Read by the band alone: bumping it redraws the band and nothing else. */
const frame = atom({ plugin: 'netrunner-hud', key: 'frame' } as const, 0)

function redrawBand($: EngineInterface) {
  void update($, frame, n => n + 1)
}

const MAX = 10
const BACKDROP = 'night-city'
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

const applyTheme = async ($: EngineInterface) => {
  return $.theme.set({
    backdrop: {
      id: BACKDROP,
      glass: { blur: 12, tint: '#0A0A14', opacity: 0.62 },
      colorScheme: 'dark',
    },
  })
}

// ── Status line under the prompt: set only when its text changes ──
let lastStatus: string | undefined
const setStatus = ($: EngineInterface, text: string | undefined) => {
  if (text === lastStatus) return
  lastStatus = text
  $.ui.status(text)
}
const statusFor = (r: Reading | null) =>
  r !== null && (r.hearts <= 2 || (r.stamina !== null && r.stamina >= 80))
    ? '⚠ ICE ACTIF · TRACE NETWATCH EN COURS'
    : '◢ NETRUNNER ONLINE · ICE PASSIF'

// ── Boot sequence and random events, played in the band ──
// The desktop band animates itself (SMIL); these few redraws only step the terminal's text.
const startBoot = async ($: EngineInterface) => {
  await update($, fx, () => ({ kind: 'boot', id: 'boot', startedAt: Date.now() }))
  for (let i = 0; i <= BOOT_STEPS.length; i++) {
    if (i > 0) $.clock.after(i * BOOT_STEP_MS, () => redrawBand($))
    $.clock.after(i * BOOT_STEP_MS + BOOT_STEP_MS * 0.6, () => redrawBand($))
  }
  $.clock.after(BOOT_MS + 20, () => void startWelcome($))
}

// ── Welcome message, right after the boot ──
const startWelcome = async ($: EngineInterface) => {
  const index = Math.floor(Math.random() * WELCOMES.length)
  const swapped = await update($, fx, v => (v?.kind === 'boot' ? { kind: 'welcome' as const, id: String(index), startedAt: Date.now() } : v))
  if (swapped?.kind !== 'welcome') return
  $.clock.after(WELCOME_MS + 20, () => void update($, fx, v => (v?.kind === 'welcome' ? null : v)))
}

/**
 * Plays an effect in the band for `durMs`, unless something else plays there already: it may only
 * replace what `over` names. Resolves whether it plays. Its end clears it, and that write redraws the band.
 */
const playFx = async ($: EngineInterface, kind: Fx['kind'], id: string, durMs: number, over: readonly Fx['kind'][]) => {
  const startedAt = Date.now()
  const now = await update($, fx, v => (v === null || over.includes(v.kind) ? { kind, id, startedAt } : v))
  if (now?.startedAt !== startedAt || now.kind !== kind) return false
  $.clock.after(durMs + 20, () => void update($, fx, v => (v?.startedAt === startedAt && v.kind === kind ? null : v)))
  return true
}

let lastEventAt = 0
const startEvent = async ($: EngineInterface, ev: NetEvent) => {
  if (!(await playFx($, 'event', ev.id, EVENT_MS, ['sweep']))) return
  lastEventAt = Date.now()
  $.clock.after(GLITCH_MS + 20, () => redrawBand($))
  $.clock.after(EVENT_PHASE_MS, () => redrawBand($))
  $.clock.after(2 * EVENT_PHASE_MS, () => redrawBand($))
}

const minuteTick = async ($: EngineInterface) => {
  // keep the regen countdown current
  if ((await read($, reading))?.resetsAt) redrawBand($)
  // maybe a random event
  if ((await read($, isFxOff)) || (await read($, isHidden)) || (await read($, fx)) !== null) return
  if (Date.now() - lastEventAt < EVENT_COOLDOWN_MS || Math.random() >= EVENT_CHANCE) return
  await startEvent($, randomEvent())
}

export const register: Register = on => {
  registerAmbiance(on)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hud', description: 'Afficher / masquer la barre RAM Netrunner' })
    await $.command.register({ name: 'nightcity', description: 'Activer / couper le fond Night City' })
    await $.command.register({ name: 'netfx', description: 'Activer / couper les évènements aléatoires du Net' })
    // settings kept between sessions
    const storedHidden = await $.store.get('isHidden')
    if (typeof storedHidden === 'boolean') await update($, isHidden, () => storedHidden)
    const storedThemeOff = await $.store.get('isThemeOff')
    if (typeof storedThemeOff === 'boolean') await update($, isThemeOff, () => storedThemeOff)
    const storedFxOff = await $.store.get('isFxOff')
    if (typeof storedFxOff === 'boolean') await update($, isFxOff, () => storedFxOff)

    if (!(await read($, isThemeOff))) await applyTheme($)
    if (!(await read($, isHidden))) setStatus($, statusFor(await read($, reading)))
    $.clock.every(60_000, () => void minuteTick($))
    lastEventAt = Date.now() // no event during the first minutes
    await startBoot($)
    return next(e)
  })

  on('command.run', { command: 'hud' }, async $ => {
    const hidden = await update($, isHidden, v => !v)
    await $.store.set('isHidden', hidden)
    setStatus($, hidden ? undefined : statusFor(await read($, reading)))
    return { text: hidden ? 'HUD Netrunner masqué.' : 'HUD Netrunner affiché.' }
  })

  on('command.run', { command: 'nightcity' }, async $ => {
    const off = await update($, isThemeOff, v => !v)
    await $.store.set('isThemeOff', off)
    if (off) {
      await $.theme.clear()
      return { text: 'Night City déconnecté.' }
    }
    const res = await applyTheme($)
    return {
      text: res.isDrawn
        ? 'Bienvenue à Night City, choom.'
        : `Night City en attente : aucun fond dessiné pour l'instant (${res.reason}). Il s'affichera tout seul dès que l'app le permettra.`,
    }
  })

  on('command.run', { command: 'netfx' }, async $ => {
    const off = await update($, isFxOff, v => !v)
    await $.store.set('isFxOff', off)
    if (off) return { text: 'Évènements aléatoires coupés.' }
    await startEvent($, randomEvent())
    return { text: 'Évènements aléatoires activés. Le Net s’agite…' }
  })

  // ── End of a reply: a light bar crosses the band ──
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (!('agentId' in e && e.agentId)) void playFx($, 'sweep', 'turn', SWEEP_MS, ['sweep'])
    return done
  })

  // ── Hidden keywords in your prompt play an event ──
  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind === 'composer' && !e.command && !(await read($, isFxOff))) {
      const ev = keywordEvent(e.text)
      if (ev) void startEvent($, ev)
    }
    return next(e)
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
    // a hit: a RAM cell lost, or HP dropping into a lower tens
    const hpNow = five ? 100 - five.percentUsed : null
    const hpBefore = prev === null || prev.stamina === null ? null : 100 - prev.stamina
    const hurt = lost || (hpNow !== null && hpBefore !== null && Math.floor(hpNow / 10) < Math.floor(hpBefore / 10))

    const fresh: Reading = {
      hearts,
      percent,
      tokens: context.tokens ?? 0,
      window: context.window,
      burst: lost ? hearts : null,
      stamina: five ? five.percentUsed : null,
      resetsAt: five?.resetsAt ?? null,
      hitAt: hurt ? Date.now() : null,
    }
    await update($, reading, () => fresh)
    // redraw once the damage glitch is over, so it does not stay in the band
    if (hurt) $.clock.after(GLITCH_MS + 50, () => redrawBand($))
    if (!(await read($, isHidden))) setStatus($, statusFor(fresh))

    // healing: a /compact that frees 3 cells or more, or the 5h limit resetting
    const hpRestored = hpNow !== null && hpBefore !== null && hpNow > hpBefore + 20
    if (hpRestored) void playFx($, 'heal-hp', 'hp', HEAL_MS, ['sweep', 'event'])
    else if (prev !== null && hearts - prev.hearts >= 3) void playFx($, 'heal-ram', 'ram', HEAL_MS, ['sweep', 'event'])

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
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    await read($, frame) // subscribes the band: bumping `frame` redraws it alone
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const play = await read($, fx)
    const playMs = play === null ? 0 : Date.now() - play.startedAt

    // ── boot sequence, while the session starts ──
    const bootMs = playMs
    if (play?.kind === 'boot' && bootMs < BOOT_MS) {
      if (e.surface === 'desktop' && 'Svg' in els) {
        const { Svg } = els
        return (
          <Box>
            <Svg source={bootSvg(bootMs)} alt="Séquence de démarrage du cyberdeck" />
          </Box>
        )
      }
      const step = Math.floor(bootMs / BOOT_STEP_MS)
      const label = BOOT_STEPS[step]
      const filled = Math.min(20, Math.ceil((bootMs / BOOT_MS) * 20))
      const isOk = bootMs % BOOT_STEP_MS > BOOT_STEP_MS * 0.55
      return (
        <Box>
          <Text mono>
            {label === undefined ? (
              <Text color={YELLOW} weight="bold">{'◢ JACK IN ◣'.padEnd(30)}</Text>
            ) : (
              <Text>
                <Text color={CYAN}>{`> ${label} `}</Text>
                <Text color={DIM}>{'.'.repeat(Math.max(3, 24 - label.length))}</Text>
                <Text color={HP_COLOR} weight="bold">{isOk ? ' OK' : '   '}</Text>
              </Text>
            )}
            <Text color={DIM}>{'  │  '}</Text>
            <Text color={CYAN}>{'█'.repeat(filled)}</Text>
            <Text color={DIM}>{'░'.repeat(20 - filled)}</Text>
            <Text color={CYAN} tabular>{` ${Math.round((filled / 20) * 100)}%`.padStart(5)}</Text>
          </Text>
        </Box>
      )
    }

    // ── welcome message, right after the boot ──
    const welcome = play?.kind === 'welcome' && playMs < WELCOME_MS ? WELCOMES[Number(play.id)] : undefined
    if (welcome) {
      const [title, subtitle] = welcome
      if (e.surface === 'desktop' && 'Svg' in els) {
        const { Svg } = els
        return (
          <Box>
            <Svg source={welcomeSvg(playMs, title, subtitle)} alt={`${title}. ${subtitle}`} />
          </Box>
        )
      }
      return (
        <Box>
          <Text mono>
            <Text color={YELLOW} weight="bold">{`◢ ${title} ◣`}</Text>
            <Text color={DIM}>{'  │  '}</Text>
            <Text color={CYAN}>{subtitle}</Text>
          </Text>
        </Box>
      )
    }

    const r = await read($, reading)
    if (r === null) return next(e)
    const event = play?.kind === 'event' && playMs < EVENT_MS ? eventById(play.id) : undefined
    const heal =
      (play?.kind === 'heal-ram' || play?.kind === 'heal-hp') && playMs < HEAL_MS
        ? { kind: play.kind === 'heal-ram' ? ('ram' as const) : ('hp' as const), elapsedMs: playMs }
        : null
    const sweepMs = play?.kind === 'sweep' && playMs < SWEEP_MS ? playMs : null
    const status = heal
      ? { text: heal.kind === 'ram' ? '✚ RIPPERDOC · RAM RECHARGÉE' : '✚ RIPPERDOC · HP RESTAURÉS', color: GREEN }
      : sweepMs !== null
        ? { text: '◆ BREACH COMPLETE', color: CYAN }
        : null
    const sinceHit = r.hitAt == null ? Number.POSITIVE_INFINITY : Date.now() - r.hitAt
    const isHit = sinceHit < GLITCH_MS
    // a hit glitches the band, and so does the start of an event
    const glitchMs = isHit ? sinceHit : event && playMs < GLITCH_MS ? playMs : null

    if (e.surface === 'desktop' && 'Svg' in els) {
      const { Svg } = els
      const label = r.stamina === null ? 'HP inconnu' : `HP ${Math.round(100 - r.stamina)} sur 100`
      return (
        <Box>
          <Svg source={hudSvg(r, flavor(r.hearts, r.percent), 20, MAX, {
              glitchMs,
              event: event
                ? { id: event.id, phases: event.phases, color: event.color, outcome: outcomeColor(event), elapsedMs: playMs }
                : null,
              heal,
              sweepMs,
              status,
            })} alt={`${label}, RAM ${r.hearts} sur ${MAX}`} />
        </Box>
      )
    }
    const sep = <Text color={DIM}>{'  │  '}</Text>

    // FLATLINE: no HP left until the 5h window resets
    if (r.stamina !== null && r.stamina >= 100) {
      return (
        <Box>
          <Text mono>
            <Text color={RED} weight="bold">☠ FLATLINE </Text>
            <Text color={RED}>{'─'.repeat(3)}╱╲{'─'.repeat(20)}</Text>
            <Text color={DIM}>{` ${regenLabel(r.resetsAt)}`}</Text>
            {sep}
            <Text color={r.hearts > 2 ? RAM_COLOR : RED}>{`RAM ${r.hearts}/${MAX}`}</Text>
          </Text>
        </Box>
      )
    }

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
      const c = heal?.kind === 'hp' ? GREEN : left <= 20 ? RED : left <= 50 ? YELLOW : HP_COLOR
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
    const ramColor = heal?.kind === 'ram' ? GREEN : r.hearts > 2 ? RAM_COLOR : RED
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
          {event ? (
            <Text color={phaseAt(playMs) === 2 ? outcomeColor(event) : event.color} weight="bold">
              {event.phases[phaseAt(playMs)]}
            </Text>
          ) : status ? (
            <Text color={status.color} weight="bold">{status.text}</Text>
          ) : isHit ? (
            <Text color={RED} weight="bold">▚▞ SIGNAL CORROMPU ▞▚</Text>
          ) : (
            <Text color={r.hearts <= 2 ? RED : CYAN} italic>{flavor(r.hearts, r.percent)}</Text>
          )}
        </Text>
      </Box>
    )
  })
}
