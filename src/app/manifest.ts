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
      // Android découpe l'icône à sa guise : la version « maskable » lui
      // donne la marge nécessaire pour le faire sans amputer le dessin.
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
    ],
  };
}
