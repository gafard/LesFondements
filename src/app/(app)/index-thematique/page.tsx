import { redirect } from 'next/navigation';

/** L'index thématique vit désormais dans la page du parcours. */
export default function IndexThematiquePage() {
  redirect('/fiches#index');
}
