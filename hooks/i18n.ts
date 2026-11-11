// Every text the mod shows, in French and in English. `t()` gives the ones of the language chosen
// in the config; call it while drawing or reacting, never when a module loads, so it follows the config.
import { config } from './config'

type Phases = readonly [string, string, string]
type Level = 'ok' | 'mid' | 'low' | 'crit'
/** One message per RAM level (rows) and HP level (columns). */
type Grid = Record<Level, Record<Level, string>>

const fr = {
  /**
   * Status text of the band: `grid[ram][hp]`, for each level of the RAM and of the HP (see `flavor.ts`);
   * `idle` before the first exchange. Keep each one short (about 24 characters): it shares the band.
   */
  flavor: {
    idle: 'SYSTÈMES EN LIGNE',
    grid: {
      ok: { ok: 'NEURAL LINK STABLE', mid: 'RÉSERVES ENTAMÉES', low: 'SANG SYNTH EN BAISSE', crit: '⚠ VITAUX CRITIQUES' },
      mid: { ok: 'CHARGE RAM MODÉRÉE', mid: 'SOUS PRESSION', low: 'DECK CHARGÉ · HP BAS', crit: '⚠ VITAUX · DECK CHARGÉ' },
      low: { ok: 'SURCHAUFFE CYBERDECK', mid: 'SURCHAUFFE · HP ENTAMÉS', low: 'DECK ET CORPS À BOUT', crit: '⚠ VITAUX · SURCHAUFFE' },
      crit: { ok: '⚠ CYBERPSYCHOSE IMMINENTE', mid: '⚠ PSYCHOSE · HP ENTAMÉS', low: '⚠ PSYCHOSE · HP BAS', crit: '☠ AU BORD DU FLATLINE' },
    } as Grid,
  },
  /** The mod's status line under the prompt: calm, or which gauge is critical. */
  statusLine: {
    calm: '◢ NETRUNNER ONLINE · ICE PASSIF',
    ramAlert: '⚠ ICE ACTIF · DECK SATURÉ',
    hpAlert: '⚠ ICE ACTIF · RÉSERVES À SEC',
    bothAlert: '⚠ ICE ACTIF · TRACE NETWATCH EN COURS',
  },
  commands: {
    hud: 'Afficher / masquer la barre RAM Netrunner',
    nightcity: 'Activer / couper le fond Night City',
    netfx: 'Activer / couper les évènements aléatoires du Net',
  },
  replies: {
    hudHidden: 'HUD Netrunner masqué.',
    hudShown: 'HUD Netrunner affiché.',
    cityOff: 'Night City déconnecté.',
    cityOn: 'Bienvenue à Night City, choom.',
    cityWaiting: (reason: string) =>
      `Night City en attente : aucun fond dessiné pour l'instant (${reason}). Il s'affichera tout seul dès que l'app le permettra.`,
    fxOff: 'Évènements aléatoires coupés.',
    fxOn: 'Évènements aléatoires activés. Le Net s’agite…',
  },
  /** Spinner words, by the spinner's mode. */
  spin: {
    thinking: ['Breach Protocol', 'Décryptage ICE', 'Calcul neural', 'Analyse Braindance'],
    requesting: ['Uplink Netwatch', 'Ping Relic', 'Connexion au Net'],
    responding: ['Transmission', 'Upload holo', 'Émission sur le Net'],
    'tool-input': ['Chargement quickhack'],
    'tool-use': ['Quickhack en cours', 'Daemon actif'],
  } as Record<string, readonly string[]>,
  /** The tag under a tool row. */
  hack: {
    cancelled: '◼ QUICKHACK ANNULÉ',
    errored: '✖ ICE DÉTECTÉ — CONTRE-HACK',
    running: (hack: string) => `◢ UPLOAD ${hack}…`,
    done: (hack: string) => `◆ ${hack} EXÉCUTÉ`,
  },
  toast: {
    ramRecharged: '🔋 RAM rechargée : contexte purgé',
    ramEmpty: '⛔ RAM vide — contexte saturé, lance /compact',
    ramLow: '⚠ RAM faible — pense à /compact, choom',
    hpRestored: '🩺 RIPPERDOC : HP restaurés, limite réinitialisée',
    flatline: '☠ FLATLINE — plus de tokens jusqu’à la réinitialisation',
    hpCritical: '⚠ HP CRITIQUES — utilise un MaxDoc, choom',
  },
  band: {
    ripperRam: '✚ RIPPERDOC · RAM RECHARGÉE',
    ripperHp: '✚ RIPPERDOC · HP RESTAURÉS',
    breachComplete: '◆ BREACH COMPLETE',
    corrupted: '▚▞ SIGNAL CORROMPU ▞▚',
    syncing: 'SYNCHRO…',
    context: 'CONTEXTE',
    noTokens: 'PLUS DE TOKENS',
    neuralLink: 'CONNEXION NEURALE',
    jackIn: '◢ JACK IN ◣',
  },
  regen: {
    unknown: 'LIMITE TOKENS · 5H',
    imminent: 'REGEN IMMINENTE',
    inHours: (h: number, mm: string) => `REGEN DANS ${h}H${mm}`,
    inMinutes: (m: number) => `REGEN DANS ${m} MIN`,
  },
  /** Texts read aloud for the band's images. */
  alt: {
    backdrop: 'Skyline néon de Night City',
    boot: 'Séquence de démarrage du cyberdeck',
    hpUnknown: 'HP inconnu',
    hp: (n: number) => `HP ${n} sur 100`,
    ram: (n: number, max: number) => `RAM ${n} sur ${max}`,
  },
  /** The boot steps, one after another; "JACK IN" follows the last. Keep as many in each language. */
  boot: ['KIROSHI OS v2.0.77', 'SYNCHRO NEURALE', 'PARE-FEU ICE', 'CONNEXION AU NET'] as readonly string[],
  /** One is picked at random each session: a title and a line under it. Keep as many in each language. */
  welcomes: [
    ['BIENVENUE À NIGHT CITY, CHOOM', 'LIAISON NEURALE ÉTABLIE · BONNE CHASSE SUR LE NET'],
    ['CONNEXION ÉTABLIE', 'LE NET T’ATTENDAIT, NETRUNNER'],
    ['JACK IN RÉUSSI', 'TOUS LES SYSTÈMES AU VERT · ICE EN VEILLE'],
    ['DE RETOUR SUR LE NET', 'CYBERDECK CHAUD · QUICKHACKS CHARGÉS'],
    ['LA NUIT EST JEUNE, CHOOM', 'NIGHT CITY NE DORT JAMAIS · TOI NON PLUS'],
  ] as readonly (readonly [string, string])[],
  /** The three steps of each event, by its id (see `events.ts`). */
  events: {
    intrusion: ['⚠ INTRUSION DÉTECTÉE', 'CONTRE-MESURES ACTIVÉES…', '✔ ICE REPOUSSÉ'],
    netwatch: ['◉ SCAN NETWATCH EN COURS', 'BROUILLAGE DE LA SIGNATURE…', '✔ TRACE PERDUE'],
    daemon: ['☣ DAEMON HOSTILE DÉTECTÉ', 'MISE EN QUARANTAINE…', '✔ DAEMON PURGÉ'],
    shard: ['✉ PAQUET CRYPTÉ INTERCEPTÉ', 'DÉCRYPTAGE…', '« LE NET SE SOUVIENT DE TOI »'],
    surge: ['⚡ SURTENSION DU CYBERDECK', 'DÉLESTAGE DES IMPLANTS…', '✔ TENSION STABILISÉE'],
    ghost: ['◌ SIGNAL FANTÔME SUR LE RÉSEAU', 'TRIANGULATION…', '✖ SOURCE INTROUVABLE'],
    breach: ['⚠ BREACH ENTRANT', 'PARE-FEU EN SURCHARGE…', '✔ CONNEXION COUPÉE'],
    'acid-rain': ['☂ PLUIE ACIDE SUR NIGHT CITY', 'BOUCLIERS DU CYBERDECK…', '✔ AVERSE TERMINÉE'],
    'legend-black-ice': ['✦ BLACK ICE LÉGENDAIRE', 'IL TE REGARDE AUSSI…', '✦ TU AS SURVÉCU, NETRUNNER'],
    'legend-rogue-ai': ['✦ UNE IA ROGUE FRAPPE AU PARE-FEU', 'ELLE CONNAÎT TON NOM…', '✦ CONTACT ROMPU · POUR L’INSTANT'],
    'legend-old-net': ['✦ UN FANTÔME DU VIEUX NET', 'IL MURMURE DES COORDONNÉES…', '✦ SIGNAL ÉVANOUI DANS LE BRUIT'],
    choom: ['◢ CHOOM DÉTECTÉ', 'ANALYSE DU PROFIL…', '✔ NETRUNNER CONFIRMÉ · SALUT, CHOOM'],
  } as Record<string, Phases>,
  /** The transcript and the prompt's footer. */
  ambiance: {
    modes: { focus: '◢ FOCUS NEURAL', 'memory paused': '◢ MÉMOIRE GELÉE' } as Record<string, string>,
    hintIdle: ['⟁ jack in, choom', '⟁ le Net t’attend', '⟁ ICE en veille'] as readonly string[],
    hintWorking: ['⟁ netrunning…', '⟁ daemon actif', '⟁ breach en cours'] as readonly string[],
    replyHeaders: ['TRANSMISSION ENTRANTE', 'FLUX DÉCRYPTÉ', 'SIGNAL CAPTÉ', 'PAQUET REÇU', 'LIAISON ÉTABLIE'] as readonly string[],
    channel: 'CANAL',
    uplink: '◤ UPLINK ÉMIS',
    sequence: (n: number) => `◢ SÉQUENCE DE QUICKHACKS ×${n}`,
    netwatch: '⚠ REQUÊTE NETWATCH — RÉPONSE REQUISE',
  },
}

export type Strings = typeof fr

const en: Strings = {
  flavor: {
    idle: 'SYSTEMS ONLINE',
    grid: {
      ok: { ok: 'NEURAL LINK STABLE', mid: 'RESERVES TAPPED', low: 'SYNTH-BLOOD LOW', crit: '⚠ VITALS CRITICAL' },
      mid: { ok: 'MODERATE RAM LOAD', mid: 'UNDER PRESSURE', low: 'DECK LOADED · HP LOW', crit: '⚠ VITALS · DECK LOADED' },
      low: { ok: 'CYBERDECK OVERHEATING', mid: 'OVERHEAT · HP TAPPED', low: 'DECK AND BODY WORN OUT', crit: '⚠ VITALS · OVERHEATING' },
      crit: { ok: '⚠ CYBERPSYCHOSIS IMMINENT', mid: '⚠ PSYCHOSIS · HP TAPPED', low: '⚠ PSYCHOSIS · HP LOW', crit: '☠ EDGE OF FLATLINE' },
    },
  },
  statusLine: {
    calm: '◢ NETRUNNER ONLINE · ICE PASSIVE',
    ramAlert: '⚠ ICE ACTIVE · DECK OVERLOADED',
    hpAlert: '⚠ ICE ACTIVE · RESERVES DRY',
    bothAlert: '⚠ ICE ACTIVE · NETWATCH TRACE IN PROGRESS',
  },
  commands: {
    hud: 'Show / hide the Netrunner HUD band',
    nightcity: 'Turn the Night City backdrop on / off',
    netfx: 'Turn random Net events on / off',
  },
  replies: {
    hudHidden: 'Netrunner HUD hidden.',
    hudShown: 'Netrunner HUD shown.',
    cityOff: 'Night City disconnected.',
    cityOn: 'Welcome to Night City, choom.',
    cityWaiting: (reason: string) =>
      `Night City on hold: no backdrop drawn yet (${reason}). It will show up on its own once the app allows it.`,
    fxOff: 'Random events off.',
    fxOn: 'Random events on. The Net is stirring…',
  },
  spin: {
    thinking: ['Breach Protocol', 'Decrypting ICE', 'Neural compute', 'Braindance scan'],
    requesting: ['Netwatch uplink', 'Pinging the Relic', 'Connecting to the Net'],
    responding: ['Transmitting', 'Holo upload', 'Broadcasting on the Net'],
    'tool-input': ['Loading quickhack'],
    'tool-use': ['Quickhack running', 'Daemon active'],
  },
  hack: {
    cancelled: '◼ QUICKHACK CANCELLED',
    errored: '✖ ICE DETECTED — COUNTERHACK',
    running: (hack: string) => `◢ UPLOADING ${hack}…`,
    done: (hack: string) => `◆ ${hack} EXECUTED`,
  },
  toast: {
    ramRecharged: '🔋 RAM recharged: context purged',
    ramEmpty: '⛔ RAM empty — context full, run /compact',
    ramLow: '⚠ RAM low — time for /compact, choom',
    hpRestored: '🩺 RIPPERDOC: HP restored, limit reset',
    flatline: '☠ FLATLINE — out of tokens until the reset',
    hpCritical: '⚠ HP CRITICAL — grab a MaxDoc, choom',
  },
  band: {
    ripperRam: '✚ RIPPERDOC · RAM RECHARGED',
    ripperHp: '✚ RIPPERDOC · HP RESTORED',
    breachComplete: '◆ BREACH COMPLETE',
    corrupted: '▚▞ SIGNAL CORRUPTED ▞▚',
    syncing: 'SYNCING…',
    context: 'CONTEXT',
    noTokens: 'OUT OF TOKENS',
    neuralLink: 'NEURAL LINK',
    jackIn: '◢ JACK IN ◣',
  },
  regen: {
    unknown: 'TOKEN LIMIT · 5H',
    imminent: 'REGEN IMMINENT',
    inHours: (h: number, mm: string) => `REGEN IN ${h}H${mm}`,
    inMinutes: (m: number) => `REGEN IN ${m} MIN`,
  },
  alt: {
    backdrop: 'Night City neon skyline',
    boot: 'Cyberdeck boot sequence',
    hpUnknown: 'HP unknown',
    hp: (n: number) => `HP ${n} of 100`,
    ram: (n: number, max: number) => `RAM ${n} of ${max}`,
  },
  boot: ['KIROSHI OS v2.0.77', 'NEURAL SYNC', 'ICE FIREWALL', 'CONNECTING TO THE NET'],
  welcomes: [
    ['WELCOME TO NIGHT CITY, CHOOM', 'NEURAL LINK ESTABLISHED · GOOD HUNTING ON THE NET'],
    ['CONNECTION ESTABLISHED', 'THE NET WAS WAITING FOR YOU, NETRUNNER'],
    ['JACK IN SUCCESSFUL', 'ALL SYSTEMS GREEN · ICE ON STANDBY'],
    ['BACK ON THE NET', 'CYBERDECK HOT · QUICKHACKS LOADED'],
    ['THE NIGHT IS YOUNG, CHOOM', 'NIGHT CITY NEVER SLEEPS · NEITHER DO YOU'],
  ],
  events: {
    intrusion: ['⚠ INTRUSION DETECTED', 'COUNTERMEASURES ONLINE…', '✔ ICE REPELLED'],
    netwatch: ['◉ NETWATCH SCAN IN PROGRESS', 'SCRAMBLING SIGNATURE…', '✔ TRACE LOST'],
    daemon: ['☣ HOSTILE DAEMON DETECTED', 'QUARANTINING…', '✔ DAEMON PURGED'],
    shard: ['✉ ENCRYPTED PACKET INTERCEPTED', 'DECRYPTING…', '“THE NET REMEMBERS YOU”'],
    surge: ['⚡ CYBERDECK POWER SURGE', 'SHEDDING IMPLANT LOAD…', '✔ POWER STABILIZED'],
    ghost: ['◌ GHOST SIGNAL ON THE NET', 'TRIANGULATING…', '✖ SOURCE NOT FOUND'],
    breach: ['⚠ INCOMING BREACH', 'FIREWALL OVERLOADED…', '✔ CONNECTION CUT'],
    'acid-rain': ['☂ ACID RAIN OVER NIGHT CITY', 'CYBERDECK SHIELDS UP…', '✔ DOWNPOUR OVER'],
    'legend-black-ice': ['✦ LEGENDARY BLACK ICE', 'IT IS WATCHING YOU TOO…', '✦ YOU SURVIVED, NETRUNNER'],
    'legend-rogue-ai': ['✦ A ROGUE AI KNOCKS AT THE FIREWALL', 'IT KNOWS YOUR NAME…', '✦ CONTACT BROKEN · FOR NOW'],
    'legend-old-net': ['✦ A GHOST OF THE OLD NET', 'IT WHISPERS COORDINATES…', '✦ SIGNAL LOST IN THE NOISE'],
    choom: ['◢ CHOOM DETECTED', 'PROFILING…', '✔ NETRUNNER CONFIRMED · HEY, CHOOM'],
  },
  ambiance: {
    modes: { focus: '◢ NEURAL FOCUS', 'memory paused': '◢ MEMORY FROZEN' },
    hintIdle: ['⟁ jack in, choom', '⟁ the Net awaits', '⟁ ICE on standby'],
    hintWorking: ['⟁ netrunning…', '⟁ daemon active', '⟁ breach in progress'],
    replyHeaders: ['INCOMING TRANSMISSION', 'DECRYPTED STREAM', 'SIGNAL CAUGHT', 'PACKET RECEIVED', 'LINK ESTABLISHED'],
    channel: 'CHANNEL',
    uplink: '◤ UPLINK SENT',
    sequence: (n: number) => `◢ QUICKHACK SEQUENCE ×${n}`,
    netwatch: '⚠ NETWATCH REQUEST — RESPONSE REQUIRED',
  },
}

const STRINGS: Record<'fr' | 'en', Strings> = { fr, en }

/** The texts of the language chosen in the config. */
export const t = (): Strings => STRINGS[config.language]
