import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les Fondements — Parcours de Discipleship',
    short_name: 'Les Fondements',
    description: 'Parcours interactif de 20 fiches pour grandir dans la foi chrétienne et la maturité spirituelle.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f3e9',
    theme_color: '#08172d',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
