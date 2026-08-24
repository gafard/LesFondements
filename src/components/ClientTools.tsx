'use client';

import dynamic from 'next/dynamic';
import { fermerCentre, useCentreOuvert } from '@/lib/centre';

const BoutonEtude = dynamic(() => import('@/components/BoutonEtude'), { ssr: false });
const PanneauEtude = dynamic(() => import('@/components/PanneauEtude'), { ssr: false });
const BulleVerset = dynamic(() => import('@/components/BulleVerset'), { ssr: false });
const MarquePageFlottant = dynamic(() => import('@/components/MarquePageFlottant'), { ssr: false });
const CentreApplication = dynamic(() => import('@/components/CentreApplication'), { ssr: false });

export default function ClientTools() {
  const centre = useCentreOuvert();
  return (
    <>
      <BoutonEtude />
      <BulleVerset />
      <PanneauEtude />
      <MarquePageFlottant />
      <CentreApplication ouvert={centre} onFermer={fermerCentre} />
    </>
  );
}
