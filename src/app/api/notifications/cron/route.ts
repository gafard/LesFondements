import { NextResponse } from 'next/server';

const MEDITATIONS_QUOTIDIENNES = [
  {
    title: 'Goutte de Rosée · Dieu est amour',
    body: '« Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu ! » (1 Jn 3:1)',
    url: '/fiches/1',
  },
  {
    title: 'Goutte de Rosée · La Grâce',
    body: '« Car c’est par la grâce que vous êtes sauvés, par le moyen de la foi. » (Ep 2:8)',
    url: '/fiches/4',
  },
  {
    title: 'Goutte de Rosée · Nouvelle Création',
    body: '« Si quelqu’un est en Christ, il est une nouvelle créature. » (2 Co 5:17)',
    url: '/fiches/5',
  },
  {
    title: 'Goutte de Rosée · Refuge & Paix',
    body: '« Arrêtez, et sachez que je suis Dieu : Je domine sur les nations. » (Ps 46:11)',
    url: '/memorisation',
  },
  {
    title: 'Goutte de Rosée · La Vérité qui libère',
    body: '« Le voleur ne vient que pour dérober ; moi, je suis venu afin que les brebis aient la vie en abondance. » (Jn 10:10)',
    url: '/fiches/7',
  },
];

export async function GET() {
  const jourDuMois = new Date().getDate();
  const index = jourDuMois % MEDITATIONS_QUOTIDIENNES.length;
  const meditation = MEDITATIONS_QUOTIDIENNES[index];

  return NextResponse.json({
    active: false,
    currentTime: new Date().toISOString(),
    dailyMeditation: meditation,
    message: 'Ordonnanceur distant non activé : aucun envoi automatique n’est simulé.',
  });
}
