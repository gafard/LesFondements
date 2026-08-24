# 📖 Les Fondements

Application web et mobile progressive (PWA) du parcours **« Le parcours des fondements »** : vingt fiches préparées seul, vingt rencontres vécues en petit groupe (5 à 6 disciples).

La règle qui structure tout le produit vient du livret lui-même (p. 3) :

> *« Un nombre de 5-6 participants semble être un bon équilibre. […] Le but n'est pas de refaire le cours, chacun l'aura déjà travaillé chez lui. »*

Concrètement, dans l'application :

- **Pas de groupe, pas de parcours.** Tant qu'une personne n'a pas rejoint ou créé une cellule, les fiches sont protégées.
- **Une fiche à la fois.** La fiche `N + 1` s'ouvre pour tout le groupe au moment où l'animateur clôt la rencontre de la fiche `N`.
- **Présentiel et visio réunis.** Chacun annonce son mode de présence ; le déroulé de rencontre est synchronisé en direct.
- **Table de travail vivante.** Interface tactile et chaleureuse en bois noble, parchemins, Post-its, trombones et sceaux de cire.

---

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement (Turbopack)
npm run dev
```

L'application fonctionne **100% hors-ligne et sans backend requis** : si aucune clé Firebase n'est renseignée, le stockage bascule automatiquement sur `LocalStorage` / `IndexedDB` et un annuaire de groupes de démonstration est semé autour de la position choisie.

Pour brancher le Cloud Firebase :
```bash
cp .env.local.example .env.local     # renseigner les clés NEXT_PUBLIC_FIREBASE_*
npm run firebase:verifier            # contrôle de l'authentification et de Firestore
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🎙️ Moteur Vocal & Studio Audio

L'application dispose d'un pipeline audio complet :

1. **Écoute Continue mains-libres** : Diffusion enchaînée de l'introduction, des sections d'enseignement et du chapitre biblique complet.
2. **Priorité Voix Studio ElevenLabs** : Chargement direct des enregistrements MP3 (`public/voix/eleven/`) avec bascule transparente sur le Web Speech TTS en secours.
3. **Récitation vocale interactive** : Reconnaissance vocale locale en direct dans le navigateur pour la mémorisation mot à mot des versets proclamés (100% privé, sans serveur externe).
4. **Pause Sanctuaire** : Minuteur de recueillement avec sablier animé, bougie et ambiances Web Audio (*souffle, pluie, silence*).

```bash
npm run voix:estimation   # Estime le nombre de caractères sans coût
node --env-file=.env.voice.local scripts/generer-voix.mjs --fiches 1 # Génère l'audio ElevenLabs
npm run voix:manifeste    # Régénère le catalogue après ajout de pistes MP3
```

---

## 📚 Outils Bibliques Intégrés

Chaque référence scripturaire dans le livret est immédiatement cliquable :

- **Louis Segond 1910** : 31 099 versets complets en JSON statique (chargement par livre).
- **Lexiques Strong Hébreu / Grec** : 14 627 définitions avec racines, translittération et morphologie.
- **Treasury of Scripture Knowledge** : 29 169 versets de renvois croisés.
- **Bible thématique de Nave** : 5 313 thèmes de méditation.
- **Commentaire de Matthew Henry** : 1 188 chapitres d'explication.

---

## 🏗️ Structure du Projet

```
src/
├── app/                  # Routes Next.js 16 App Router
│   ├── dashboard/        # Tableau de bord, rythme et compte disciple
│   ├── fiches/           # Sentier des 20 fiches et fiches d'étude
│   ├── groupes/          # Cellules, murs de prière et compagnon de rencontre
│   ├── memorisation/     # Flashcards et récitation vocale mot à mot
│   ├── journal/          # Journal spirituel intime
│   ├── transformation/   # Journal de déclics et pas d'obéissance
│   ├── recherche/        # Concordance et recherche globale
│   ├── carnet-export/    # Manuscrit imprimable en format livre relié
│   └── certificat/       # Attestation d'achèvement sur parchemin
├── components/           # Composants UI tactiles et interactifs
│   ├── EcouteContinueFiche.tsx  # Lecteur continu studio & biblique
│   ├── RecitationVocale.tsx     # Reconnaissance vocale en temps réel
│   ├── PauseSanctuaire.tsx      # Minuteur et ambiances sonores
│   ├── EdificeFondements.tsx    # Visualisation architecturale
│   ├── BulleVerset.tsx          # Bulle biblique instantanée
│   └── AppShell.tsx             # Barre latérale et navigation mobile
├── lib/                  # Logique métier, audio, synchro et helpers
│   ├── voix.ts           # Résolution et manifeste des voix studio
│   ├── ambiance.ts       # Synthétiseur Web Audio et TTS
│   ├── firestore.ts      # Accès et cache Firestore
│   ├── parcoursStore.ts  # Synchronisation locale et Cloud
│   └── bibleVersions.ts  # Audio biblique et versions des écritures
└── data/                 # Données du livret, métadonnées et index
```

---

## ⛅ Déploiement Cloudflare Workers

L'application est optimisée pour le runtime Cloudflare Workers avec `@opennextjs/cloudflare` :

```bash
# Compilation OpenNext
npm run build:cloud

# Déploiement en production
npx wrangler deploy
```

- **URL de Production** : [https://parcours.lesfondements.workers.dev](https://parcours.lesfondements.workers.dev)

