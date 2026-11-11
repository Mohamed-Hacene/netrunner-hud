# Netrunner HUD

> Un mod HUD cyberpunk pour [Claude Code](https://claude.com/claude-code) : la fenêtre de contexte devient ta **RAM**,
> la limite de tokens sur 5 heures devient tes **HP**, et chaque appel d'outil devient un quickhack.

🇬🇧 [English version](README.md)

<p align="center">
  <img src="docs/hud-healthy.svg" alt="HUD avec HP à 72 sur 100 et RAM à 7 sur 10, état NEURAL LINK STABLE" width="760">
  <br>
  <img src="docs/hud-critical.svg" alt="HUD en état critique : HP à 14 sur 100 et RAM à 2 sur 10" width="760">
</p>

## Fonctionnalités

**Barre HP / RAM au-dessus du prompt**

- **HP** : ce qui reste de la limite de tokens sur 5 h, avec le compte à rebours avant la régénération
  (`REGEN DANS 2H14`). Passe au jaune sous 50, au rouge et clignote sous 20.
- **RAM** : 10 cellules pour le contexte libre (`CONTEXTE · 64k / 200k`). La cellule qui vient de sauter s'affiche en rouge.
- **Texte d'ambiance** pour chaque combinaison de niveaux HP et RAM (16 en tout) : `NEURAL LINK STABLE`,
  `RÉSERVES ENTAMÉES` quand les HP baissent, `SURCHAUFFE CYBERDECK` quand la RAM se remplit, `☠ AU BORD DU FLATLINE`
  quand les deux sont critiques…
- Rendu SVG dans l'app de bureau (segments inclinés, lueur, glitch chromatique), version texte dans le terminal.
- **Décor Night City** derrière la barre (app de bureau) : skyline, fenêtres allumées, lueur à l'horizon, fondu dans
  l'app. Le ciel suit l'heure : nuit (19 h–7 h), aube (7 h–10 h), smog en journée (10 h–16 h), crépuscule (16 h–19 h).
- **Séquence de boot** au démarrage d'une session, puis un **message de bienvenue** tiré au hasard.
- **Glitch** quand tu prends des dégâts (cellule RAM perdue, HP qui passent une dizaine).
- **RIPPERDOC** : après un `/compact`, les cellules RAM se remplissent une à une en vert ; à la réinitialisation de
  la limite, les HP aussi.
- **FLATLINE** : à 0 HP, la barre devient un électrocardiogramme plat jusqu'à la régénération.
- **Fin de réponse** : un balayage cyan traverse la barre (`◆ BREACH COMPLETE`).

**Fond Night City** *(pas encore pris en charge par Claude Code)* : skyline néon, soleil couchant, grille en
perspective et ligne de balayage animée, derrière un panneau de verre teinté. Le mod l'inclut déjà, mais aucune
version actuelle de Claude Code n'affiche de fond personnalisé : tu ne le verras donc pas pour l'instant.

<p align="center">
  <img src="docs/night-city.svg" alt="Fond Night City : soleil néon derrière une skyline sombre au-dessus d'une grille rouge" width="760">
</p>

**Outils en quickhacks** : chaque appel d'outil reçoit une étiquette (`Bash` → SHORT CIRCUIT, `Grep` → BREACH PROTOCOL,
`Edit` → REBOOT OPTICS…, liste complète dans le [README anglais](README.md#features)). Une erreur s'affiche en
`✖ ICE DÉTECTÉ — CONTRE-HACK`.

**Indicateur d'activité** : « Breach Protocol », « Décryptage ICE », « Uplink Netwatch »…

**Notifications** quand la RAM devient faible (avec un rappel de `/compact`), quand les HP sont critiques et quand
la limite se réinitialise.

**Évènements aléatoires** : environ un toutes les dix minutes au plus, une petite histoire en trois temps se joue dans
la barre et la ville réagit (intrusion et fenêtres rouges, projecteur de Netwatch, surtension, pluie acide…). Quelques
évènements **légendaires** sont très rares, et certains mots dans tes messages en déclenchent (à toi de les trouver).
Purement visuel : rien n'est modifié.

**Ambiance partout** : en-tête de canal au-dessus des réponses de Claude, `◤ UPLINK ÉMIS` sur tes messages (terminal),
`SÉQUENCE DE QUICKHACKS` sur les groupes d'outils, `REQUÊTE NETWATCH` sur les questions, ligne de statut, mots
netrunner sur la durée des réponses et les modes.

**Léger** : seule la barre est redessinée quand elle s'anime, jamais le fil de la conversation ; les animations de
l'app de bureau tournent dans le SVG.

## Galerie

Images figées de la barre sur l'app de bureau, générées depuis le code du mod avec `npx tsx scripts/previews.mts`. Dans l'app, elles sont animées.

<p align="center">
  <img src="docs/boot.svg" alt="Séquence de boot : étape SYNCHRO NEURALE et barre de progression" width="760">
  <br><sub>Séquence de boot au démarrage d'une session</sub>
</p>

<p align="center">
  <img src="docs/welcome.svg" alt="Message de bienvenue : BIENVENUE À NIGHT CITY, CHOOM" width="760">
  <br><sub>Message de bienvenue</sub>
</p>

<p align="center">
  <img src="docs/glitch.svg" alt="HUD dédoublé en rouge et cyan par le glitch de dégâts" width="760">
  <br><sub>Glitch de dégâts</sub>
</p>

<p align="center">
  <img src="docs/heal-ram.svg" alt="Cellules RAM qui se remplissent en vert, RIPPERDOC · RAM RECHARGÉE" width="760">
  <br><sub>RIPPERDOC : la RAM se recharge après /compact</sub>
</p>

<p align="center">
  <img src="docs/flatline.svg" alt="Électrocardiogramme plat et rouge avec FLATLINE et le compte à rebours" width="760">
  <br><sub>FLATLINE à 0 HP</sub>
</p>

<p align="center">
  <img src="docs/event-intrusion.svg" alt="Évènement intrusion avec des fenêtres rouges sur la skyline" width="760">
  <br><sub>Évènement : intrusion, les fenêtres de la ville virent au rouge</sub>
</p>

<p align="center">
  <img src="docs/event-netwatch.svg" alt="Évènement scan Netwatch avec un faisceau de projecteur sur la skyline" width="760">
  <br><sub>Évènement : projecteur de Netwatch</sub>
</p>

<p align="center">
  <img src="docs/event-acid-rain.svg" alt="Évènement pluie acide avec des traits verts sur la skyline" width="760">
  <br><sub>Évènement : pluie acide</sub>
</p>

<p align="center">
  <img src="docs/event-legendary.svg" alt="Évènement légendaire Black ICE, la ville en magenta" width="760">
  <br><sub>Évènement légendaire</sub>
</p>

<p align="center">
  <img src="docs/sky-dawn.svg" alt="HUD sur un ciel d'aube orangé" width="760">
  <br><sub>Ciel d'aube et de crépuscule (7 h–10 h, 16 h–19 h)</sub>
</p>

<p align="center">
  <img src="docs/sky-day.svg" alt="HUD sur un ciel de smog gris" width="760">
  <br><sub>Ciel de jour, smog (10 h–16 h)</sub>
</p>

## Installation

Cloner le dépôt dans le dossier des mods de Claude Code, puis ouvrir une nouvelle session :

```bash
git clone https://github.com/Mohamed-Hacene/netrunner-hud.git ~/.claude/mods/netrunner-hud
```

Mise à jour :

```bash
git -C ~/.claude/mods/netrunner-hud pull
```

Pour désinstaller, supprimer le dossier `~/.claude/mods/netrunner-hud`.

> [!NOTE]
> Claude Code n'affiche pas encore de fond personnalisé. Le fond Night City est inclus et prêt : `/nightcity`
> indique qu'il est en attente, et il apparaîtra tout seul quand Claude Code le prendra en charge.

## Commandes

| Commande | Effet |
|---|---|
| `/hud` | Affiche ou masque la barre HP / RAM |
| `/nightcity` | Active ou coupe le fond Night City (sans effet visible tant que Claude Code ne gère pas les fonds) |
| `/netfx` | Active ou coupe les évènements aléatoires (en joue un tout de suite quand tu les actives) |

Les trois réglages sont conservés d'une session à l'autre.

## Réglages

À changer dans le menu de config de Claude Code (`/config` dans le terminal), rubrique netrunner-hud. Un changement
recharge le mod.

| Réglage | Valeurs | Par défaut |
|---|---|---|
| `language` | `fr`, `en` | `fr` |
| `ramCells` | nombre de cellules de RAM, de 5 à 10 | `10` |
| `eventFrequency` | évènements aléatoires : `rare`, `normal`, `frequent` (`/netfx` les coupe) | `normal` |
| `hpColor` | couleur de la barre HP, `#RRGGBB` | `#5EF6E0` |
| `ramColor` | couleur des cellules de RAM, `#RRGGBB` | `#3E8EFF` |

Là où il n'y a pas de menu de config (l'app desktop), écris-les dans `~/.claude/settings.json` :

```json
"pluginConfigs": {
  "netrunner-hud": { "options": { "language": "en", "ramCells": 8 } }
}
```

Ils sont gardés par Claude Code, pas dans le dossier du mod : une mise à jour du mod les conserve.

## Personnalisation

La langue, le nombre de cellules, la fréquence des évènements et les couleurs HP / RAM sont des
[Réglages](#réglages). Pour le reste, modifie ces fichiers (une mise à jour du mod les écrase) :

| Quoi | Où |
|---|---|
| Tous les textes : textes d'ambiance (`flavor.grid`), notifications, évènements, bienvenue, boot, indicateur, en-têtes du fil | `hooks/i18n.ts` |
| Autres couleurs, paliers | `hooks/theme.ts` |
| Évènements, mots-clés | `hooks/events.ts` |
| Ciels du décor selon l'heure | `SKIES` et `skyAt()` dans `hooks/hud-svg.ts` |
| Noms des quickhacks | `QUICKHACK` dans `hooks/register.tsx` |
| Mots de la durée du tour | `TURN_WORDS` dans `hooks/ambiance.tsx` |
| Skyline, soleil, grille | `hooks/backdrop.ts` |

## Contribuer

Les issues et pull requests sont les bienvenues, voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE)

---

Projet de fan non officiel, sans lien avec CD PROJEKT RED ni Anthropic.
*Cyberpunk* et *Night City* sont des marques de leurs propriétaires respectifs.
