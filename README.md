# Netrunner HUD

> A cyberpunk HUD mod for [Claude Code](https://claude.com/claude-code): your context window becomes **RAM**,
> your 5-hour token limit becomes **HP**, and every tool call turns into a quickhack.

![Version](https://img.shields.io/badge/version-0.1.0-FCEE0A?style=flat-square&labelColor=0A0A14)
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
- **Status line** that follows your state: `NEURAL LINK STABLE`, `SURCHAUFFE CYBERDECK`, `☠ FLATLINE`…
- Drawn as SVG on desktop (slanted segments, glow, chromatic glitch), plain text in the terminal.

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

> The in-app texts are in French. See [Customization](#customization) to translate them.

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

Both settings are remembered between sessions.

## How it works

| Hook | What the mod does |
|---|---|
| `session.start` | Registers the commands, applies the theme, redraws the band every minute so the regen countdown stays current |
| `session.measure` | Turns context usage and the `five_hour` rate limit into a `Reading` (RAM cells, HP), stores it, fires toasts on thresholds |
| `ui.render` · `AbovePrompt` | Draws the HP / RAM band |
| `ui.render` · `Backdrop` | Draws the Night City skyline (not called by Claude Code yet) |
| `ui.render` · `ToolUse` | Adds the quickhack tag under each tool row |
| `ui.render` · `Spinner` | Swaps the spinner words for netrunning ones |

```
.claude-plugin/plugin.json   # mod manifest (name, version, description)
hooks/hooks.json             # entry point, loads register.tsx
hooks/register.tsx           # commands, theme, band rendering, quickhacks, toasts
hooks/hud-svg.ts             # HP / RAM band drawn as SVG (desktop)
hooks/backdrop.ts            # Night City backdrop as SVG
types/index.d.ts             # Reading type and the mod's persisted state
docs/                        # preview images used in this README
```

## Customization

Everything lives in a few constants:

| What | Where |
|---|---|
| Colors | top of `hooks/register.tsx` and `hooks/hud-svg.ts` |
| Number of RAM cells | `MAX` in `hooks/register.tsx` |
| Quickhack names | `QUICKHACK` in `hooks/register.tsx` |
| Spinner words | `SPIN_WORDS` in `hooks/register.tsx` |
| Status lines and thresholds | `flavor()` in `hooks/register.tsx` |
| Toast messages | `session.measure` handler in `hooks/register.tsx` |
| Skyline, sun, grid | `hooks/backdrop.ts` |

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

---

Unofficial fan project, not affiliated with or endorsed by CD PROJEKT RED or Anthropic.
*Cyberpunk* and *Night City* are trademarks of their respective owners.
