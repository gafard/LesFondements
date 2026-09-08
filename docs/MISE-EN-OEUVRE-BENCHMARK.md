# Première mise en œuvre du benchmark — 8 septembre 2026

Cette livraison réalise la première priorité du benchmark et les améliorations de confort directement liées à ces écrans : Aujourd’hui, le sentier et l’immersion. La relecture comparative du carnet, les nouveaux bilans par chapitre et le programme de séjours restent des propositions dans le benchmark.

## Changements

- Aujourd’hui ouvre sur le prochain temps accessible, puis la rencontre et la Parole choisie. Un passage suggéré est identifié comme tel lorsqu’aucun verset n’a été choisi.
- Le marque-page est utilisé seulement s’il correspond à la fiche et au temps annoncés ; un ancien lien vers une fiche future ne détourne plus le bouton principal.
- Une préparation terminée en cellule donne accès à la préparation de la rencontre. Le bilan final nécessite la fin des fiches personnelles et celle du groupe lorsqu’il existe.
- Le prologue possède une seule entrée. Sa fenêtre gère Échap, le confinement du focus et le retour au bouton d’ouverture. Fermer ou passer la vidéo ne la marque plus comme visionnée.
- Les détails des temps sont repliables. Le module de pas de vie reste présent lorsqu’une action a été conservée ; son invitation vide ne duplique plus le bouton principal.
- Le sentier présente quatre chapitres, avec ouverture du chapitre courant, recherche dans tous les chapitres et vue de toutes les fiches. Les autres chapitres restent ouvrables pour consulter les titres.
- Les cartes distinguent préparation personnelle terminée et fiche partagée en cellule. Les fiches verrouillées expliquent le prérequis ; un composant commun explique les accès directs refusés dans la lecture et l’immersion.
- L’immersion garde le bleu nuit et l’or sur une surface calme. L’ouverture est plus compacte ; les commandes restent visibles et les repères s’affichent sur deux lignes sur les petits écrans.
- La progression affichée provient du contexte partagé, associé à l’identité chargée. Le texte canonique, l’ordre des fiches et les règles de déverrouillage sont conservés.

## Vérification

- 16 scénarios d’accès séquentiel, sur Chromium ordinateur et mobile : passent.
- 12 nouveaux scénarios d’expérience, sur les deux formats : passent après correction du retour du focus à la fermeture du prologue.
- Les nouveaux scénarios contrôlent aussi l’accessibilité automatisée du contenu principal d’Aujourd’hui et du sentier, la recherche, les anciens marque-pages, les préparations achevées et les commandes d’immersion après une période d’inactivité.
- Contrôle visuel des captures ordinateur et mobile.
- Tests de domaine : accès, carrousels, Habiter, pas de vie et stockage du carnet : passent.
- TypeScript : passe. ESLint : aucune erreur ; trois avertissements préexistants dans la page des groupes.

Les tests utilisent exclusivement des comptes et groupes fictifs dans le mode local de vérification. Ils ne créent pas de comptes en production. Le mode local conserve une base isolée du projet Firebase réel.
