# 📖 Les Fondements — Parcours de Discipulat

Application web et mobile progressive (PWA) du parcours **« Le parcours des fondements »** : vingt fiches étudiées personnellement, avec un partage en petit groupe (5 à 6 disciples) recommandé par le livret.

## Habiter la Parole

Le temps avec Dieu est le point d’entrée. Chaque fiche propose une invitation adaptée et la liberté de garder une compréhension, une prière, une question ou un pas. Le carnet réunit les anciens écrits, les nouvelles traces et les relectures ; le fil entre fiches retrouve les mots choisis par la personne. Les modes personnel et cellule, les rencontres 7/8/10, l’export choisi et le mode de lecture paisible prolongent cette expérience.

Voir [la vision d’ensemble](docs/REFONTE-ENSEMBLE-EXPERIENCE.md) et [le bilan de mise en œuvre](docs/HABITER-LA-PAROLE-IMPLEMENTATION.md). Les contrôles spécifiques sont `npm run test:habiter`, `npm run test:carnet` et `npm run test:pas`.

---

## 🌟 Expérience & Fonctionnalités Clés

### 1. 🕊️ « Un Temps à Part » & Moteur d'Immersion Quotidien
Le parcours quotidien découpe chaque fiche en étapes contemplatives au fil des jours :
- **Atmosphère sacrée plein écran** : Nuit étoilée, bureau sous-main, vitrail animé et enluminures ciblées.
- **Voix off vivante Studio & Vivienne** : Lecture phrase par phrase avec atténuation intelligente (*ducking*) de la musique d'ambiance.
- **Silence sacré** : Moment de recueillement et de respiration au pied du Maître (45s).
- **Méditation Théocentrique** : Questions profondes axées sur la grandeur et l'amour de Dieu.
- **Sanctuaire de Prière** : Miroir sacré des pensées notées avec verbes d'adoration (*Adorer · Remercier · Confesser · Demander · Écouter · Remettre*).
- **Ancrage du Verset (4 niveaux)** : Lecture intégrale, mots à trous interactifs, initiales mémorielles, et récitation vocale avec génération 1-clic de fond d'écran pour mobile.
- **Trace libre & Carnet privé** : Compréhension, prière, question ou pas, conservés dans le carnet (`/journal`) ; aucune entrée automatique ne prétend que toutes les pratiques ont été vécues.

### 2. 🎙️ Transcription Vocale Intelligente (Whisper Large v3) & Écoute Audio
- **Écoute de la question (🔊)** : Bouton pour entendre chaque question lue à voix haute posément.
- **Réponse vocale (🎙️)** : Possibilité de dicter ses réponses par la voix. Groq Whisper transcrit instantanément les paroles en texte français dans le champ de réponse (avec secours Web Speech API automatique).
- **Disponible partout** : Dans l'immersion quotidienne, sur les fiches d'étude (`/fiches/[id]`) et dans le Journal Spirituel (`/journal`).

### 3. 📜 Bible d'Étude Complète & Concordance
- **Lecture du chapitre entier** : Cliquer sur un verset dans le texte permet d'ouvrir instantanément le **chapitre complet** avec le verset ciblé mis en surbrillance dorée et centré automatiquement.
- **31 103 versets Louis Segond 1910** et comparaison avec la **Bible du Semeur**.
- **Lexique Strong Grec / Hébreu** (14 627 définitions avec racines et morphologie).
- **Commentaire de Matthew Henry** et renvois croisés Treasury of Scripture Knowledge.

### 4. 👥 Vie de Cellule & Compagnon de Rencontre
- Rencontres synchronisées en direct avec mode présentiel et visio.
- Partage des pas de foi et prières fraternelles.
- Export PDF « Carnet de Disciple » imprimable en format livre relié.

---

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement (Turbopack)
npm run dev

# 3. Compiler pour Cloudflare Workers
npm run build:cloud
npx wrangler deploy --keep-vars
```

---

## 🏗️ Structure du Projet

```
src/
├── app/                  # Routes Next.js 16 App Router
│   ├── (app)/
│   │   ├── dashboard/    # Tableau de bord unifié et étapes de la semaine
│   │   ├── aujourdhui/   # Table de travail & lancement de l'Immersion
│   │   ├── fiches/       # Sentier des 20 fiches et fiches d'étude intégrales
│   │   ├── journal/      # Journal spirituel intime avec dictée vocale
│   │   ├── groupes/      # Cellules et compagnon de rencontre en direct
│   │   ├── memorisation/ # Entraînement et récitation
│   │   ├── temoignages/  # Mur communautaire et enregistrements audio
│   │   └── carnet-export/# Export manuscrit imprimable relié
│   └── api/
│       ├── transcription/# Transcription vocale Groq Whisper Large v3
│       ├── memorisation/ # Analyse de récitation de versets
│       ├── voix/         # Résolution des pistes audio
│       └── notifications/# Rappels Web Push et cron
├── components/           # Composants interactifs
│   ├── Immersion.tsx     # Lecteur plein écran du sanctuaire contemplatif
│   ├── ChampDictée.tsx   # Champ de réponse avec écoute audio et micro Whisper
│   ├── PanneauEtude.tsx  # Panneau latéral d'étude biblique (chapitre complet)
│   ├── BulleVerset.tsx   # Bulle d'accès rapide et d'étude de chapitre
│   └── ReferenceCliquable.tsx # Détection automatique des références bibliques
├── data/
│   ├── livret.json       # Texte intégral canonique des 20 fiches
│   ├── meditation-questions.json # Questions théocentriques des 20 fiches
│   └── versets.ts        # Index scripturaire
└── lib/                  # Services et logique métier
    ├── transcription.ts  # Enregistreur et client de transcription Whisper
    ├── voix.ts           # Résolution et manifeste des voix Studio
    ├── ambiance.ts       # Nappes sonores Web Audio procédurales
    ├── etudes.ts         # Moteur de chargement des chapitres et Strong
    └── firestore.ts      # Persistance cloud et cache hors-ligne
```

---

## 🌐 Déploiement

La production existante est le Worker Cloudflare `parcours`. Toute demande de déploiement concerne ce site, avec ses domaines et services existants. Sites/ChatGPT est un aperçu séparé et ne doit pas être utilisé comme destination de production sans demande explicite.

- **URL de production** : [https://parcours.lesfondements.workers.dev](https://parcours.lesfondements.workers.dev)
