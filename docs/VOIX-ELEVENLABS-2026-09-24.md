# Reprise des voix du 24 septembre 2026

La reprise conserve la voix configurée `yG4Uc56cLYQyZFnWaYv2`, le modèle
`eleven_multilingual_v2` et le format MP3 44,1 kHz / 128 kb/s. Les enregistrements
existants dont le texte est à jour sont conservés, même lorsqu'ils utilisent
l'autre voix historique.

## Lot produit

| Fiche | Nouvelles pistes | Durée cumulée |
| --- | ---: | ---: |
| 3 | 49 | 11,9 min |
| 4 | 101 | 22,4 min |
| 5 | 47 | 11,9 min |
| 6 | 58 | 12,6 min |
| 7 | 61 | 19,5 min |
| 8 | 42 | 15,2 min |
| 9 | 67 | 13,2 min |
| 10 | 38 | 8,6 min |

Total : **463 nouvelles pistes**, 115,2 minutes, 111 126 688 octets.
Dix versets communs devenus obsolètes ont également été actualisés. Le manifeste
contient désormais 647 pistes. Les 473 fichiers produits ont passé un décodage
complet avec FFmpeg ; les 463 nouvelles pistes ont également été contrôlées avec
FFprobe pour vérifier leur format et leur durée. L'inventaire ne trouve aucune
piste manquante ou obsolète dans les fiches 3 à 10 ni dans les 53 versets communs.

## Consommation et limites

L'utilisateur a indiqué disposer d'environ 120 000 crédits. La production a été
bornée à 118 000 caractères soumis, reprises réseau comprises :

- fiches 3 à 10 : 115 812 caractères, 463 générations ;
- versets communs : 1 992 caractères, 10 générations ;
- total : **117 804 caractères**, aucune nouvelle tentative réseau.

Ce chiffre est la quantité de texte envoyée, pas un relevé de facturation.
La clé existante ne dispose pas de la permission `user_read` permettant de
consulter le solde ElevenLabs. Aucun abonnement ni réglage de facturation n'a été
modifié.

## Actualisation complémentaire des six anciennes pistes

À la demande suivante de l'utilisateur, les six pistes des fiches 1 et 2 dont le
texte avait changé ont été actualisées : `f1.s0.b2`, `f1.s2.b6`, `f1.s2.b12`,
`f1.s2.b16`, `f2.s0.b0` et `f2.s1.b2`.

Ce complément représente **2 402 caractères**, six générations sans reprise
réseau et environ 2,7 minutes d'audio. Les six fichiers ont passé les contrôles
FFprobe et un décodage complet FFmpeg. Les 125 autres pistes des fiches 1 et 2
ont été conservées. Le total des deux demandes est de **120 206 caractères
soumis** ; le complément a été autorisé après le premier lot.

Les six URLs audio portent désormais une version calculée à partir du fichier
MP3. Le lecteur ne réutilise ainsi pas une ancienne réponse du cache à la place
du nouvel enregistrement. Le générateur applique cette règle aux futures pistes,
et le test de reprise vérifie le renouvellement de l'URL lorsque l'audio change.

## Prochaine reprise

Il reste **725 pistes / 186 033 caractères**, toutes absentes dans les fiches
11 à 20. Aucune piste existante n'est encore signalée comme obsolète par
l'inventaire.

Consulter d'abord l'inventaire à jour, sans génération ni modification :

```sh
npm run voix:generer -- --inventaire --manquantes-seules
```

Après avoir fixé la nouvelle enveloppe, reprendre avec `--manquantes-seules` et
`--max-caracteres <enveloppe>`. Sans filtre `--fiches`, le générateur traite d'abord
les anciennes pistes devenues obsolètes, puis poursuit les fiches manquantes.
Ne pas utiliser `--force` pour une simple reprise.

Le script sauvegarde le manifeste après chaque piste et écrit les fichiers par
renommage atomique. Un manifeste illisible ou un refus ElevenLabs arrête la
génération avec un code d'échec. Les tests de reprise et de plafonnement sont dans
`scripts/test-generation-voix.mjs` et n'appellent jamais le service réel.

Les fichiers sont intégrés aux ressources du site Cloudflare existant ; les
lectures de ces pistes prégénérées ne déclenchent pas de nouvel appel ElevenLabs.
