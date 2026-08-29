'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Feather,
  Loader2,
  LockKeyhole,
  MessageCircleHeart,
  NotebookPen,
  Quote,
  Sparkles,
  Sunrise,
} from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import { getAnswers, getCachedAnswers, saveAnswer } from '@/lib/firestore';
import { nextMeetingDate } from '@/lib/parcoursDomain';
import { texteDuVerset } from '@/data/versets';
import { mesurer } from '@/lib/mesure';
import {
  CLE_ETAT_RITUEL,
  construireCheminRituel,
  jourLocal,
  lireEtatRituel,
  momentCourant,
  pasEnAttenteDeRetour,
  progressionRituel,
  serialiserEtatRituel,
  type EtatRituel,
  type MomentRituel,
  type RetourPasRituel,
} from '@/lib/rituel';

const RETOURS: Array<{
  valeur: RetourPasRituel;
  label: string;
  aide: string;
  couleur: string;
}> = [
  {
    valeur: 'vecu',
    label: 'Vécu',
    aide: 'Ce pas a pris corps.',
    couleur: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    valeur: 'en_chemin',
    label: 'En chemin',
    aide: 'Je souhaite le poursuivre.',
    couleur: 'border-sky-300 bg-sky-50 text-sky-800',
  },
  {
    valeur: 'soutien',
    label: 'Besoin de soutien',
    aide: 'Je pourrai en parler si je le choisis.',
    couleur: 'border-rose-300 bg-rose-50 text-rose-800',
  },
];

function bornerFiche(valeur: number, maximum: number): number {
  return Math.max(1, Math.min(Number.isFinite(valeur) ? valeur : 1, Math.max(1, maximum)));
}

function RituelContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { group, preparationStep } = useParcours();
  const demande = Number.parseInt(searchParams.get('fiche') ?? '', 10);
  const maximum = preparationStep || group?.currentStep || 1;
  const ficheId = bornerFiche(Number.isFinite(demande) ? demande : group?.currentStep ?? 1, maximum);

  const [fiche, setFiche] = useState<FicheLivret | null | undefined>(undefined);
  const [etat, setEtat] = useState<EtatRituel | null>(() =>
    user ? lireEtatRituel(getCachedAnswers(user.uid, ficheId), ficheId) : null
  );
  const [momentChoisi, setMomentChoisi] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [maintenant] = useState(() => Date.now());

  useEffect(() => {
    let actif = true;
    if (!user) return () => { actif = false; };
    void Promise.all([chargerFiche(ficheId), getAnswers(user.uid, ficheId)]).then(
      ([contenu, reponses]) => {
        if (!actif) return;
        setFiche(contenu);
        setEtat(lireEtatRituel(reponses, ficheId));
      }
    );
    return () => { actif = false; };
  }, [ficheId, user]);

  const moments = useMemo(() => (fiche ? construireCheminRituel(fiche) : []), [fiche]);
  const courant = etat ? momentCourant(moments, etat) : null;
  const selectionne =
    moments.find((moment) => moment.id === momentChoisi) ?? courant ?? moments[0] ?? null;
  const progression = etat
    ? progressionRituel(moments, etat)
    : { termines: 0, total: moments.length, pourcentage: 0 };
  const retourAttendu = etat ? pasEnAttenteDeRetour(moments, etat) : null;

  const prochaineRencontre = group
    ? nextMeetingDate(group.meeting, group.stepOpenedAt)
    : null;
  const joursAvantRencontre = prochaineRencontre
    ? Math.max(0, Math.ceil((prochaineRencontre.getTime() - maintenant) / 86_400_000))
    : null;

  async function enregistrerEtat(suivant: EtatRituel): Promise<void> {
    if (!user) return;
    setEtat(suivant);
    await saveAnswer(user.uid, ficheId, CLE_ETAT_RITUEL, serialiserEtatRituel(suivant));
  }

  async function terminerMoment(moment: MomentRituel, pas: string): Promise<void> {
    if (!etat || !user || !pas.trim()) return;
    const maintenant = Date.now();
    const suivant: EtatRituel = {
      ...etat,
      moments: {
        ...etat.moments,
        [moment.id]: {
          ...etat.moments[moment.id],
          pas: pas.trim(),
          completedAt: etat.moments[moment.id]?.completedAt ?? maintenant,
          completedDay: etat.moments[moment.id]?.completedDay ?? jourLocal(new Date(maintenant)),
          updatedAt: maintenant,
        },
      },
    };
    await enregistrerEtat(suivant);
    if (moment.type === 'synthese') {
      await saveAnswer(user.uid, ficheId, `pas:${ficheId}`, pas.trim());
    }
    mesurer('rituel');
    const prochain = momentCourant(moments, suivant);
    setMomentChoisi(prochain?.id ?? moment.id);
    setConfirmation(
      prochain && prochain.id !== moment.id
        ? 'Moment gardé. Le prochain est prêt quand tu le seras.'
        : 'Ta semaine est rassemblée. Tu peux revenir sur chaque carte librement.'
    );
  }

  async function noterRetour(moment: MomentRituel, feedback: RetourPasRituel): Promise<void> {
    if (!etat) return;
    const existant = etat.moments[moment.id];
    if (!existant) return;
    await enregistrerEtat({
      ...etat,
      moments: {
        ...etat.moments,
        [moment.id]: { ...existant, feedback, updatedAt: Date.now() },
      },
    });
    setConfirmation('Retour noté dans ton espace privé.');
  }

  if (!user || fiche === undefined || !etat || etat.ficheId !== ficheId) {
    return <ChargementRituel />;
  }

  if (!fiche || !selectionne) {
    return (
      <div className="table-travail min-h-screen px-4 py-16">
        <div className="feuille mx-auto max-w-xl rounded-3xl p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-or-700" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-encre-950">Fiche introuvable</h1>
          <Link href="/fiches" className="bouton-or mt-6 inline-flex min-h-11 items-center rounded-full px-6">
            Revenir au parcours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="table-travail min-h-screen overflow-hidden px-3 pb-20 pt-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="feuille relative overflow-visible rounded-3xl px-5 pb-6 pt-8 shadow-lg sm:px-8 lg:px-10">
          <span className="punaise -top-2 left-8" />
          <span className="ruban -top-3 right-16 -rotate-2 rounded-[2px]" />
          <span className="absolute -top-1 right-6 h-24 w-5 rounded-b-md bg-[#7d2331] shadow-md" aria-hidden="true" />
          <span className="absolute right-[1.62rem] top-[5.25rem] h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-[#7d2331]" aria-hidden="true" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-or-700">
                <Sunrise className="h-4 w-4" /> Un temps à part · 3 à 5 minutes
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-none text-encre-950 sm:text-5xl">
                Ma semaine sur la table
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-encre-600 sm:text-base">
                Fiche {fiche.id} — {fiche.titre}. Un peu de Parole, une question, puis un pas qui vient de toi.
              </p>
            </div>

            <div className="postit postit-bleu w-full rotate-1 rounded-sm px-5 py-4 shadow-sm lg:w-64">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-encre-700">
                <CalendarDays className="h-4 w-4" /> Prochaine rencontre
              </p>
              <p className="mt-2 font-serif text-xl font-bold text-encre-950">
                {joursAvantRencontre === null
                  ? 'À ton rythme'
                  : joursAvantRencontre === 0
                    ? 'Aujourd’hui'
                    : `Dans ${joursAvantRencontre} jour${joursAvantRencontre > 1 ? 's' : ''}`}
              </p>
              {prochaineRencontre && group && (
                <p className="mt-1 text-xs text-encre-600">
                  {new Intl.DateTimeFormat('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: group.meeting.timezone,
                  }).format(prochaineRencontre)}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-7 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-parchemin-300" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-emerald-600 transition-[width] duration-500"
                style={{ width: `${progression.pourcentage}%` }}
              />
            </div>
            <p className="shrink-0 text-xs font-bold text-encre-600">
              {progression.termines}/{progression.total} moments
            </p>
          </div>
        </header>

        {retourAttendu && (
          <RetourDuLendemain
            moment={retourAttendu}
            pas={etat.moments[retourAttendu.id]?.pas ?? ''}
            onChoisir={(feedback) => void noterRetour(retourAttendu, feedback)}
          />
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          <aside className="dossier relative rounded-2xl border border-or-800/15 bg-[#c9ae78] px-3 pb-4 pt-8 shadow-lg lg:sticky lg:top-6">
            <span className="absolute -top-5 left-4 rounded-t-xl border border-b-0 border-or-800/15 bg-[#c9ae78] px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-encre-800">
              Chemin de préparation
            </span>
            <ol className="space-y-2">
              {moments.map((moment) => {
                const termine = !!etat.moments[moment.id]?.completedAt;
                const actif = selectionne.id === moment.id;
                return (
                  <li key={moment.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMomentChoisi(moment.id);
                        setConfirmation(null);
                      }}
                      aria-current={actif ? 'step' : undefined}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        actif
                          ? 'translate-x-1 border-or-600 bg-parchemin-50 shadow-md'
                          : 'border-transparent bg-parchemin-100/75 hover:border-or-500/30 hover:bg-parchemin-50'
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        termine ? 'bg-emerald-600 text-white' : actif ? 'bg-or-500 text-encre-950' : 'bg-parchemin-300 text-encre-600'
                      }`}>
                        {termine ? <Check className="h-4 w-4" /> : moment.ordre}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-bold leading-tight text-encre-900">
                          {moment.titre}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-encre-500">
                          {moment.type === 'synthese' ? 'Relire' : 'Lire · méditer · choisir'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-encre-950/85 px-3 py-3 text-[11px] leading-relaxed text-parchemin-100/80">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or-300" />
              Tes pas et tes retours restent privés. Rien n’est transmis au groupe automatiquement.
            </p>
          </aside>

          <MomentSurLaTable
            key={`${fiche.id}:${selectionne.id}`}
            moment={selectionne}
            avancement={etat.moments[selectionne.id]}
            confirmation={confirmation}
            onTerminer={(pas) => void terminerMoment(selectionne, pas)}
          />
        </div>

        <footer className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-encre-900/10 bg-parchemin-50/65 px-4 py-4 text-sm sm:flex-row">
          <Link href={`/fiches/${fiche.id}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-encre-700 hover:text-or-800">
            <ArrowLeft className="h-4 w-4" /> Ouvrir la fiche complète
          </Link>
          <div className="flex items-center gap-2">
            {fiche.id > 1 && (
              <Link href={`/aujourdhui?fiche=${fiche.id - 1}`} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-encre-900/15 bg-parchemin-50" aria-label="Fiche précédente">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            {fiche.id < maximum && (
              <Link href={`/aujourdhui?fiche=${fiche.id + 1}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-encre-950 px-5 text-xs font-bold text-parchemin-50">
                Préparer la fiche {fiche.id + 1} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function MomentSurLaTable({
  moment,
  avancement,
  confirmation,
  onTerminer,
}: {
  moment: MomentRituel;
  avancement?: EtatRituel['moments'][string];
  confirmation: string | null;
  onTerminer: (pas: string) => void;
}) {
  const [pas, setPas] = useState(avancement?.pas ?? '');
  const termine = !!avancement?.completedAt;

  return (
    <article className="relative min-w-0">
      <div className="feuille relative rounded-3xl px-5 py-7 shadow-xl sm:px-8 sm:py-9">
        <span className="trombone absolute -top-3 left-9" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-encre-900/15 pb-4">
          <div>
            <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
              moment.sourceLabel === 'Accompagnement de l’application'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-or-100 text-or-800'
            }`}>
              {moment.sourceLabel === 'Accompagnement de l’application'
                ? <Sparkles className="h-3.5 w-3.5" />
                : <BookOpen className="h-3.5 w-3.5" />}
              {moment.sourceLabel}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-encre-950 sm:text-4xl">
              {moment.titre}
            </h2>
          </div>
          <span className="timbre inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-encre-700">
            <Clock3 className="h-3.5 w-3.5" /> 3–5 min
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {moment.points.map((point, index) => (
            <p key={index} className="font-serif text-lg leading-[1.75] text-encre-800 sm:text-xl">
              {point}
            </p>
          ))}

          {moment.versets.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {moment.versets.map((reference) => (
                <blockquote key={reference} className="relative rounded-2xl border border-or-300 bg-parchemin-100 px-4 pb-4 pt-5">
                  <Quote className="absolute right-3 top-3 h-5 w-5 text-or-400/55" />
                  <p className="pr-6 text-xs font-bold uppercase tracking-[0.12em] text-or-800">{reference}</p>
                  <p className="mt-2 text-sm leading-relaxed text-encre-700">
                    {texteDuVerset(reference) ?? 'Recopie ce passage ici depuis ta Bible.'}
                  </p>
                </blockquote>
              ))}
            </div>
          )}

          {moment.lectures.map((lecture) => (
            <div key={lecture} className="flex items-start gap-3 rounded-xl border-l-4 border-or-500 bg-or-50 px-4 py-3 text-sm leading-relaxed text-encre-700">
              <Feather className="mt-0.5 h-4 w-4 shrink-0 text-or-700" />
              <span>{lecture}</span>
            </div>
          ))}

          {moment.question && (
            <div className="rounded-2xl border border-encre-900/10 bg-white/55 px-5 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-encre-500">Question du livret</p>
              <p className="mt-2 font-serif text-xl font-semibold leading-relaxed text-encre-900">
                {moment.question}
              </p>
              <Link href={moment.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-or-800 underline-offset-4 hover:underline">
                Répondre dans la fiche
                {moment.questionsRestantes > 0 && ` · ${moment.questionsRestantes} autre${moment.questionsRestantes > 1 ? 's' : ''}`}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="postit postit-jaune relative -mt-2 ml-auto w-[94%] max-w-xl rotate-[-0.5deg] rounded-sm px-5 py-6 shadow-lg sm:px-7">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 rotate-1 rounded-[2px]" aria-hidden="true" />
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-encre-600">
          <NotebookPen className="h-4 w-4" /> Mon pas personnel
        </p>
        <label htmlFor={`pas-${moment.id}`} className="mt-3 block font-serif text-xl font-bold leading-snug text-encre-950">
          {moment.invitation}
        </label>
        <textarea
          id={`pas-${moment.id}`}
          value={pas}
          onChange={(event) => setPas(event.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Aujourd’hui, je choisis de…"
          className="mt-4 min-h-24 w-full resize-y rounded-xl border border-encre-900/15 bg-white/45 px-4 py-3 text-base leading-relaxed text-encre-900 outline-none transition focus:border-or-700 focus:ring-4 focus:ring-or-400/20"
        />
        <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-xs text-encre-600">
            <LockKeyhole className="h-3.5 w-3.5" /> Privé, sauf si tu choisis de le partager.
          </p>
          <button
            type="button"
            onClick={() => onTerminer(pas)}
            disabled={!pas.trim()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            {termine ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {termine ? 'Mettre à jour mon pas' : 'Terminer ce moment'}
          </button>
        </div>
        {confirmation && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
            {confirmation}
          </p>
        )}
      </div>
    </article>
  );
}

function RetourDuLendemain({
  moment,
  pas,
  onChoisir,
}: {
  moment: MomentRituel;
  pas: string;
  onChoisir: (feedback: RetourPasRituel) => void;
}) {
  return (
    <section className="postit postit-rose relative ml-auto mt-7 max-w-3xl rotate-[0.35deg] rounded-sm px-5 py-5 shadow-lg sm:px-7">
      <span className="ruban -top-3 left-8 -rotate-2 rounded-[2px]" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/50 text-rose-800">
          <MessageCircleHeart className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-800">Le lendemain · retour sans jugement</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-encre-950">Comment ce pas s’est-il vécu ?</h2>
          <p className="mt-2 text-sm leading-relaxed text-encre-700">
            « {pas} » <span className="text-encre-500">— {moment.titre}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {RETOURS.map((retour) => (
          <button
            key={retour.valeur}
            type="button"
            onClick={() => onChoisir(retour.valeur)}
            className={`min-h-14 rounded-xl border px-3 py-2 text-left transition hover:-translate-y-0.5 ${retour.couleur}`}
          >
            <span className="block text-sm font-bold">{retour.label}</span>
            <span className="mt-0.5 block text-[11px] leading-snug opacity-80">{retour.aide}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ChargementRituel() {
  return (
    <div className="table-travail flex min-h-screen items-center justify-center px-4">
      <div className="feuille w-full max-w-sm rounded-3xl p-8 text-center shadow-lg">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-or-700" />
        <p className="mt-4 font-serif text-xl font-bold text-encre-900">On ouvre ta semaine…</p>
        <p className="mt-1 text-sm text-encre-600">Le livret et tes notes arrivent sur la table.</p>
      </div>
    </div>
  );
}

export default function RituelPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense fallback={<ChargementRituel />}>
        <RituelContent />
      </Suspense>
    </ParcoursGate>
  );
}
