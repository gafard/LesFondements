# Habiter la Parole — version intégrée

Refonte locale du 5 septembre 2026. Le projet conserve son nom, son esthétique encre/papier/or, ses données bibliques, ses vingt fiches et ses 104 temps. La version publiée n’a pas été déployée pendant ce travail.

## L’expérience mise en place

| Moment | Ce qui change dans l’application |
| --- | --- |
| Entrer | Première fiche libre. Choix explicite d’une étude personnelle ou d’un parcours en cellule. La localisation intervient pour trouver des groupes. Une note de départ facultative reste privée. |
| Aujourd’hui | Le temps avec Dieu passe avant la relecture des actions. Un marque-page propre au compte retrouve la scène exacte. La reprise invite à continuer sans journées à rattraper. Les récapitulatifs des rencontres manquées sont accessibles. |
| Parcourir | Les vingt fiches disposent d’une invitation et d’une proposition de trace adaptées : découverte, grâce, identité, pratique, prière, comparaison ou accompagnement. Le contenu canonique reste affiché. |
| Répondre | Chaque temps peut laisser une compréhension, une prière, une question ou un pas. Écrire reste facultatif. Le plan d’action détaillé devient un approfondissement volontaire. Un pas enregistré comme trace rejoint aussi les relectures existantes. |
| Retrouver | Un fil éditorial entre certaines fiches retrouve une trace antérieure, étoilée en priorité, avec sa date. Aucune analyse automatique de la personne. |
| Mon carnet | Réponses existantes, nouvelles traces, versets, post-it et relectures sont consultables ensemble. Filtres par fiche et nature, recherche et pages étoilées ; notes libres conservées dans la même page. |
| Mémoriser | Retour au contexte, trace de compréhension facultative et identification du texte affiché. La récitation sans microphone reste possible ; le score vocal est nommé comme une correspondance de transcription. |
| Se rencontrer | Brouillon privé préparé à partir d’une page choisie, sans envoi automatique. Le déroulé permet de passer son tour. Les fiches 7/8 proposent des rendez-vous personnels séparés ; la fiche 10 réserve la moitié de la durée à la prière. Les six identifiants d’étapes restent compatibles avec les sessions existantes. |
| Prier à deux ou trois | L’animateur atteste avoir recueilli l’accord des personnes avant d’enregistrer le binôme. Cet accord est recueilli dans la relation ; il ne s’agit pas d’un système de signatures numériques individuelles. |
| Relire et transmettre | La page de relecture retrouve la note de départ, les pages étoilées et une trace pour la suite. L’attestation existante garde sa condition d’achèvement en cellule et ne certifie pas une maturité spirituelle. |
| Emporter | Le carnet imprimable propose une sélection de fiches, une option pages étoilées et l’inclusion facultative des notes libres. Recherche et export utilisent le même décodage des écrits. |
| Se sentir à l’aise | Quatre destinations principales : Aujourd’hui, Le parcours, Mon carnet, Ma cellule. Mode de lecture paisible pour réduire les mouvements et les ornements ; les nouvelles immersions y commencent sans musique. |

## Conservation et confiance

Les réponses restent dans les documents privés `users/{uid}/progress/{ficheId}`. Les nouvelles traces sont des valeurs versionnées sous `trace:*`, et les favoris sous `favori:*`. Les anciens identifiants et contenus restent lisibles. Aucun journal intime n’est envoyé au groupe.

Les champs de la fiche sont conservés immédiatement sur l’appareil ; l’envoi réseau est différé et regroupé. Les envois du carnet sont sérialisés par compte et gardent une révision pour ne pas acquitter par erreur une modification plus récente. Une lecture distante ancienne ne remplace pas une écriture locale survenue entre-temps. L’absence de document distant laisse les données locales intactes.

Les traces non encore validées conservent un brouillon local propre au compte et au passage. Un stockage indisponible produit un message d’erreur ; le texte saisi reste dans le champ. Le statut distingue la conservation sur l’appareil et la synchronisation. Les nouvelles clés locales sont couvertes par l’effacement des données existant (`lf.*`).

Le formulaire de contact n’annonce plus un envoi réussi après une erreur ou en mode local. Son payload respecte la règle Firestore existante : le champ `id` surnuméraire a été retiré. Il conserve le texte dans le formulaire si l’envoi n’est pas confirmé.

## Fidélité éditoriale

`src/data/livret.json` est inchangé. Les citations doctrinales de la fiche 8 sont conservées. Trois questions ajoutées de facilitation demandent désormais de comprendre le passage et de le reprendre avec une personne préparée à accompagner, plutôt que de conclure seul sur sa propre situation. Les deux anciens contrôles éditoriaux, contradictoires sur une formulation ajoutée, vérifient maintenant ensemble la conservation des citations et l’absence d’autodiagnostic guidé.

Les profils des vingt fiches orientent l’entrée et la trace finale. Ils ne constituent pas une réécriture exhaustive de toutes les questions. Les liens entre fiches sont déclarés par l’éditeur et ne sont pas inférés par une IA.

## Vérifications

- TypeScript et ESLint.
- Corpus canonique, constitution éditoriale et découpage des 104 temps.
- Compatibilité des pas de vie et de leurs relectures.
- Traces invalides, anciens écrits, favoris des post-it, conversion d’une trace en pas, déroulés 7/8/10 et isolation des marque-pages.
- Backend de test exclusivement en mémoire : conservation hors ligne, retour réseau, fusion des écritures, saisie pendant un envoi, quota et achèvement des vingt fiches.
- Compilation Next.js et bundle Cloudflare ; contrôle HTTP des routes principales.

Commandes : `npm run test:content`, `npm run test:editorial`, `npm run test:temps`, `npm run test:pas`, `npm run test:habiter`, `npm run test:carnet`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

Les tests de synchronisation utilisent un backend simulé. Les interactions dans un navigateur, l’impression et la synchronisation entre appareils réels restent à vérifier sur des appareils réels. L’effet sur l’expérience de discipulat demande ensuite une observation avec des lecteurs et une cellule pilote ; les tests logiciels ne mesurent pas une transformation spirituelle.

## Fluidité et ambiances — 5 septembre 2026

Les notes, prières et niveaux de mémorisation gardent une hauteur stable, leur contenu long restant défilable. Les transitions utilisent principalement translation et opacité ; la fin du mouvement ne relance plus une seconde animation. Les demandes rapides conservent leur destination sans interrompre la carte en mouvement. Un glissement vertical ou diagonal ne change pas la carte. Le mode paisible et la préférence de réduction des mouvements restent respectés.

Six extraits de 236 secondes rejoignent les trois musiques existantes : Présence, Intimité, Contemplation (Heaven Sounds), Selah · Recueillement, Selah · Prière et Selah · Repos (Josue Grace). Le script `scripts/preparer-ambiances.py` conserve les originaux, normalise les extraits, puis raccorde la fin au début par un fondu croisé de quatre secondes. Chaque fichier est chargé à la sélection ; le lecteur ajoute une entrée progressive et conserve l’atténuation sous la voix. Le manifeste `src/data/ambiances-importees.json` documente les artistes, sources et positions de coupe.

Les tests `test:carrousels` couvrent gestes, rafales, fin d’animation, limites et nettoyage. `test:ducking` couvre le fondu d’entrée, les voix superposées et les sélections musicales concurrentes. Le décodage intégral des six MP3 est vérifié avec FFmpeg. Aucun débit d’images par seconde ni écoute sur appareil réel n’a été mesuré.
