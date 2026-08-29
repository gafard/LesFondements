'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';

function RituelRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/aujourdhui?${params}` : '/aujourdhui');
  }, [router, searchParams]);

  return (
    <div className="table-travail min-h-screen flex items-center justify-center text-or-700">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

export default function RituelPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense fallback={
        <div className="table-travail min-h-screen flex items-center justify-center text-or-700">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <RituelRedirect />
      </Suspense>
    </ParcoursGate>
  );
}
