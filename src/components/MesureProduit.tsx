'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useParcours } from '@/lib/ParcoursContext';
import { mesurer, mesurerRetention } from '@/lib/mesure';

export default function MesureProduit() {
  const pathname = usePathname();
  const { group, membership, session } = useParcours();

  useEffect(() => {
    mesurer('installation');
    mesurerRetention();
    const installee = () => mesurer('installation');
    window.addEventListener('appinstalled', installee);
    window.addEventListener('online', mesurerRetention);
    return () => {
      window.removeEventListener('appinstalled', installee);
      window.removeEventListener('online', mesurerRetention);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/fiches/1' || pathname.startsWith('/fiches/1?')) mesurer('fiche_1');
  }, [pathname]);

  useEffect(() => {
    if (group && membership?.status === 'actif') mesurer('groupe');
    if (membership?.preparedSteps.length) mesurer('preparation');
    if (session?.status === 'ouverte' || session?.status === 'terminee') mesurer('rencontre');
  }, [group, membership?.status, membership?.preparedSteps.length, session?.status]);

  return null;
}
