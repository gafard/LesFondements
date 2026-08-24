'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Monitor,
  SearchX,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getGroupByCode, requestToJoin } from '@/lib/parcoursStore';
import type { ParcoursGroup } from '@/lib/types';

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export default function RejoindreParCode() {
  const params = useParams();
  const router = useRouter();
  const code = decodeURIComponent(String(params.code ?? ''));
  const { user, loading: authLoading } = useAuth();
  const { refresh, profile } = useParcours();

  const [group, setGroup] = useState<ParcoursGroup | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => {
    void getGroupByCode(code).then(setGroup);
  }, [code]);

  const rejoindre = async () => {
    if (!group || !user) return;
    setBusy(true);
    setErreur(null);
    try {
      await requestToJoin({
        groupId: group.id,
        user: {
          uid: user.uid,
          displayName: user.displayName || 'Disciple',
          email: user.email,
          photoURL: user.photoURL,
        },
        message: "Arrivé·e par le lien d'invitation.",
        place: profile?.place,
      });
      await refresh();
      setEnvoye(true);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Impossible de rejoindre ce groupe.');
    } finally {
      setBusy(false);
    }
  };

  const ModeIcon =
    group?.meeting.mode === 'ligne' ? Video : group?.meeting.mode === 'hybride' ? Monitor : MapPin;

  return (
    <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28">
      
      {/* Background Illustrated Community Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/group-communion-hero.jpg"
          alt="Communion fraternelle autour de la Parole"
          fill
          sizes="100vw"
          priority
          className="object-cover object-center opacity-25 sm:opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07162b]/95 via-[#07162b]/90 to-[#07162b]/95" />
      </div>

      <span className="vitrail left-[-6rem] top-[-4rem] h-80 w-80 bg-or-400/12 animate-souffle relative z-1" />
      <span className="vitrail bottom-[-8rem] right-[-6rem] h-96 w-96 bg-encre-400/25 relative z-1" />

      <div className="relative z-10 w-full max-w-lg">
        {group === undefined ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-or-300" />
            <p className="text-2xs text-parchemin-100/50">Vérification du code…</p>
          </div>
        ) : group === null ? (
          <div className="animate-reveal rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
            <SearchX className="mx-auto h-9 w-9 text-parchemin-100/30" strokeWidth={1.5} />
            <h1 className="mt-5 font-serif text-2xl font-bold text-parchemin-100">
              Ce code ne mène à aucun groupe
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-parchemin-100/60">
              Le code <span className="font-mono text-or-200">{code}</span> n&apos;existe pas, ou le
              groupe a été fermé. Redemandez-le à la personne qui vous a invité.
            </p>
            <Link
              href="/onboarding"
              className="bouton-or mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold"
            >
              Chercher un groupe près de moi <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : envoye ? (
          <div className="animate-reveal rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
            <span className="mx-auto grid h-16 w-16 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
              <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
            </span>
            <h1 className="mt-5 font-serif text-2xl font-bold text-parchemin-100">
              C&apos;est envoyé
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-parchemin-100/65">
              {group.visibility === 'ouvert'
                ? `Vous faites partie de ${group.name}. La première fiche est ouverte.`
                : `${group.leaderName} reçoit votre demande. Dès qu'elle est validée, le parcours s'ouvre.`}
            </p>
            <Link
              href="/dashboard"
              className="bouton-or mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
            >
              Voir mon espace <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <div className="animate-reveal">
            <p className="text-center text-2xs font-bold uppercase tracking-[0.22em] text-or-200">
              Vous êtes invité
            </p>
            <h1 className="mt-4 text-center font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
              <span className="titre-or">{group.name}</span>
            </h1>
            <p className="mt-2 text-center text-2xs text-parchemin-100/55">
              Animé par {group.leaderName} · {group.place.city}
            </p>

            <div className="mt-7 rounded-3xl border border-white/12 bg-white/[0.05] p-5 sm:p-6">
              <p className="text-xs leading-relaxed text-parchemin-100/75">{group.description}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Detail icon={ModeIcon} label="Format">
                  {group.meeting.mode === 'ligne'
                    ? 'En ligne'
                    : group.meeting.mode === 'hybride'
                      ? 'Présentiel + visio'
                      : 'En présentiel'}
                </Detail>
                <Detail icon={CalendarDays} label="Rythme">
                  {group.meeting.rhythm === 'bimensuel' ? 'Un ' : 'Chaque '}
                  {WEEKDAYS[group.meeting.weekday]}
                  {group.meeting.rhythm === 'bimensuel' ? ' sur deux' : ''}
                </Detail>
                <Detail icon={Clock} label="Heure">
                  {group.meeting.time}
                </Detail>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-2xs text-parchemin-100/65">
                <Users className="h-3.5 w-3.5 text-or-300/80" />
                {group.membersCount}/{group.capacity} participants
                {group.currentStep > 1 && (
                  <span className="text-parchemin-100/45">
                    · le groupe en est à la fiche {group.currentStep}
                  </span>
                )}
              </div>

              {erreur && (
                <p className="mt-4 rounded-xl bg-rose-500/12 px-3.5 py-2.5 text-2xs leading-relaxed text-rose-200">
                  {erreur}
                </p>
              )}
            </div>

            <div className="mt-7 text-center">
              {authLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-or-300" />
              ) : user ? (
                <button
                  type="button"
                  onClick={() => void rejoindre()}
                  disabled={busy}
                  className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Rejoindre ce groupe
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push(`/login?suite=/rejoindre/${code}`)}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
                  >
                    Créer mon compte pour rejoindre <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <p className="mt-3 text-2xs text-parchemin-100/45">
                    Vous reviendrez ici juste après.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3">
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-parchemin-100/45">
        <Icon className="h-3 w-3" strokeWidth={2} />
        {label}
      </span>
      <p className="mt-1 text-xs font-semibold text-parchemin-100">{children}</p>
    </div>
  );
}
