/**
 * Les liaisons Cloudflare visibles depuis le code de l'application.
 *
 * Écrit à la main plutôt que produit par `wrangler types` : la génération
 * complète amène les types du moteur workerd, qui entrent en conflit avec
 * ceux du DOM et faisaient échouer la compilation ailleurs. On ne déclare
 * donc que ce qu'on utilise.
 */
declare namespace globalThis {
  interface CloudflareEnv {
    /** Le seau des témoignages audio. */
    TEMOIGNAGES?: R2Bucket;
  }
}
