# Les Fondements

L'application du parcours **« Le parcours des fondements »** : vingt fiches
préparées seul, vingt rencontres vécues en petit groupe.

La règle qui structure tout le produit vient du livret lui-même (p. 3) :

> Un nombre de 5-6 participants semble être un bon équilibre. […] Le but n'est
> pas de refaire le cours, chacun l'aura déjà travaillé chez lui.

Concrètement, dans l'application :

- **Pas de groupe, pas de parcours.** Tant qu'une personne n'a pas rejoint ou
  créé un groupe, les fiches ne sont pas rendues — pas seulement masquées.
- **Une fiche à la fois.** La fiche `N + 1` s'ouvre pour tout le groupe au
  moment où l'animateur clôt la rencontre de la fiche `N`. Jamais avant.
- **Présentiel et visio dans la même rencontre.** Chacun annonce s'il vient sur
  place ou se connecte ; le déroulé est synchronisé pour tout le monde.

## Démarrer

```bash
npm run dev
```

L'application fonctionne **sans backend** : si `NEXT_PUBLIC_FIREBASE_API_KEY`
n'est pas renseignée, tout est stocké dans le navigateur et un annuaire de
groupes de démonstration est semé autour de la position saisie, afin que
l'appariement géographique soit démontrable. Ces groupes portent la mention
« Exemple » dans l'interface.

Pour brancher Firebase :

```bash
cp .env.local.example .env.local     # puis remplir les six NEXT_PUBLIC_FIREBASE_*
npm run firebase:verifier            # contrôle la clé, les modes de connexion, Firestore
firebase deploy --only firestore:rules,firestore:indexes
```

`npm run firebase:verifier` n'écrit rien et n'utilise aucun compte de service :
il interroge les mêmes points d'accès publics que le SDK, et dit précisément
ce qui manque (base non créée, connexion e-mail désactivée, `localhost` absent
des domaines autorisés…).

## Le contenu du livret

Le texte intégral du livret n'est pas saisi à la main : il est **extrait du PDF
d'origine** par deux scripts, puis versionné dans `src/data/`.

```bash
# 1. PDF → texte, en conservant la mise en page
pdftotext -layout livret-vf-12-03-2015.pdf livret.txt

# 2. texte → structure (sections, citations, encadrés, résumés, questions…)
python3 scripts/parse-livret.py livret.txt livret.json

# 3. structure → données de l'application
python3 scripts/build-livret-data.py livret.json src/data
```

Cela produit :

| Fichier                | Contenu                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `src/data/livret.json` | 20 fiches, annexes, index, bibliographie — chargé à la demande |
| `src/data/fichesMeta.ts` | Titres, sous-titres, icônes, pages — chargé partout           |

`scripts/parse-livret.py` s'appuie sur la grammaire typographique du livret :
`• titre de section`, indentation pour les citations, `!` pour un verset à
recopier, `&` pour une lecture, `>>` pour une question de partage. Les
sous-titres en gras, perdus à l'extraction, sont reconstitués par heuristique
(ligne courte, isolée, sans ponctuation finale).

Les textes bibliques ne sont **pas** inventés : `src/data/versets.ts` ne
contient que ceux qui étaient déjà présents dans l'application. Pour les
autres, l'application demande de recopier le verset, Bible ouverte — ce que le
livret demande de toute façon.

## Les outils d'étude

Le livret suppose une Bible ouverte à côté de soi (« Lire Pr 1:7 et 2:5 »,
« Versets à écrire et méditer »). L'application en met une dedans.

Chaque référence croisée dans une fiche est cliquable et ouvre un panneau :

- **Louis Segond 1910 annotée des numéros Strong** — 31 099 versets ; chaque mot
  renvoie à son terme hébreu ou grec ;
- **lexiques Strong** — 8 853 entrées hébraïques, 5 774 grecques, avec la forme
  originale, la phonétique, le type grammatical et la définition ;
- **Treasury of Scripture Knowledge** (1833) — 29 169 versets de renvois ;
- **Bible thématique de Nave** (1897) — 5 313 thèmes ;
- **Commentaire de Matthew Henry** (1710) — 1 188 chapitres.

Toutes ces sources sont des ouvrages du domaine public. Elles vivent en
fichiers JSON statiques dans `public/etudes` (35 Mo, 317 fichiers), chargés
livre par livre : ouvrir Jean 3 télécharge Jean, pas le corpus.

```bash
python3 scripts/importer-etudes.py <dossier-des-.sqlite> public/etudes
```

Le script convertit les bases SQLite d'origine. `better-sqlite3` est un module
natif Node : il ne tourne pas sur Cloudflare Workers, d'où le passage en
fichiers statiques — qui a l'avantage d'être aussi cacheable hors-ligne.

`src/lib/reference.ts` lit les références telles que le livret les écrit —
« He », « Hb » et « Hébreux » désignent le même livre, « Jn 17 :3 » a une
espace parasite — et écarte les faux positifs (« fiche 3 », « page 160 »).

## Les voix off

```bash
npm run voix:estimation   # ce que ça coûterait, sans rien appeler
npm run voix:generer      # génère, en reprenant là où on s'était arrêté
npm run voix:manifeste    # après avoir déposé des enregistrements humains
```

Le corpus est fixe : 1 265 pistes, environ 320 000 caractères. On génère une
fois, on versionne les fichiers, et personne ne paie de synthèse à la lecture.

Une piste est un fragment lu — un paragraphe, un titre de section, un résumé,
une question — identifié par sa **position** dans le livret (`f1.s0.b3`), pas
par son contenu : corriger une coquille ne rend pas l'enregistrement orphelin.

**Le passage aux voix humaines ne demande aucun code.** Déposez le fichier
sous `public/voix/humaine/f1.s0.b3.mp3`, relancez `npm run voix:manifeste` :
le manifeste référence l'enregistrement à la place de la synthèse. La
substitution se fait piste par piste, dans n'importe quel ordre.

Les références sont développées avant lecture, sinon la voix épellerait :
« 1Jn 4:16 » devient « première lettre de Jean, chapitre 4, verset 16 ».

Sans aucune piste, l'immersion retombe sur la synthèse vocale du navigateur.

## Architecture

```
src/lib/
  types.ts           Le domaine : groupe, membre, rencontre, profil, mur
  parcoursStore.ts   Lecture/écriture, Firestore ou localStorage, même API
  ParcoursContext.tsx  État partagé : profil, groupe, membres, rencontre, garde
  geo.ts             Annuaire de villes francophones + tri par distance
  livret.ts          Chargement à la demande du contenu du livret
  ambiance.ts        Ambiance sonore synthétisée + lecture à voix haute
  voix.ts            Manifeste des voix off, humaines ou de synthèse
  reference.ts       Lecture des références bibliques françaises
  etudes.ts          Texte annoté, lexiques, renvois, thèmes, commentaire
  panneauEtude.ts    Le panneau d'étude, ouvrable depuis n'importe où
  fondSombre.ts      Les écrans plein écran préviennent la barre de navigation

src/components/
  ParcoursGate.tsx   La garde : pas de groupe, pas de fiches
  Immersion.tsx      La traversée guidée d'une fiche, scène par scène
  PlacePicker.tsx    Géolocalisation ou recherche de ville, sans requête réseau
  PanneauEtude.tsx   Le passage, ses mots, ses renvois, ses thèmes
  ReferenceCliquable.tsx  Rend les références d'un texte consultables
  GroupMatchCard.tsx / GroupCreateForm.tsx / InvitePanel.tsx
```

### Le cycle d'une fiche

```
preparation  chacun travaille la fiche chez soi
     │       (markStepPrepared → le groupe voit qui est prêt)
     ▼
rencontre    l'animateur ouvre la rencontre (openMeeting)
     │       le déroulé avance pour tous (setMeetingStage)
     ▼
cloture      closeMeeting → currentStep + 1, la fiche suivante s'ouvre
```

## Vie privée

- Les réponses aux questions, les versets recopiés et le journal restent dans
  `users/{uid}` : le groupe ne les voit jamais, sauf geste explicite (« partager
  cette réponse au groupe »).
- La position sert au tri des groupes et n'est jamais affichée aux autres ;
  seule une distance approximative apparaît. Les coordonnées GPS sont arrondies
  au centième de degré (~1 km) avant d'être enregistrées.
- Le lieu physique d'un groupe n'est visible que de ses membres acceptés.

## Déploiement

```bash
npm run build         # build Next.js
npm run build:cloud   # build OpenNext pour Cloudflare
```
