import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les Fondements — parcours de discipulat',
    short_name: 'Les Fondements',
    description:
      'Les 20 fiches du parcours des fondements, préparées seul et partagées en petit groupe.',
    lang: 'fr',
    dir: 'ltr',
    // On entre dans l'application, pas sur la page de présentation.
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f8f3e9',
    theme_color: '#07162b',
    categories: ['education', 'lifestyle', 'books'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android découpe l'icône à sa guise — cercle, goutte, écusson. La
      // version « maskable » place le dessin dans la zone sûre, sur le fond
      // de marque, pour qu'aucune découpe ne l'ampute. Réutiliser l'icône
      // ordinaire ici revenait à laisser le système rogner le logo.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Android montre ces captures dans sa fiche d'installation : sans elles,
    // il propose une invite minimale au lieu de la vitrine complète.
    screenshots: [
      {
        src: '/capture-accueil.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Reprendre le parcours là où on s’est arrêté',
      },
      {
        src: '/capture-etude.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'L’index thématique : retrouver un sujet dans les vingt fiches',
      },
    ],
    shortcuts: [
      {
        name: 'La fiche de la semaine',
        short_name: 'Ma fiche',
        url: '/fiches',
        description: 'Reprendre la préparation là où elle s’est arrêtée',
      },
      {
        name: 'Ma cellule',
        short_name: 'Cellule',
        url: '/groupes',
        description: 'La rencontre, le mur de prière, les partages',
      },
      {
        name: 'Écrire dans mon journal',
        short_name: 'Journal',
        url: '/journal',
        description: 'Déposer ce que la lecture a remué',
      },
      {
        name: 'Le verset du jour',
        short_name: 'Verset',
        url: '/memorisation',
        description: 'Réviser et réciter les versets à retenir',
      },
    ],
  };
}
