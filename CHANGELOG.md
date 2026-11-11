# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Boot sequence in the band when a session starts: netrunner boot steps, a filling progress bar and a `JACK IN` flash.
- A welcome message after the boot sequence, picked at random each session.
- The scenery follows the time of day: night, dawn and dusk, smog by day.
- RIPPERDOC healing: after `/compact`, RAM cells refill one by one in green; when the 5h limit resets, HP do too.
- FLATLINE screen at 0 HP: a flat heart monitor until the limit resets.
- A cyan sweep across the band at the end of each reply.
- The city reacts to events: red windows on an intrusion, a Netwatch searchlight, flickering windows on a surge,
  acid rain.
- Rare legendary events, and hidden events played by keywords in your prompts.
- Night City scenery (skyline, horizon glow, scanlines) behind the band on desktop, drawn once and static.
- Damage glitch: the band shakes and splits into red / cyan for a moment when you lose a RAM cell or drop into a lower
  tens of HP (desktop); the terminal shows `SIGNAL CORROMPU` instead.
- Netrunner past-tense words on the line that closes a turn (`Breached for 12s`).
- Netrunner style for the footer mode labels.
- A dim netrunner tail after the hint line under the prompt (terminal).
- Random cosmetic events in the band (intrusion, Netwatch scan, hostile daemon…), about one every ten minutes at
  most; `/netfx` turns them on or off and plays one when turned on.
- Netrunner headers above Claude's replies, your prompts (terminal), folded runs of tool calls, the mod's own command
  replies and the questions Claude asks.
- A status line under the prompt (`NETRUNNER ONLINE · ICE PASSIF`, `ICE ACTIF` when RAM or HP run low).

### Changed

- Removed a no-op expression in the HP bar rendering and normalized string quotes.
- `/nightcity` now shows why the backdrop is not drawn, as reported by Claude Code.
- The README lists the new features, `/netfx` and the files of the mod.
- Preview images in `docs/` regenerated for the new look, with a gallery of every effect in the READMEs, made by
  `scripts/previews.mts`.
- The band no longer redraws the whole transcript: the countdown, the boot sequence and the effects redraw the band alone.

### Fixed

- `/hud`, `/nightcity` and `/netfx` are now really remembered between sessions, as the README said.

### Documentation

- Stated that the Night City backdrop is not supported by Claude Code yet.

## [0.1.0] - 2026-11-11

### Added

- HP bar for the 5-hour token limit, with a regen countdown and color thresholds.
- RAM cells for the free context window, with a burst marker on the cell just lost.
- SVG rendering of the band on desktop, text fallback in the terminal.
- Night City backdrop with tinted glass panel.
- Quickhack tags on tool rows and netrunning spinner words.
- Toasts for low RAM, critical HP and limit reset.
- `/hud` and `/nightcity` commands, persisted between sessions.

[Unreleased]: https://github.com/Mohamed-Hacene/netrunner-hud/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Mohamed-Hacene/netrunner-hud/releases/tag/v0.1.0
