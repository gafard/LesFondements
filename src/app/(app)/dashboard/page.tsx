'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ParcoursGate from '@/components/ParcoursGate';

/**
 * Le tableau de bord « Aujourd'hui » a été retiré : il redisait la fiche en
 * la découpant en temps quotidiens. L'adresse reste — connexion, rappels et
 * application installée y mènent encore — et ouvre le parcours. La garde
 * « personnel » conserve le passage par l'accueil des comptes neufs.
 */
function VersLeParcours() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/fiches');
  }, [router]);
  return null;
}

export default function DashboardPage() {
  return (
    <ParcoursGate acces="personnel">
      <VersLeParcours />
    </ParcoursGate>
  );
}
