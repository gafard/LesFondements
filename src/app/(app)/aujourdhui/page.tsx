'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Immersion, { ChargementImmersion } from '@/components/Immersion';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { addJournalEntry, getAnswers, saveAnswer } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import { etapesTempsApart } from '@/lib/tempsApart';

function entierBorne(valeur: string | null, minimum: number, maximum: number, repli: number): number {
  const nombre = valeur === null ? Number.NaN : Number.parseInt(valeur, 10);
  return Number.isFinite(nombre) ? Math.max(minimum, Math.min(maximum, nombre)) : repli;
}

function AujourdhuiContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ficheId = entierBorne(searchParams.get('fiche'), 1, 20, 1);
  const sectionDemandee = searchParams.get('section');
  const sceneInitiale = entierBorne(searchParams.get('scene'), 0, 500, 0);
  const retour = searchParams.get('retour') === 'fiche' ? `/fiches/${ficheId}` : '/dashboard';

  const [fiche, setFiche] = useState<FicheLivret | null | undefined>(undefined);
  const [reponses, setReponses] = useState<Record<string, string> | null>(null);
  const etapes = useMemo(() => (fiche ? etapesTempsApart(fiche) : []), [fiche]);

  useEffect(() => {
    let actif = true;
    const reponsesPromise = user ? getAnswers(user.uid, ficheId) : Promise.resolve({});
    void Promise.all([chargerFiche(ficheId), reponsesPromise]).then(([contenu, valeurs]) => {
      if (!actif) return;
      setFiche(contenu);
      setReponses(valeurs);
    });
    return () => {
      actif = false;
    };
  }, [ficheId, user]);

  const sectionIndex = useMemo(() => {
    if (!fiche || !reponses) return 0;
    if (sectionDemandee !== null) {
      return entierBorne(sectionDemandee, 0, Math.max(0, etapes.length - 1), 0);
    }
    const prochaine = etapes.findIndex(
      (_section, index) => !reponses[`temps-apart:${index}`]
    );
    return prochaine >= 0 ? prochaine : 0;
  }, [etapes, fiche, reponses, sectionDemandee]);

  const enregistrer = (cle: string, valeur: string) => {
    setReponses((actuelles) => ({ ...(actuelles ?? {}), [cle]: valeur }));
    if (user) void saveAnswer(user.uid, ficheId, cle, valeur);
  };

  const terminer = async () => {
    if (!fiche || !reponses) return;
    const cle = `temps-apart:${sectionIndex}`;
    const dejaTerminee = Boolean(reponses[cle]);
    setReponses((actuelles) => ({ ...(actuelles ?? {}), [cle]: '1' }));
    if (!user) return;

    await saveAnswer(user.uid, ficheId, cle, '1');
    if (!dejaTerminee) {
      const sectionTitre = etapes[sectionIndex]?.section.titre || `Étape ${sectionIndex + 1}`;
      await addJournalEntry(
        user.uid,
        `📖 **Fiche ${fiche.id} : ${fiche.titre}** — ${sectionTitre}\n✨ Lecture, méditation, prière et mémorisation vécues aujourd’hui.`
      );
    }
  };

  if (fiche === undefined || reponses === null) return <ChargementImmersion />;

  if (fiche === null) {
    return (
      <div className="table-travail min-h-screen px-5 py-24 text-center text-encre-950">
        <p className="font-serif text-2xl font-bold">Ce temps ne peut pas encore s&apos;ouvrir.</p>
        <button
          type="button"
          onClick={() => router.push(retour)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50"
        >
          <ArrowLeft className="h-4 w-4" /> Revenir
        </button>
      </div>
    );
  }

  return (
    <Immersion
      fiche={fiche}
      sectionIndex={sectionIndex}
      reponses={reponses}
      onEnregistrer={enregistrer}
      onTerminer={terminer}
      onQuitter={() => router.push(retour)}
      dejaPreparee={Boolean(reponses[`temps-apart:${sectionIndex}`])}
      indexInitial={sceneInitiale}
    />
  );
}

export default function AujourdhuiPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense
        fallback={
          <div className="nuit fixed inset-0 z-[60] flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-or-300" />
          </div>
        }
      >
        <AujourdhuiContent />
      </Suspense>
    </ParcoursGate>
  );
}
