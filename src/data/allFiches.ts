import { fiches, Fiche } from './fiches';
import { fichesSuite } from './fiches-suite';

export const allFiches: Fiche[] = [...fiches, ...fichesSuite];
