/**
 * L'entrée du worker.
 *
 * OpenNext produit un worker qui n'expose que `fetch`. Un déclencheur cron
 * de Cloudflare appelle `scheduled()` : sans lui, l'ordonnanceur se serait
 * réveillé toutes les quinze minutes pour ne trouver personne, et les
 * rappels n'auraient jamais été envoyés — la panne la plus silencieuse qui
 * soit, puisqu'aucune requête n'échoue.
 *
 * On enveloppe donc le worker généré pour ajouter ce gestionnaire, en
 * réexportant tel quel tout ce dont OpenNext a besoin par ailleurs.
 */
import opennext from './.open-next/worker.js';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';

const worker = {
  async fetch(requete, env, ctx) {
    const reponse = await opennext.fetch(requete, env, ctx);
    const signee = new Response(reponse.body, reponse);
    // Injecté par la commande de déploiement depuis `git rev-parse HEAD` :
    // la production révèle ainsi exactement le code qu'elle exécute.
    if (env.BUILD_COMMIT) signee.headers.set('X-LesFondements-Commit', env.BUILD_COMMIT);
    return signee;
  },

  async scheduled(evenement, env, ctx) {
    // Le réveil passe par la route HTTP plutôt que d'appeler la logique en
    // direct : c'est le même chemin que celui qu'on peut déclencher à la
    // main pour vérifier, donc un seul comportement à comprendre.
    const secret = env.CRON_SECRET;
    if (!secret) return;

    const requete = new Request('https://interne/api/notifications/cron', {
      headers: { 'x-cron-secret': secret },
    });

    ctx.waitUntil(
      opennext
        .fetch(requete, env, ctx)
        .then((reponse) => reponse.text())
        .then((corps) => console.log('rappels :', corps))
        .catch((erreur) => console.error('rappels : échec du réveil', erreur))
    );
    void evenement;
  },
};

export default worker;
