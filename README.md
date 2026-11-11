# Netrunner HUD

Mod Claude Code au style cyberpunk : la fenêtre de contexte devient ta **RAM**, la limite de tokens sur 5 heures
devient tes **HP**, et l'interface se met à parler netrunner.

## Ce que fait le mod

- **Barre HUD au-dessus du prompt**
  - **HP** : ce qui reste de la limite de tokens sur 5 h, avec le compte à rebours avant la régénération
    (`REGEN DANS 2H14`). Passe au jaune sous 50, au rouge et clignote sous 20.
  - **RAM** : 10 cellules pour le contexte libre (`CONTEXTE · 84k / 200k`). Une cellule qui saute s'affiche en rouge.
  - Un texte d'ambiance selon l'état : `NEURAL LINK STABLE`, `SURCHAUFFE CYBERDECK`, `☠ FLATLINE`…
  - Rendu SVG (segments inclinés, lueur, glitch chromatique) dans l'app de bureau, version texte dans le terminal.
- **Fond « Night City »** : skyline néon, soleil couchant, grille en perspective et ligne de balayage animée.
- **Outils renommés en quickhacks** : `Bash` → SHORT CIRCUIT, `Grep` → BREACH PROTOCOL, `Edit` → REBOOT OPTICS…
  Une erreur s'affiche en `✖ ICE DÉTECTÉ — CONTRE-HACK`.
- **Indicateur d'activité** : « Breach Protocol », « Décryptage ICE », « Uplink Netwatch »…
- **Notifications** quand la RAM devient faible (avec un rappel de `/compact`), quand les HP sont critiques
  ou quand la limite se réinitialise.

## Commandes

| Commande | Effet |
|---|---|
| `/hud` | Affiche ou masque la barre HP / RAM |
| `/nightcity` | Active ou coupe le fond Night City |

## Installation

Cloner le dépôt dans le dossier des mods de Claude Code :

```bash
git clone https://github.com/<ton-compte>/netrunner-hud.git ~/.claude/mods/netrunner-hud
```

Puis relancer une session Claude Code. Le fond Night City n'apparaît que sur les versions de l'app qui savent
dessiner un fond ; sinon `/nightcity` le signale et il s'affichera après une mise à jour.

## Structure

```
.claude-plugin/plugin.json   # nom, version, description du mod
hooks/hooks.json             # point d'entrée (charge register.tsx)
hooks/register.tsx           # commandes, thème, rendu de la barre, quickhacks, notifications
hooks/hud-svg.ts             # barre HP / RAM dessinée en SVG (app de bureau)
hooks/backdrop.ts            # fond Night City en SVG
types/index.d.ts             # type de la mesure stockée (Reading) et état du mod
```

## Personnalisation

Les couleurs sont en tête de `hooks/register.tsx` et `hooks/hud-svg.ts`, les noms de quickhacks dans `QUICKHACK`,
les textes de l'indicateur dans `SPIN_WORDS` et les paliers d'ambiance dans `flavor()`.

---

Projet de fan non officiel, sans lien avec CD PROJEKT RED. *Cyberpunk* et *Night City* appartiennent à leurs
propriétaires respectifs.
