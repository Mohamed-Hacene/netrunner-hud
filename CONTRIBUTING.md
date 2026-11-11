# Contributing

Thanks for wanting to improve Netrunner HUD!

## Reporting a bug or suggesting an idea

Open an [issue](https://github.com/Mohamed-Hacene/netrunner-hud/issues/new/choose) using one of the templates.
For a bug, include your surface (desktop app or terminal), your Claude Code version and a screenshot if possible.

## Working on the code

1. Fork the repository and clone your fork into `~/.claude/mods/netrunner-hud`
   (move your current install aside first).
2. Create a branch: `git checkout -b feat/my-change`.
3. Make your change, then start a new Claude Code session to load it. Check both the desktop app and the terminal
   when you touch the band.
4. If you change how the band looks, regenerate the preview images in `docs/` with `npx tsx scripts/previews.mts`
   (add a preview there for a new effect). The Night City backdrop image is not generated.
5. Add a line under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
6. Open a pull request describing what changed and why, with a before / after screenshot for visual changes.

## Style

- TypeScript, 2-space indentation, single quotes, no semicolons (see [.editorconfig](.editorconfig)).
- Keep the mod dependency-free: everything is plain TypeScript and inline SVG.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`).
- User-facing texts live in `hooks/i18n.ts`, in French and English: add each new text to both, in the existing tone.
