'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Immersion, { ChargementImmersion } from '@/components/Immersion';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { getAnswers, saveAnswer, markFicheCompleted } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import { useParcours } from '@/lib/ParcoursContext';
import { memoriserPassage } from '@/lib/marquePage';
import { etapesTempsApart } from '@/lib/tempsApart';

function entierBorne(valeur: string | null, minimum: number, maximum: number, repli: number): number {
  const nombre = valeur === null ? Number.NaN : Number.parseInt(valeur, 10);
  return Number.isFinite(nombre) ? Math.max(minimum, Math.min(maximum, nombre)) : repli;
}

function AujourdhuiContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { group, preparationStep } = useParcours();
  const [erreur, setErreur] = useState('');
  const searchParams = useSearchParams();
  const ficheId = entierBorne(searchParams.get('fiche'), 1, 20, group?.currentStep || 1);
  const sectionDemandee = searchParams.get('section');
  const sceneInitiale = entierBorne(searchParams.get('scene'), 0, 500, 0);
  const momentInitial = searchParams.get('moment');
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
    if (user) void saveAnswer(user.uid, ficheId, cle, valeur).catch(() => setErreur('Votre réponse n’a pas été conservée. Copiez-la avant de quitter et libérez de la place sur cet appareil.'));
  };

  const terminer = async () => {
    if (!fiche || !reponses) return;
    const cle = `temps-apart:${sectionIndex}`;
    if (!user) return;
    await saveAnswer(user.uid, ficheId, cle, '1');
    setReponses((actuelles) => ({ ...(actuelles ?? {}), [cle]: '1' }));
    if (etapes.every((_, i) => i === sectionIndex || Boolean(reponses[`temps-apart:${i}`]))) {
      await markFicheCompleted(user.uid, ficheId);
    }
    const suivante = etapes.findIndex((_, i) => i !== sectionIndex && !reponses[`temps-apart:${i}`]);
    const continuer = suivante >= 0 || (!group && ficheId < 20);
    const prochaineFiche = suivante >= 0 || group || ficheId === 20 ? ficheId : ficheId + 1;
    memoriserPassage({ uid: user.uid,
      url: continuer ? `/aujourdhui?fiche=${prochaineFiche}&section=${suivante >= 0 ? suivante : 0}&scene=0` : ficheId === 20 ? '/certificat' : `/fiches/${ficheId}`,
      titre: continuer ? `Fiche ${prochaineFiche}` : 'Relire mon parcours',
      sousTitre: continuer ? 'Prochain temps, quand tu le souhaites' : 'Les mots que tu gardes',
      type: continuer ? 'immersion' : 'fiche',
    });
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

  if (group && ficheId > Math.max(1, preparationStep)) return <div className="p-8 text-encre-950"><p>Cette fiche s’ouvrira avec l’avancée de votre cellule.</p><button onClick={() => router.push('/dashboard')} className="mt-4 min-h-11 rounded-full border px-5">Revenir à mon temps</button></div>;

  return (
    <ParcoursGate acces={ficheId === 1 ? 'decouverte' : 'lecture'}>
    {erreur && <div role="alert" className="fixed inset-x-4 top-4 z-[100] rounded-xl bg-white p-4 text-encre-950">{erreur}</div>}
    <Immersion
      key={`${user?.uid}:${ficheId}:${sectionIndex}`}
      fiche={fiche}
      sectionIndex={sectionIndex}
      reponses={reponses}
      onEnregistrer={enregistrer}
      onTerminer={terminer}
      onQuitter={() => router.push(retour)}
      dejaPreparee={Boolean(reponses[`temps-apart:${sectionIndex}`])}
      indexInitial={sceneInitiale}
      momentInitial={momentInitial}
    />
    </ParcoursGate>
  );
}

export default function AujourdhuiPage() {
  return (
    <ParcoursGate acces="decouverte">
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
