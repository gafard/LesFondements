# Les Fondements — benchmark international du design et de l’expérience

8 septembre 2026 · Proposition de direction produit et de design

La meilleure direction pour Les Fondements est un **carnet de parcours vivant, personnel et partagé en cellule**. L’application possède déjà une identité reconnaissable. Le prochain saut de qualité vient de la hiérarchie des écrans, de la continuité des usages et de la qualité des détails.

## Périmètre et méthode

Comparaison de six applications internationales et d’un parcours de groupe : YouVersion, BibleProject, Hallow, Glorify, Headspace, Duolingo et Alpha. Leur sélection répond aux besoins du projet ; elle ne constitue pas un classement mondial mesuré ou exhaustif.

Sources officielles consultées à la date indiquée. Observation directe des pages publiques de Les Fondements, de la fiche 1 et de son ouverture immersive ; observation de la présentation visuelle officielle de Glorify ; lecture du code actuel pour les écrans authentifiés. Les applications natives concurrentes n’ont pas fait l’objet de tests complets avec abonnement. Les performances, la satisfaction et les effets spirituels ne sont pas mesurés ici. Les recommandations ci-dessous sont des choix de conception à tester.

## Ce que les références apportent

| Référence | Fonction documentée | Enseignement de design pour Les Fondements | Limite de transposition |
|---|---|---|---|
| **YouVersion** | Guided Scripture associe notamment une courte vidéo, des éléments de réflexion, la prière et l’Écriture, avec navigation entre écrans. [Source officielle](https://help.youversion.com/l/en/article/or51wyqqlr-daily-refresh-guided-scripture). | Une séquence reconnaissable, un écran centré sur une action, des commandes explicites pour avancer et revenir. | Un carrousel quotidien ne suffit pas à organiser vingt fiches et des rencontres. Conserver le fil du livret. |
| **BibleProject** | Quatre sections principales ; reprise des vidéos, podcasts et cours ; ressources liées aux passages bibliques ; favoris. [Présentation de l’application](https://help.bibleproject.com/hc/en-us/articles/4478975400727-I-m-new-to-the-app-How-do-I-get-started). | Retrouver sa place et comprendre le contexte d’un passage sans abandonner la lecture. | Le modèle de bibliothèque ouverte ne remplace pas la progression séquentielle demandée. |
| **Hallow** | Choix de durée, de guide et de musique ; téléchargement de sessions ; journal et rappels. [Fonctions officielles](https://hallow.com/features/). | Soigner l’écoute : durée annoncée, réglages mémorisés, pause, reprise et texte disponible. | Adapter l’ergonomie audio au contenu du livret ; ses propositions confessionnelles ne sont pas celles de Les Fondements. |
| **Glorify** | Rituel quotidien articulant citation, passage et méditation guidée ; musique, parcours audio et communauté. [Présentation officielle](https://www.glorify.global/app). | Donner au rendez-vous quotidien une structure stable et une atmosphère accueillante. Sur sa page publique : grands espaces, typographie contrastée et images chaleureuses. | Les images du site promotionnel ne prouvent pas à elles seules la qualité de l’application native. Un catalogue supplémentaire augmenterait les choix à faire. |
| **Headspace** | Méditations guidées, programmes et catégories comme méditation, sommeil ou concentration. [Présentation officielle](https://www.headspace.com/app). | Employer des intitulés que la personne comprend immédiatement et faciliter l’entrée dans une pratique guidée. | Ici, le but reste la découverte biblique et la vie de disciple. Les résultats de santé annoncés par Headspace ne sont pas transposables au projet. |
| **Duolingo** | Un chemin guidé ordonne les leçons et intègre des révisions. [Explication officielle du modèle de parcours, publiée pour la refonte de 2022](https://blog.duolingo.com/new-duolingo-home-screen-design/). | Montrer clairement « où je suis », « ce qui vient ensuite » et « ce que je peux relire ». Intégrer la relecture au chemin. | La compétition et les séries quotidiennes ne sont pas les bons repères pour évaluer une vie spirituelle. Ne pas confondre finir une activité et adhérer à une vérité. |
| **Alpha** — référence de rencontre | Les rencontres associent accueil, contenu et conversation ouverte en petit groupe. [Présentation officielle](https://alpha.org.au/what-is-alpha/). | Concevoir l’application pour aider des personnes à se rencontrer : invitation personnelle, contexte rassurant, question commune, liberté de parler. | Alpha est une référence d’expérience collective, pas une preuve de supériorité de son interface. Respecter le déroulé propre du livret. |

## Diagnostic de l’existant

**À préserver.** Le bleu nuit, l’or et le papier créent une continuité avec le livret. Les scènes de groupe incarnent le projet. Les quatre destinations principales — Aujourd’hui, Parcours, Carnet, Cellule — sont déjà définies dans `AppShell.tsx`. L’immersion, les références bibliques ouvrables, la voix, les ambiances et le carnet privé sont également présents. Il faut perfectionner ces éléments avant d’en multiplier le nombre.

**À alléger visuellement.** Les écrans observés utilisent des feuilles, du ruban adhésif, des textures et des encadrements successifs. Ces objets donnent du caractère ; leur accumulation peut réduire la place accordée au passage et à la commande suivante. Réserver les compositions riches aux ouvertures et aux bilans ; rendre les pages de lecture plus sobres.

**À hiérarchiser.** Le code du tableau de bord prévoit un bouton de prologue dans l’accueil et une seconde invitation vidéo tant qu’il n’est pas vu, puis des modules de reprise et la fiche. Regrouper le prologue en une seule entrée et donner la première place au temps à poursuivre. Le carnet possède déjà des traces et un « fil de mes découvertes » : la relecture proposée ci-dessous développe cet existant.

**À clarifier.** La fiche complète propose « Vivre mon temps du jour », « Écoute continue », des onglets et une déclaration de préparation. Pour un débutant, expliquer d’abord le chemin recommandé. La fiche intégrale reste une ressource accessible. La différence entre préparation personnelle terminée et prochaine fiche ouverte par la cellule doit être explicite.

## Direction artistique proposée

Conserver une ambiance de livre précieux que l’on utilise chaque jour.

| Élément | Décision proposée |
|---|---|
| Couleurs | Papier clair pour lire, bleu nuit pour les temps d’entrée et de prière, or pour signaler l’action principale et l’étape courante. |
| Typographie | Sérif pour les titres et les citations ; police de lecture simple pour les explications et commandes. Agrandissement du texte sans perdre les boutons. |
| Décor | Un élément expressif par composition ; une surface de lecture calme. Les inclinaisons restent réservées aux éléments décoratifs. |
| Images | Des personnes et des lieux cohérents avec le public, dont les communautés africaines francophones ; éviter de représenter toute la vie spirituelle par des paysages. |
| Mouvement | Transitions discrètes déclenchées par la personne, sans défilement automatique des questions. Conserver la position et le focus ; respecter la réduction des animations. |
| Navigation | Quatre destinations stables. Dans l’immersion, les commandes de lecture prennent la priorité et la sortie reste facile à trouver. |

Les carrousels peuvent présenter les ambiances ou les chapitres. L’action principale et une question à laquelle on répond doivent rester accessibles sans geste caché.

## Les six modifications prioritaires

### 1. Un accueil qui donne immédiatement une suite

Pour une personne qui revient, première carte :

> **Ton prochain temps**  
> Fiche 1 · Connaître Dieu  
> Reprendre : Un amour relationnel et inconditionnel  
> **Continuer mon temps**  
> Lire ou écouter

Puis seulement : la prochaine rencontre et une trace personnelle à relire. La présentation générale et le prologue deviennent secondaires après leur découverte. La durée, lorsqu’elle est affichée, correspond au contenu réel et reste indicative.

Effet attendu à vérifier : moins d’hésitation entre les entrées et une reprise plus rapide.

### 2. Un parcours en quatre chapitres, avec une progression compréhensible

Reprendre les quatre mouvements de l’image : Recevoir ; Être transformé ; Devenir disciple ; Demeurer et espérer. Conserver les vingt fiches et leur ordre. Montrer le chapitre courant ouvert et les autres sous forme compacte.

Une fiche peut afficher : « À commencer », « En cours », « Préparation terminée », « Rencontre vécue » ou « À venir ». Les états doivent correspondre à des événements réels et ne pas attribuer de maturité spirituelle.

Pour un verrou, afficher la cause exacte :

> **La fiche 2 viendra ensuite.**  
> Il te reste un temps dans la fiche 1.  
> **Reprendre ce temps**

Ou, lorsque la préparation est terminée :

> **Ta préparation est terminée.**  
> Ta cellule poursuit la fiche 1. La suite s’ouvrira après sa clôture.  
> **Préparer la rencontre**

Le participant peut relire ses fiches accessibles. Une réponse intime, une confession ou une formulation de foi ne devient jamais une condition technique de déverrouillage.

### 3. Une immersion avec un rythme stable

L’immersion existante devient le chemin conseillé aux nouveaux participants. La fiche complète sert à relire et approfondir.

| Moment | Contenu à l’écran | Action principale |
|---|---|---|
| Entrer | Thème, passage, durée indicative | Commencer |
| Découvrir | Texte lisible et références ouvrables | Lire ou écouter |
| Comprendre | Une question liée au passage | Continuer après réflexion |
| Répondre | Une question personnelle, écriture facultative | Garder quelques mots ou poursuivre |
| Repartir | Un pas librement choisi et le prochain rendez-vous | Terminer ce temps |

Il s’agit de regrouper et de mieux nommer les scènes existantes, sans couper artificiellement le contenu pour atteindre un nombre d’écrans. Les réglages audio se trouvent au même endroit ; la voix et la musique gardent des commandes distinctes. En cas d’interruption, la reprise retrouve le passage et le brouillon.

### 4. Un carnet qui montre une histoire personnelle

Développer `TraceParole`, `FilDeLaParole` et le carnet unifié avec une relecture côte à côte :

> **Tes mots lors de la fiche 1**  
> [La phrase réellement écrite par la personne, avec sa date.]  
> **Aujourd’hui, en relisant ce passage…**  
> Qu’est-ce qui s’est précisé ? Qu’est-ce qui reste difficile à comprendre ou à vivre ?

Conserver le texte original. La personne écrit elle-même sa nouvelle compréhension et peut constater aussi un doute ou une difficulté persistante. Aucune évolution positive n’est présumée ou inventée.

Proposer ce rendez-vous à la fin de chaque chapitre, puis un bilan des vingt fiches constitué de passages choisis et de mots personnels. La recherche et les favoris restent dans le carnet. La réussite du design tient ici à la facilité de retrouver une découverte importante.

### 5. Une cellule organisée autour de la prochaine rencontre

La première vue montre qui accueille, quand, où, le thème et la préparation utile. Les outils d’administration passent derrière une entrée dédiée pour les animateurs.

Renforcer trois moments : avant, choisir une découverte ou une question à apporter ; pendant, afficher une question commune avec l’option de passer son tour ; après, retrouver le passage et son propre pas de vie.

L’invitation WhatsApp et la page d’accueil du groupe existent déjà : les rendre cohérentes avec ce parcours, sans recréer une messagerie. Tout transfert du carnet vers la cellule passe par un aperçu explicite du texte choisi et de ses destinataires.

Pour les séjours, ajouter ultérieurement un **programme de rencontre** adapté aux horaires du séjour, tout en gardant l’ordre des fiches et les temps personnels. Ne pas déverrouiller automatiquement plusieurs fiches parce que le séjour dure quelques jours.

### 6. Des moments marquants dont la personne maîtrise le rythme

La Lettre d’amour du Père existe déjà, avec une ouverture immersive à la fin de la fiche 1. Soigner ce moment : possibilité de lire sans son, pause, reprise, fermeture et références consultables. Identifier clairement le texte comme une méditation composée à partir de passages bibliques.

Après la lettre, proposer une seule invitation : « Quelle phrase souhaites-tu garder ou éclaircir ? » La musique, le décor et les mots servent l’attention ; aucune réaction émotionnelle n’est attendue pour considérer le temps terminé.

Aux fiches 5, 10, 15 et 20, créer un bilan calme du chapitre, fondé sur les activités et traces réellement présentes. Les découvertes et relations vécues fournissent la matière de ces moments.

## Ordre de réalisation recommandé

| Lot | Travail concret | Vérification attendue |
|---|---|---|
| **1 — Clarté** | Hiérarchie d’Aujourd’hui, prologue regroupé, états du parcours, explications des verrous, noms cohérents. | Un nouveau participant trouve son prochain temps et explique ce qui ouvre la fiche suivante. |
| **2 — Confort** | Surfaces de lecture allégées, commandes d’immersion uniformes, reprise et audio fiables. | Après fermeture ou coupure réseau, retrouver sa place et son texte ; utiliser l’expérience avec texte agrandi et animations réduites. |
| **3 — Continuité** | Relecture de ses propres mots, bilans par chapitre, préparation du partage en cellule. | Retrouver une ancienne découverte et comprendre exactement ce qui restera privé. |
| **4 — Séjours** | Programme adapté, supports animateur et préparation de contenus pour connexion limitée. | Dérouler une rencontre avec un vrai groupe et un téléphone courant dans les conditions du séjour. |

L’accès hors ligne aux textes et médias doit être vérifié séparément : une sauvegarde locale du carnet ne garantit pas une fiche et ses audios entièrement disponibles hors connexion. Prévoir un téléchargement volontaire des contenus utiles, avec leur taille affichée, après validation technique.

## Comment choisir ce qui mérite d’être généralisé

Tester d’abord les changements sur les fiches 1, 4 et 6, avec environ huit personnes : des nouveaux venus, des participants peu à l’aise avec le numérique et des animateurs. C’est un premier test qualitatif, pas une mesure représentative du monde entier.

Demander à chacun de reprendre un temps, ouvrir un passage, conserver une note, expliquer un verrou et préparer une rencontre. Observer les hésitations, les retours en arrière et les erreurs, puis comparer avec l’interface actuelle. Ne pas collecter le contenu intime des réponses pour cette évaluation.

Une fois les difficultés concrètes résolues, déployer progressivement les mêmes règles visuelles sur les vingt fiches. Les chiffres de connexion et de complétion peuvent informer l’usage ; la transformation spirituelle ne se réduit pas à ces chiffres.

**Recommandation : investir d’abord dans une expérience plus claire et plus continue, avec une identité visuelle allégée pendant la lecture.** L’association du livret, de la mémoire personnelle et de la rencontre en cellule constitue une direction distinctive et cohérente avec Les Fondements.
