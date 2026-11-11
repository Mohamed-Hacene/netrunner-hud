# Netrunner HUD

> A cyberpunk HUD mod for [Claude Code](https://claude.com/claude-code): your context window becomes **RAM**,
> your 5-hour token limit becomes **HP**, and every tool call turns into a quickhack.

![Version](https://img.shields.io/badge/version-0.3.0-FCEE0A?style=flat-square&labelColor=0A0A14)
![License](https://img.shields.io/badge/license-MIT-00F0FF?style=flat-square&labelColor=0A0A14)
![Claude Code mod](https://img.shields.io/badge/Claude%20Code-mod-FF003C?style=flat-square&labelColor=0A0A14)

🇫🇷 [Version française](README.fr.md)

<p align="center">
  <img src="docs/hud-healthy.svg" alt="HUD with HP at 72/100 and RAM at 7/10, status NEURAL LINK STABLE" width="760">
  <br>
  <img src="docs/hud-critical.svg" alt="HUD in critical state: HP at 14/100 and RAM at 2/10" width="760">
</p>

## Features

**HP / RAM band above the prompt**

- **HP**: what is left of your 5-hour token limit, with a countdown until it regenerates (`REGEN DANS 2H14`).
  Turns yellow below 50 and red, pulsing, below 20.
- **RAM**: 10 cells showing your free context window (`CONTEXTE · 64k / 200k`). The cell you just lost flashes red.
- **Status text** for every pair of HP and RAM levels (16 in all): `NEURAL LINK STABLE`, `RÉSERVES ENTAMÉES` when HP
  drops, `SURCHAUFFE CYBERDECK` when RAM fills, `☠ AU BORD DU FLATLINE` when both are critical…
- Drawn as SVG on desktop (slanted segments, glow, chromatic glitch), plain text in the terminal.
- **Night City scenery** behind the band (desktop): skyline, lit windows, horizon glow, faded into the app. The sky
  follows the time of day: night (19h–7h), dawn (7h–10h), smog by day (10h–16h), dusk (16h–19h).
- **Boot sequence** when a session starts, then a **welcome message** picked at random.
- **Glitch** when you take damage (a RAM cell lost, HP dropping a tens).
- **RIPPERDOC**: after `/compact`, RAM cells refill one by one in green; when your limit resets, so does HP.
- **FLATLINE**: at 0 HP the band becomes a flat heart monitor until it regenerates.
- **End of a reply**: a cyan sweep crosses the band (`◆ BREACH COMPLETE`).

**Night City backdrop** *(not supported by Claude Code yet)*: neon skyline, setting sun, perspective grid and an
animated scanline behind a tinted glass panel. The mod already ships it, but no current version of Claude Code
draws custom backdrops, so you will not see it for now. See [Compatibility](#compatibility).

<p align="center">
  <img src="docs/night-city.svg" alt="Night City backdrop: neon sun behind a dark skyline over a red perspective grid" width="760">
</p>

**Quickhack tool rows**: each tool call gets a tag under its row.

| Tool | Quickhack |
|---|---|
| `Bash`, `PowerShell` | SHORT CIRCUIT |
| `Read` | PING |
| `Grep` | BREACH PROTOCOL |
| `Glob` | SCAN |
| `Edit` | REBOOT OPTICS |
| `Write` | SYSTEM RESET |
| `WebFetch` | REMOTE UPLINK |
| `WebSearch` | NET DIVE |
| `Agent` | SUMMON DAEMON |

Errors show up as `✖ ICE DÉTECTÉ — CONTRE-HACK`, interruptions as `◼ QUICKHACK ANNULÉ`.

**Netrunning spinner**: "Breach Protocol", "Décryptage ICE", "Uplink Netwatch"…

**Toasts** when RAM runs low (with a `/compact` reminder), when HP hits critical, and when your limit resets.

**Random events**: about one every ten minutes at most, a three-step story plays in the band and the city reacts
(intrusion with red windows, Netwatch searchlight, power surge, acid rain…). A few **legendary** events are very rare,
and some words in your prompts trigger one (find them yourself). Purely visual: nothing is changed.

**Ambiance everywhere**: a channel header above Claude's replies, `◤ UPLINK ÉMIS` on your prompts (terminal),
`SÉQUENCE DE QUICKHACKS` on tool groups, `REQUÊTE NETWATCH` on questions, a status line, netrunner words on the turn
duration and the modes.

**Light on resources**: only the band redraws when it animates, never the transcript; desktop animations run inside
the SVG.

> The in-app texts are in French by default. Set `language` to `en` in [Settings](#settings) to get them in English.

## Gallery

Still frames of the desktop band, generated from the mod's own code with `npx tsx scripts/previews.mts`. In the app they are animated.

<p align="center">
  <img src="docs/boot.svg" alt="Boot sequence: SYNCHRO NEURALE step and a progress bar filling" width="760">
  <br><sub>Boot sequence when a session starts</sub>
</p>

<p align="center">
  <img src="docs/welcome.svg" alt="Welcome message: BIENVENUE À NIGHT CITY, CHOOM" width="760">
  <br><sub>Welcome message</sub>
</p>

<p align="center">
  <img src="docs/glitch.svg" alt="HUD split into red and cyan by the damage glitch" width="760">
  <br><sub>Damage glitch</sub>
</p>

<p align="center">
  <img src="docs/heal-ram.svg" alt="RAM cells refilling in green, RIPPERDOC · RAM RECHARGÉE" width="760">
  <br><sub>RIPPERDOC: RAM refilling after /compact</sub>
</p>

<p align="center">
  <img src="docs/flatline.svg" alt="Flat red heart monitor with FLATLINE and the regen countdown" width="760">
  <br><sub>FLATLINE at 0 HP</sub>
</p>

<p align="center">
  <img src="docs/event-intrusion.svg" alt="Intrusion event with red windows over the skyline" width="760">
  <br><sub>Event: intrusion, the city's windows turn red</sub>
</p>

<p align="center">
  <img src="docs/event-netwatch.svg" alt="Netwatch scan event with a searchlight beam over the skyline" width="760">
  <br><sub>Event: Netwatch searchlight</sub>
</p>

<p align="center">
  <img src="docs/event-acid-rain.svg" alt="Acid rain event with green streaks over the skyline" width="760">
  <br><sub>Event: acid rain</sub>
</p>

<p align="center">
  <img src="docs/event-legendary.svg" alt="Legendary Black ICE event, the city glowing magenta" width="760">
  <br><sub>Legendary event</sub>
</p>

<p align="center">
  <img src="docs/sky-dawn.svg" alt="HUD over an orange dawn sky" width="760">
  <br><sub>Dawn and dusk sky (7h–10h, 16h–19h)</sub>
</p>

<p align="center">
  <img src="docs/sky-day.svg" alt="HUD over a grey smog sky" width="760">
  <br><sub>Day sky, smog (10h–16h)</sub>
</p>

## Installation

Clone the repository into your Claude Code mods folder, then start a new session:

```bash
git clone https://github.com/Mohamed-Hacene/netrunner-hud.git ~/.claude/mods/netrunner-hud
```

To update:

```bash
git -C ~/.claude/mods/netrunner-hud pull
```

To uninstall, delete the `~/.claude/mods/netrunner-hud` folder.

### Compatibility

| Surface | HP / RAM band | Backdrop | Quickhacks and spinner |
|---|---|---|---|
| Desktop app | SVG | ❌ not supported yet | ✅ |
| Terminal | Text | ❌ | ✅ |

> [!NOTE]
> Claude Code does not draw custom backdrops at the moment. The Night City backdrop is included and ready:
> `/nightcity` tells you it is waiting, and the backdrop will show up on its own once Claude Code supports it.

## Commands

| Command | Effect |
|---|---|
| `/hud` | Show or hide the HP / RAM band |
| `/nightcity` | Turn the Night City backdrop on or off (no visible effect until Claude Code supports backdrops) |
| `/netfx` | Turn the random events on or off (plays one right away when turned on) |

All three settings are remembered between sessions.

## Settings

Change them in Claude Code's config menu (`/config` in the terminal), under netrunner-hud. A change reloads the mod.

| Setting | Values | Default |
|---|---|---|
| `language` | `fr`, `en` | `fr` |
| `ramCells` | number of RAM cells, 5 to 10 | `10` |
| `eventFrequency` | random events: `rare`, `normal`, `frequent` (`/netfx` turns them off) | `normal` |
| `hpColor` | color of the HP bar, `#RRGGBB` | `#5EF6E0` |
| `ramColor` | color of the RAM cells, `#RRGGBB` | `#3E8EFF` |

Where there is no config menu (the desktop app), write them in `~/.claude/settings.json`:

```json
"pluginConfigs": {
  "netrunner-hud": { "options": { "language": "en", "ramCells": 8 } }
}
```

They are stored by Claude Code, not in the mod's folder, so updating the mod keeps them.

## How it works

| Hook | What the mod does |
|---|---|
| `session.start` | Registers the commands, restores the saved settings, applies the theme, plays the boot and welcome, redraws the band every minute (regen countdown) and may start a random event |
| `session.measure` | Turns context usage and the `five_hour` rate limit into a `Reading` (RAM cells, HP), stores it, fires toasts, the damage glitch and the RIPPERDOC healing |
| `turn.complete` | Plays the end-of-reply sweep |
| `prompt.submit` | Plays an event when your prompt holds one of its keywords (the prompt is passed on unchanged) |
| `ui.render` · `AbovePrompt` | Draws the HP / RAM band |
| `ui.render` · `Backdrop` | Draws the Night City skyline (not called by Claude Code yet) |
| `ui.render` · `ToolUse` | Adds the quickhack tag under each tool row |
| `ui.render` · `Spinner` | Swaps the spinner words for netrunning ones |
| `ui.render` · transcript and footer | Headers on replies, prompts, tool groups, questions and command output; turn duration, modes, hint line |

```
.claude-plugin/plugin.json   # mod manifest (name, version, description)
hooks/hooks.json             # entry point, loads register.tsx
hooks/register.tsx           # state, commands, theme, band rendering, effects, quickhacks, toasts
hooks/config.ts              # the settings, checked and with their defaults
hooks/hud-svg.ts             # band SVG (desktop): HUD, scenery, boot, welcome, flatline, effects
hooks/ambiance.tsx           # netrunner dressing for the transcript and the prompt's footer
hooks/events.ts              # random, legendary and keyword events
hooks/flavor.ts              # status texts from the HP and RAM levels
hooks/theme.ts               # colors, thresholds, number formatting
hooks/i18n.ts                # every text the mod shows, in French and English
hooks/backdrop.ts            # Night City backdrop as SVG
types/index.d.ts             # Reading type and the mod's persisted state
docs/                        # preview images used in this README
scripts/previews.mts         # regenerates the previews in docs/ (npx tsx scripts/previews.mts)
```

## Customization

Language, number of cells, event frequency and the HP / RAM colors are [Settings](#settings). For the rest, edit
these files (an update of the mod overwrites them):

| What | Where |
|---|---|
| Every text: status texts (`flavor.grid`), toasts, events, welcome messages, boot steps, spinner, transcript headers | `hooks/i18n.ts` |
| Other colors, thresholds | `hooks/theme.ts` |
| Events, keywords | `hooks/events.ts` |
| Scenery skies by time of day | `SKIES` and `skyAt()` in `hooks/hud-svg.ts` |
| Quickhack names | `QUICKHACK` in `hooks/register.tsx` |
| Words on the turn duration | `TURN_WORDS` in `hooks/ambiance.tsx` |
| Skyline, sun, grid | `hooks/backdrop.ts` |

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

---

Unofficial fan project, not affiliated with or endorsed by CD PROJEKT RED or Anthropic.
*Cyberpunk* and *Night City* are trademarks of their respective owners.
