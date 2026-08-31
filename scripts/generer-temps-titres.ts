/**
 * Les titres des temps, pour le rappel du matin.
 *
 * Le rappel part d'un worker Cloudflare, qui n'a ni le livret complet ni la
 * logique de découpage — 400 Ko de texte pour en tirer quatre titres. On les
 * précalcule donc ici, dans un fichier de quelques kilo-octets.
 *
 * `npm run test:temps` vérifie ensuite que ce fichier dit toujours la même
 * chose que `etapesTempsApart` : sans quoi le rappel annoncerait un temps que
 * l'application n'ouvre plus.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import livret from '../src/data/livret.json' with { type: 'json' };
import { etapesTempsApart } from '../src/lib/tempsApart';
import type { FicheLivret } from '../src/lib/livret';

export function titresDesTemps(): Record<string, string[]> {
  const table: Record<string, string[]> = {};
  for (const fiche of (livret as { fiches: FicheLivret[] }).fiches) {
    table[String(fiche.id)] = etapesTempsApart(fiche).map(
      (etape, rang) => etape.section.titre ?? `Temps ${rang + 1}`
    );
  }
  return table;
}

// Le script est empaqueté dans /tmp avant d'être exécuté : le chemin de
// sortie se prend depuis le dossier du projet, pas depuis celui du bundle.
const table = titresDesTemps();
const destination = join(process.cwd(), 'src/data/tempsTitres.json');
writeFileSync(destination, `${JSON.stringify(table, null, 2)}\n`, 'utf8');
const total = Object.values(table).reduce((somme, t) => somme + t.length, 0);
console.log(`${Object.keys(table).length} fiches, ${total} temps écrits dans ${destination}`);
