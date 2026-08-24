'use client';

import dynamic from 'next/dynamic';

const BoutonEtude = dynamic(() => import('@/components/BoutonEtude'), { ssr: false });
const PanneauEtude = dynamic(() => import('@/components/PanneauEtude'), { ssr: false });
const BulleVerset = dynamic(() => import('@/components/BulleVerset'), { ssr: false });
const PWAInstallPrompt = dynamic(() => import('@/components/PWAInstallPrompt'), { ssr: false });
const MarquePageFlottant = dynamic(() => import('@/components/MarquePageFlottant'), { ssr: false });

export default function ClientTools() {
  return (
    <>
      <BoutonEtude />
      <BulleVerset />
      <PanneauEtude />
      <PWAInstallPrompt />
      <MarquePageFlottant />
    </>
  );
}
