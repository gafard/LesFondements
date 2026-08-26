# Essais de charge

`plan-jmeter.jmx` s'ouvre avec [Apache JMeter](https://jmeter.apache.org/).

## Ce qu'il faut viser — et ce qu'il ne faut pas

L'essentiel de l'application est servi par le réseau de Cloudflare : les
vingt fiches, la Bible, les voix gravées. Ce n'est pas là que ça cède, et
les mettre sous charge ne mesure que la vitesse de Cloudflare.

Les quatre routes qui font un vrai travail sont :

| Route | Ce qu'elle coûte |
| --- | --- |
| `/api/temoignages/audio` | écriture dans R2 — à éprouver |
| `/api/memorisation/recitation` | **appel Groq facturé au débit** |
| `/api/temoignages/transcription` | **appel Groq facturé au débit** |
| `/api/voix` | **appel ElevenLabs facturé au caractère** |

## Avertissement

`/api/voix` **dépense de l'argent à chaque passage non gravé**. Un essai à
cent utilisateurs viderait le quota ElevenLabs du mois en quelques secondes.

Si vous devez l'éprouver, faites-le sur **un texte déjà gravé** : la réponse
vient alors de R2 et ne coûte rien. L'en-tête `X-Voix-Origine` dit lequel des
deux chemins a répondu — vérifiez qu'il indique `grave` avant de monter en
charge.

Les trois routes protégées exigent un jeton Firebase valide : un plan qui
n'en fournit pas mesurera la vitesse des refus, pas celle du service.

## Ce que JMeter ne verra pas

Firestore. Les lectures passent par le SDK dans le navigateur, jamais par
votre serveur. Le quota gratuit se surveille dans la console Firebase, et
c'est probablement là que se trouve la vraie limite.
