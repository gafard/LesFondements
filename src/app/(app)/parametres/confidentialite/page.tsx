'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * La confidentialité a rejoint les autres réglages.
 *
 * L'adresse reste : elle est imprimée sur le tableau de bord, et les gens la
 * gardent en favori. Elle mène désormais à la section correspondante.
 */
export default function ConfidentialiteRedirigee() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/parametres#donnees');
  }, [router]);
  return null;
}
