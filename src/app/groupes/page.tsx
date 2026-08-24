'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Flame,
  Heart,
  Hourglass,
  Info,
  MapPin,
  MessageSquare,
  Monitor,
  PlayCircle,
  ShieldCheck,
  Bookmark,
  Star,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import InvitePanel from '@/components/InvitePanel';
import {
  addPost,
  approveMember,
  deletePost,
  getPosts,
  markPrayerAnswered,
  nextMeetingDate,
  openMeeting,
  rejectMember,
  setSessionAttendance,
  subscribe,
  toggleAmen,
  togglePrayed,
} from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import type { AttendanceMode, GroupPost, GroupPostKind } from '@/lib/types';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

type Onglet = 'rencontre' | 'membres' | 'priere' | 'partages' | 'pepites' | 'guide';

const ONGLETS: { id: Onglet; label: string; icon: typeof Users }[] = [
  { id: 'rencontre', label: 'La rencontre', icon: CalendarDays },
  { id: 'membres', label: 'Les membres', icon: Users },
  { id: 'priere', label: 'Mur de prière', icon: Heart },
  { id: 'partages', label: 'Partages', icon: MessageSquare },
  { id: 'pepites', label: 'Pépites', icon: Star },
  { id: 'guide', label: 'Guide animateur', icon: ShieldCheck },
];

function CelluleContent() {
  const { user } = useAuth();
  const { group, members, membership, session, isLeader, gate, refresh } = useParcours();
  const [onglet, setOnglet] = useState<Onglet>('rencontre');
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [codeCopie, setCodeCopie] = useState(false);
  const [inviteOuvert, setInviteOuvert] = useState(false);

  const chargerPosts = useCallback(() => {
    if (!group) return;
    void getPosts(group.id).then(setPosts);
  }, [group]);

  useEffect(() => {
    chargerPosts();
    if (!group) return;
    return subscribe(`posts:${group.id}`, chargerPosts);
  }, [group, chargerPosts]);

  const actifs = useMemo(() => members.filter((m) => m.status === 'actif'), [members]);
  const enAttente = useMemo(() => members.filter((m) => m.status === 'en_attente'), [members]);

  if (!group || !user) return null;

  const fiche = FICHES_META.find((f) => f.id === group.currentStep);
  const prochaine = nextMeetingDate(group.meeting, group.stepOpenedAt);
  const enRencontre = group.stepPhase === 'rencontre' && session?.status === 'ouverte';
  const prets = actifs.filter((m) => m.preparedSteps.includes(group.currentStep)).length;

  const copierCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCodeCopie(true);
      setTimeout(() => setCodeCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const ouvrirRencontre = async () => {
    await openMeeting(group.id, user.uid);
    await refresh();
  };

  const declarerPresence = async (mode: AttendanceMode) => {
    await setSessionAttendance(group.id, user.uid, mode);
    await refresh();
  };

  return (
    <div className="table-travail min-h-screen pb-16 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ══ En-tête du groupe ══ */}
        <header className="nuit nuit-grain relative mb-8 overflow-hidden rounded-4xl p-6 text-parchemin-100 shadow-lg sm:p-8">
          <div className="absolute inset-0 z-0">
            <Image
              src="/warm-fellowship.jpg"
              alt="Communion fraternelle et partage dans un salon chaleureux"
              fill
              sizes="100vw"
              className="object-cover object-[center_30%] opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07162b] via-[#07162b]/85 to-[#07162b]/65" />
          </div>

          <span className="vitrail right-[-6rem] top-[-6rem] h-72 w-72 bg-or-400/14 relative z-1" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-serif italic text-amber-300 text-xs sm:text-sm mb-1">
                Cellule de communion fraternelle
              </p>
              <h1 className="font-serif text-3xl font-bold text-parchemin-100 sm:text-4xl">{group.name}</h1>

              <p className="mt-1.5 text-xs text-parchemin-100/65">
                {group.meeting.mode === 'ligne'
                  ? 'Rencontres entièrement en ligne'
                  : group.meeting.mode === 'hybride'
                    ? 'Sur place et en visio'
                    : 'Rencontres en présentiel'}{' '}
                · {group.place.city} · animé par {group.leaderName}
              </p>

              <p className="mt-3 text-sm text-parchemin-100/80">
                Fiche de la semaine :{' '}
                <strong className="text-or-300">
                  Fiche {group.currentStep} — {fiche?.titre ?? '…'}
                </strong>
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <button
                onClick={copierCode}
                className="verre flex items-center gap-2 rounded-2xl px-4 py-2.5 text-2xs transition-colors hover:bg-white/14"
              >
                <span className="text-parchemin-100/55">Code</span>
                <strong className="font-mono tracking-[0.18em] text-or-300">
                  {group.inviteCode}
                </strong>
                {codeCopie ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-parchemin-100/50" />
                )}
              </button>

              {group.meeting.callLink && (
                <a
                  href={group.meeting.callLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="verre inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/14"
                >
                  <Video className="h-3.5 w-3.5 text-or-300" />
                  Lien visio
                </a>
              )}

              {enRencontre ? (
                <Link
                  href="/groupes/rencontre"
                  className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-encre-950 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-encre-950" />
                  </span>
                  Rejoindre la rencontre
                </Link>
              ) : isLeader ? (
                <button
                  onClick={() => void ouvrirRencontre()}
                  className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  <PlayCircle className="h-4 w-4" strokeWidth={2} />
                  Ouvrir la rencontre
                </button>
              ) : null}
            </div>
          </div>

          {/* Ruban d'état */}
          <div className="relative z-10 mt-6 grid gap-2.5 border-t border-white/10 pt-5 sm:grid-cols-3">
            <Statut
              icone={CalendarDays}
              titre="Prochaine rencontre"
              valeur={`${JOURS[group.meeting.weekday]} ${prochaine.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              })} · ${group.meeting.time}`}
            />
            <Statut
              icone={CheckCircle2}
              titre="Fiche préparée par"
              valeur={`${prets} membre${prets > 1 ? 's' : ''} sur ${actifs.length}`}
            />
            <Statut
              icone={Flame}
              titre="Progression du groupe"
              valeur={`${group.closedSteps.length} fiche${
                group.closedSteps.length > 1 ? 's' : ''
              } partagée${group.closedSteps.length > 1 ? 's' : ''} sur 20`}
            />
          </div>
        </header>

        {/* Salle d'attente */}
        {gate.state === 'en_attente' && (
          <div className="mb-8 flex items-start gap-3.5 rounded-3xl border border-or-300 bg-or-50 p-5">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-or-600" strokeWidth={1.75} />
            <div>
              <p className="font-serif text-sm font-bold text-encre-950">
                Votre place est en cours de confirmation
              </p>
              <p className="mt-1 text-xs leading-relaxed text-encre-600">
                Vous voyez l&apos;espace du groupe, mais les fiches ne s&apos;ouvriront qu&apos;une
                fois {group.leaderName} votre demande validée.
                {group.demo && ' Ce groupe est un exemple : la réponse arrive automatiquement.'}
              </p>
            </div>
          </div>
        )}

        {/* Demandes en attente (animateur) */}
        {isLeader && enAttente.length > 0 && (
          <div className="mb-8 rounded-3xl border border-or-300 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-encre-950">
              <UserPlus className="h-5 w-5 text-or-600" strokeWidth={1.75} />
              {enAttente.length} personne{enAttente.length > 1 ? 's' : ''} frappe
              {enAttente.length > 1 ? 'nt' : ''} à la porte
            </h2>
            <div className="mt-4 space-y-3">
              {enAttente.map((demande) => (
                <div
                  key={demande.uid}
                  className="rounded-2xl border border-parchemin-300 bg-parchemin-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-sm font-bold text-encre-950">
                        {demande.displayName}
                      </p>
                      <p className="mt-0.5 text-2xs text-encre-400">
                        {demande.email}
                        {demande.distanceKm !== undefined && ` · à ~${demande.distanceKm} km`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={async () => {
                          await approveMember(group.id, demande.uid);
                          await refresh();
                        }}
                        disabled={actifs.length >= group.capacity}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" /> Accueillir
                      </button>
                      <button
                        onClick={async () => {
                          await rejectMember(group.id, demande.uid);
                          await refresh();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-parchemin-200 px-3.5 py-2 text-2xs font-bold text-encre-600 transition-colors hover:bg-parchemin-300"
                      >
                        <X className="h-3.5 w-3.5" /> Décliner
                      </button>
                    </div>
                  </div>
                  {demande.requestMessage && (
                    <p className="mt-3 border-l-2 border-or-300 pl-3 text-xs italic leading-relaxed text-encre-600">
                      {demande.requestMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {actifs.length >= group.capacity && (
              <p className="mt-3 rounded-xl bg-parchemin-100 px-3.5 py-2.5 text-2xs leading-relaxed text-encre-500">
                Le groupe a atteint sa taille maximale ({group.capacity}). Augmentez la capacité ou
                proposez à ces personnes d&apos;ouvrir un second groupe.
              </p>
            )}
          </div>
        )}

        {/* ══ Onglets ══ */}
        <div className="mb-8 flex gap-1.5 overflow-x-auto border-b border-parchemin-300 pb-px">
          {ONGLETS.filter((tab) => tab.id !== 'guide' || isLeader).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-2xs font-bold transition-colors ${
                onglet === tab.id
                  ? 'border-or-500 text-or-700'
                  : 'border-transparent text-encre-400 hover:text-encre-700'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </div>

        {onglet === 'rencontre' && (
          <OngletRencontre
            enRencontre={enRencontre}
            onDeclarer={declarerPresence}
            monMode={session?.attendance[user.uid] ?? membership?.nextAttendance}
          />
        )}

        {onglet === 'membres' && (
          <OngletMembres
            onInviter={() => setInviteOuvert((open) => !open)}
            inviteOuvert={inviteOuvert}
          />
        )}

        {(onglet === 'priere' || onglet === 'partages' || onglet === 'pepites') && (
          <OngletMur
            kind={onglet === 'priere' ? 'priere' : onglet === 'partages' ? 'partage' : 'pepite'}
            posts={posts}
            onChange={chargerPosts}
          />
        )}

        {onglet === 'guide' && <OngletGuide />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Statut({
  icone: Icone,
  titre,
  valeur,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titre: string;
  valeur: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-parchemin-100/45">
        <Icone className="h-3 w-3" strokeWidth={2} />
        {titre}
      </span>
      <p className="mt-1 text-xs font-semibold text-parchemin-100">{valeur}</p>
    </div>
  );
}

// ══ Onglet : la rencontre ══════════════════════════════════════

function OngletRencontre({
  enRencontre,
  onDeclarer,
  monMode,
}: {
  enRencontre: boolean;
  onDeclarer: (mode: AttendanceMode) => Promise<void>;
  monMode?: AttendanceMode;
}) {
  const { group, members, session, isLeader } = useParcours();
  if (!group) return null;

  const actifs = members.filter((m) => m.status === 'actif');
  const fiche = FICHES_META.find((f) => f.id === group.currentStep);
  const presentiel = actifs.filter(
    (m) => (session?.attendance[m.uid] ?? m.nextAttendance) === 'presentiel'
  );
  const enLigne = actifs.filter(
    (m) => (session?.attendance[m.uid] ?? m.nextAttendance) === 'ligne'
  );
  const absents = actifs.filter(
    (m) => (session?.attendance[m.uid] ?? m.nextAttendance) === 'absent'
  );
  const sansReponse = actifs.length - presentiel.length - enLigne.length - absents.length;

  const options: { value: AttendanceMode; label: string; icon: typeof MapPin; hint: string }[] = [
    { value: 'presentiel', label: 'Je viens sur place', icon: MapPin, hint: group.meeting.venue || 'Au lieu habituel' },
    { value: 'ligne', label: 'Je me connecte', icon: Monitor, hint: 'En visio, depuis chez moi' },
    { value: 'absent', label: 'Je ne peux pas', icon: X, hint: 'Le groupe pourra prier pour vous' },
  ];

  const disponibles =
    group.meeting.mode === 'presentiel'
      ? options.filter((o) => o.value !== 'ligne')
      : group.meeting.mode === 'ligne'
        ? options.filter((o) => o.value !== 'presentiel')
        : options;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {enRencontre && (
          <Link
            href="/groupes/rencontre"
            className="nuit block overflow-hidden rounded-3xl p-6 text-parchemin-100 transition-transform hover:-translate-y-0.5"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-or-400/15 px-3 py-1 text-2xs font-bold uppercase tracking-[0.16em] text-or-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-or-300 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-or-300" />
              </span>
              La rencontre est ouverte
            </span>
            <h3 className="mt-3 font-serif text-xl font-bold">
              Rejoignez le groupe, où que vous soyez
            </h3>
            <p className="mt-1.5 text-xs text-parchemin-100/70">
              Le déroulé avance en direct pour tout le monde — sur place comme en visio.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-2xs font-bold text-or-200">
              Entrer dans la rencontre <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}

        {/* Fiche en préparation */}
        <div className="rounded-3xl border border-parchemin-400 bg-white p-6 shadow-sm">
          <span className="text-2xs font-bold uppercase tracking-[0.18em] text-encre-400">
            Ce que chacun prépare chez soi
          </span>
          <h3 className="mt-2 font-serif text-xl font-bold text-encre-950">
            Fiche {group.currentStep} — {fiche?.titre}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-encre-600">{fiche?.sousTitre}</p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={`/fiches/${group.currentStep}`}
              className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
            >
              <BookOpen className="h-4 w-4" strokeWidth={2} />
              Travailler la fiche
            </Link>
            <Link
              href={`/fiches/${group.currentStep}#resume`}
              className="inline-flex items-center gap-2 rounded-full bg-parchemin-100 px-5 py-2.5 text-xs font-bold text-encre-700 transition-colors hover:bg-parchemin-200"
            >
              Résumé et partage
            </Link>
          </div>

          <div className="mt-5 border-t border-parchemin-300 pt-4">
            <p className="mb-2.5 text-2xs font-bold uppercase tracking-[0.14em] text-encre-400">
              Qui a préparé la fiche
            </p>
            <div className="flex flex-wrap gap-2">
              {actifs.map((membre) => {
                const pret = membre.preparedSteps.includes(group.currentStep);
                return (
                  <span
                    key={membre.uid}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-semibold ${
                      pret
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-parchemin-100 text-encre-400'
                    }`}
                  >
                    {pret ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {membre.displayName}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Présence */}
        <div className="rounded-3xl border border-parchemin-400 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-encre-950">
            Comment serez-vous là, cette fois ?
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-encre-500">
            {group.meeting.mode === 'hybride'
              ? 'Ceux qui peuvent se déplacent, les autres se connectent. La rencontre est la même.'
              : group.meeting.mode === 'ligne'
                ? 'Ce groupe se retrouve en visio.'
                : 'Ce groupe se retrouve sur place.'}
          </p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {disponibles.map((option) => (
              <button
                key={option.value}
                onClick={() => void onDeclarer(option.value)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  monMode === option.value
                    ? 'border-or-400 bg-or-50 ring-2 ring-or-200'
                    : 'border-parchemin-300 bg-parchemin-50 hover:border-parchemin-500'
                }`}
              >
                <option.icon
                  className={`h-4 w-4 ${monMode === option.value ? 'text-or-600' : 'text-encre-400'}`}
                  strokeWidth={2}
                />
                <p
                  className={`mt-2 text-xs font-bold ${
                    monMode === option.value ? 'text-or-700' : 'text-encre-800'
                  }`}
                >
                  {option.label}
                </p>
                <p className="mt-0.5 text-2xs leading-snug text-encre-400">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne latérale */}
      <div className="space-y-5">
        <div className="rounded-3xl border border-parchemin-400 bg-white p-5 shadow-sm">
          <h4 className="font-serif text-sm font-bold text-encre-950">Présences annoncées</h4>
          <dl className="mt-3 space-y-2.5 text-2xs">
            <Ligne label="Sur place" valeur={presentiel.length} couleur="text-emerald-600" />
            <Ligne label="En visio" valeur={enLigne.length} couleur="text-sky-600" />
            <Ligne label="Absents" valeur={absents.length} couleur="text-encre-400" />
            <Ligne label="Sans réponse" valeur={sansReponse} couleur="text-or-600" />
          </dl>
        </div>

        {group.meeting.venue && (
          <div className="rounded-3xl border border-parchemin-400 bg-white p-5 shadow-sm">
            <h4 className="flex items-center gap-1.5 font-serif text-sm font-bold text-encre-950">
              <MapPin className="h-4 w-4 text-or-600" /> Le lieu
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-encre-600">{group.meeting.venue}</p>
            <p className="mt-2 text-2xs text-encre-400">
              Visible uniquement des membres du groupe.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-or-200 bg-or-50 p-5">
          <h4 className="flex items-center gap-1.5 font-serif text-sm font-bold text-or-800">
            <Info className="h-4 w-4" /> Le rythme du livret
          </h4>
          <p className="mt-2 text-2xs leading-relaxed text-or-900/80">
            Une fiche par rencontre. La fiche suivante ne s&apos;ouvre qu&apos;une fois celle-ci
            partagée{isLeader ? ' — c’est vous qui clôturez la rencontre.' : ' par le groupe.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Ligne({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-encre-500">{label}</dt>
      <dd className={`font-bold ${couleur}`}>{valeur}</dd>
    </div>
  );
}

// ══ Onglet : les membres ═══════════════════════════════════════

function OngletMembres({
  onInviter,
  inviteOuvert,
}: {
  onInviter: () => void;
  inviteOuvert: boolean;
}) {
  const { user } = useAuth();
  const { group, members, isLeader } = useParcours();
  if (!group || !user) return null;

  const actifs = members.filter((m) => m.status === 'actif');
  const places = group.capacity - actifs.length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-parchemin-400 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-encre-950">
            <Users className="h-5 w-5 text-or-600" strokeWidth={1.75} />
            {actifs.length} membre{actifs.length > 1 ? 's' : ''}
            <span className="text-sm font-normal text-encre-400">/ {group.capacity}</span>
          </h3>
          {places > 0 && (
            <button
              onClick={onInviter}
              className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-800"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {inviteOuvert ? 'Masquer les invitations' : `Inviter (${places} place${places > 1 ? 's' : ''})`}
            </button>
          )}
        </div>

        <ul className="mt-4 divide-y divide-parchemin-300">
          {actifs.map((membre) => (
            <li key={membre.uid} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-or-300 to-or-500 text-xs font-bold text-encre-950">
                  {membre.displayName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold text-encre-900">
                    {membre.displayName}
                    {membre.uid === user.uid && (
                      <span className="text-2xs font-normal text-encre-300">(vous)</span>
                    )}
                    {membre.role === 'animateur' && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-or-500" />
                    )}
                  </p>
                  <p className="text-2xs text-encre-400">
                    {membre.role === 'animateur'
                      ? 'Animateur'
                      : membre.role === 'co_animateur'
                        ? 'Co-animateur'
                        : 'Membre'}
                    {' · '}
                    {membre.preparedSteps.length} fiche
                    {membre.preparedSteps.length > 1 ? 's' : ''} préparée
                    {membre.preparedSteps.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold ${
                  membre.preparedSteps.includes(group.currentStep)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-or-50 text-or-700'
                }`}
              >
                {membre.preparedSteps.includes(group.currentStep) ? 'Prêt' : 'En cours'}
              </span>
            </li>
          ))}

          {Array.from({ length: Math.max(0, places) }).map((_, index) => (
            <li key={`libre-${index}`} className="flex items-center gap-3 py-3.5 opacity-50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-dashed border-parchemin-500 text-encre-300">
                <UserPlus className="h-4 w-4" />
              </span>
              <p className="text-xs italic text-encre-400">Place libre</p>
            </li>
          ))}
        </ul>
      </div>

      {inviteOuvert && (
        <InvitePanel
          group={group}
          inviter={{ uid: user.uid, displayName: user.displayName || 'Un membre' }}
          tone="clair"
        />
      )}

      {!isLeader && (
        <p className="rounded-2xl bg-parchemin-200/60 px-4 py-3 text-2xs leading-relaxed text-encre-500">
          Tout membre peut inviter : le groupe grandit par les relations, pas par un annuaire.
        </p>
      )}
    </div>
  );
}

// ══ Onglet : mur (prière / partages / pépites) ═════════════════

const MUR_CONFIG: Record<
  GroupPostKind,
  { titre: string; intro: string; placeholder: string; bouton: string; icone: typeof Heart }
> = {
  priere: {
    titre: 'Déposer un sujet de prière',
    intro: 'Ce que vous confiez ici reste dans le groupe.',
    placeholder: 'Ce pour quoi vous avez besoin d’être porté cette semaine…',
    bouton: 'Déposer sur le mur',
    icone: Heart,
  },
  partage: {
    titre: 'Partager une réflexion sur la fiche',
    intro: 'Ce qui vous a arrêté, ce que vous n’avez pas compris, ce qui vous a remué.',
    placeholder: 'Ce qui m’a marqué dans cette fiche…',
    bouton: 'Envoyer au groupe',
    icone: MessageSquare,
  },
  pepite: {
    titre: 'Noter une pépite',
    intro: 'Un verset, une phrase, une lumière reçue. Le groupe en vit aussi.',
    placeholder: 'La pépite du jour…',
    bouton: 'Ajouter la pépite',
    icone: Star,
  },
  annonce: {
    titre: 'Annonce',
    intro: '',
    placeholder: '',
    bouton: 'Publier',
    icone: Bookmark,
  },
  louange: {
    titre: 'Action de grâce',
    intro: '',
    placeholder: '',
    bouton: 'Publier',
    icone: Heart,
  },
};

function OngletMur({
  kind,
  posts,
  onChange,
}: {
  kind: GroupPostKind;
  posts: GroupPost[];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const { group } = useParcours();
  const [texte, setTexte] = useState('');
  const [reference, setReference] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (!group || !user) return null;
  const config = MUR_CONFIG[kind];
  const liste = posts.filter((post) => post.kind === kind);

  const publier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!texte.trim()) return;
    setEnvoi(true);
    await addPost({
      groupId: group.id,
      authorId: user.uid,
      authorName: user.displayName || 'Un membre',
      kind,
      content: texte,
      step: group.currentStep,
      reference: kind === 'pepite' ? reference.trim() || undefined : undefined,
    });
    setTexte('');
    setReference('');
    setEnvoi(false);
    onChange();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={publier} className="feuille relative rounded-3xl border border-parchemin-400 p-6 shadow-md">
        <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-encre-950">
          <config.icone className="h-5 w-5 text-or-600" strokeWidth={1.75} />
          {config.titre}
        </h3>
        <p className="mt-1 text-2xs text-encre-500">{config.intro}</p>

        {kind === 'pepite' && (
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Référence (facultatif) — ex : Ep 2:8"
            className="manuscrit mt-3.5 w-full rounded-xl border border-parchemin-400 bg-parchemin-50 px-3.5 py-2.5 text-base text-encre-900 outline-none focus:border-or-400"
          />
        )}

        <textarea
          value={texte}
          onChange={(event) => setTexte(event.target.value)}
          placeholder={config.placeholder}
          rows={3}
          className="manuscrit mt-3 w-full resize-none rounded-2xl border border-parchemin-400 bg-parchemin-50 px-4 py-3 text-base leading-relaxed text-encre-950 outline-none placeholder:font-sans placeholder:text-xs placeholder:text-encre-300 focus:border-or-400"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={envoi || !texte.trim()}
            className="bouton-or rounded-full px-5 py-2.5 text-2xs font-bold disabled:opacity-40"
          >
            {config.bouton}
          </button>
        </div>
      </form>

      {liste.length === 0 ? (
        <div className="feuille rounded-3xl border border-dashed border-parchemin-400 py-14 text-center">
          <config.icone className="mx-auto h-8 w-8 text-encre-300" strokeWidth={1.5} />
          <p className="mt-3 font-serif text-sm font-bold text-encre-800">Rien encore ici</p>
          <p className="mt-1 text-2xs text-encre-500">
            Le premier message donne souvent le ton pour tout le groupe.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liste.map((post, idx) => (
            <CartePost key={post.id} post={post} kind={kind} index={idx} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function CartePost({
  post,
  kind,
  index = 0,
  onChange,
}: {
  post: GroupPost;
  kind: GroupPostKind;
  index?: number;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const { group } = useParcours();
  if (!group || !user) return null;

  const aPrie = post.prayedBy.includes(user.uid);
  const aAmen = post.amenBy.includes(user.uid);
  const quand = new Date(post.createdAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];
  const pose = poses[index % poses.length];

  const stylePapier =
    kind === 'priere'
      ? `postit-rose ${pose} border border-rose-200/80 shadow-md`
      : kind === 'pepite'
        ? `postit-vert ${pose} border border-emerald-200/80 shadow-md`
        : `feuille ${pose} border border-parchemin-300 shadow-sm`;

  return (
    <article className={`relative rounded-3xl p-5 transition-all hover:shadow-lg ${stylePapier}`}>
      {kind === 'priere' ? (
        <span className="punaise punaise-rouge -top-2.5 left-6" />
      ) : kind === 'pepite' ? (
        <span className="ruban -top-2.5 left-6 -rotate-1 rounded-[2px]" />
      ) : (
        <span className="trombone -top-3 right-6" />
      )}

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-serif text-sm font-bold text-encre-950">
            {post.authorName}
            {post.step && (
              <span className="timbre rounded px-2 py-0.5 text-2xs font-bold text-or-800">
                Fiche {post.step}
              </span>
            )}
          </p>
          <p className="text-2xs text-encre-400">{quand}</p>
        </div>
        {post.answered && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-2xs font-bold text-emerald-800 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5" /> Exaucée
          </span>
        )}
      </div>

      {post.reference && (
        <p className="manuscrit mt-2 text-base font-bold text-or-800">{post.reference}</p>
      )}

      <p className="manuscrit mt-2 text-lg leading-relaxed text-encre-950 whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-parchemin-300 pt-3.5">
        <div className="flex flex-wrap gap-2">
          {kind === 'priere' ? (
            <button
              onClick={async () => {
                await togglePrayed(group.id, post.id, user.uid);
                onChange();
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-2xs font-bold transition-colors ${
                aPrie
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-parchemin-100 text-encre-500 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${aPrie ? 'fill-rose-500 text-rose-500' : ''}`} />
              J&apos;ai prié
              {post.prayedBy.length > 0 && ` (${post.prayedBy.length})`}
            </button>
          ) : (
            <button
              onClick={async () => {
                await toggleAmen(group.id, post.id, user.uid);
                onChange();
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-2xs font-bold transition-colors ${
                aAmen
                  ? 'bg-or-100 text-or-700'
                  : 'bg-parchemin-100 text-encre-500 hover:bg-or-50 hover:text-or-700'
              }`}
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              Amen{post.amenBy.length > 0 && ` (${post.amenBy.length})`}
            </button>
          )}

          {kind === 'priere' && post.authorId === user.uid && (
            <button
              onClick={async () => {
                await markPrayerAnswered(group.id, post.id, !post.answered);
                onChange();
              }}
              className="rounded-full px-3 py-1.5 text-2xs font-medium text-encre-400 transition-colors hover:text-emerald-600"
            >
              {post.answered ? 'Remettre en cours' : 'Marquer comme exaucée'}
            </button>
          )}
        </div>

        {post.authorId === user.uid && (
          <button
            onClick={async () => {
              await deletePost(group.id, post.id);
              onChange();
            }}
            className="text-2xs text-encre-300 transition-colors hover:text-rose-500"
          >
            Supprimer
          </button>
        )}
      </div>
    </article>
  );
}

// ══ Onglet : guide de l'animateur ══════════════════════════════

function OngletGuide() {
  const { group } = useParcours();
  const [secondes, setSecondes] = useState(180);
  const [tourne, setTourne] = useState(false);

  useEffect(() => {
    if (!tourne || secondes === 0) return;
    const timer = window.setTimeout(() => {
      setSecondes((value) => Math.max(0, value - 1));
      if (secondes === 1) setTourne(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [tourne, secondes]);

  const etape = group?.currentStep ?? 1;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4 rounded-3xl border border-parchemin-400 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-encre-950">
          <ShieldCheck className="h-5 w-5 text-or-600" strokeWidth={1.75} />
          Animer sans enseigner
        </h3>

        <div className="space-y-3 text-xs leading-relaxed text-encre-700">
          <div className="rounded-2xl border border-or-200 bg-or-50 p-4">
            <strong className="mb-1 block text-or-800">Vous facilitez, vous n&apos;exposez pas</strong>
            Chacun a déjà travaillé la fiche chez lui. Votre travail est de faire circuler la
            parole, de préciser les points restés flous, et de veiller à ce que personne
            n&apos;accapare le temps. (p. 3)
          </div>

          <div className="rounded-2xl border border-encre-200 bg-encre-50 p-4">
            <strong className="mb-1 block text-encre-800">Les temps de prière ciblés</strong>
            À l&apos;issue des <strong>fiches 7 et 8</strong>, proposez à chacun un temps personnel
            de prière : blessures, liens, non-pardons, forteresses. À la <strong>fiche 10</strong>,
            priez pour chaque personne individuellement, pour qu&apos;elle soit remplie et
            renouvelée du Saint-Esprit. (p. 4, annexes p. 160-162)
            {(etape === 7 || etape === 8 || etape === 10) && (
              <span className="mt-2 block rounded-lg bg-or-100 px-2.5 py-1.5 font-bold text-or-800">
                C&apos;est le cas cette semaine : prévoyez ce temps à part.
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-parchemin-400 bg-parchemin-50 p-4">
            <strong className="mb-1 block text-encre-900">Le climat</strong>
            Pas de jugement d&apos;un côté, pas de susceptibilité de l&apos;autre. Chacun doit
            pouvoir parler librement, sans qu&apos;on lui impose un point de vue.
          </div>

          <div className="rounded-2xl border border-parchemin-400 bg-parchemin-50 p-4">
            <strong className="mb-1 block text-encre-900">Faites-vous aider</strong>
            Le livret conseille qu&apos;une seconde personne assiste l&apos;animateur. Nommez un
            co-animateur dans le groupe : il prend le relais quand vous ne pouvez pas.
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-3xl border border-parchemin-400 bg-white p-6 text-center shadow-sm">
        <div>
          <h3 className="flex items-center justify-center gap-2 font-serif text-xl font-bold text-encre-950">
            <Clock className="h-5 w-5 text-or-600" strokeWidth={1.75} />
            Minuteur du tour de parole
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-2xs leading-relaxed text-encre-500">
            Un temps égal pour chacun évite que les plus à l&apos;aise prennent toute la place.
          </p>

          <div className="my-8 font-mono text-5xl font-bold text-encre-900">
            {Math.floor(secondes / 60)}:{(secondes % 60).toString().padStart(2, '0')}
          </div>

          <div className="mb-6 flex justify-center gap-1.5">
            {[120, 180, 300].map((valeur) => (
              <button
                key={valeur}
                onClick={() => {
                  setTourne(false);
                  setSecondes(valeur);
                }}
                className={`rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
                  secondes === valeur
                    ? 'bg-or-100 text-or-700'
                    : 'bg-parchemin-100 text-encre-500 hover:bg-parchemin-200'
                }`}
              >
                {valeur / 60} min
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setTourne((value) => !value)}
          className="bouton-or mx-auto inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-bold"
        >
          {tourne ? 'Mettre en pause' : 'Démarrer le tour'}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate allowPending>
      <CelluleContent />
    </ParcoursGate>
  );
}
