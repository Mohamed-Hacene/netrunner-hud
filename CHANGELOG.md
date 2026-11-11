# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Removed a no-op expression in the HP bar rendering and normalized string quotes.

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
