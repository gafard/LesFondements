'use client';

import { useRouter } from 'next/navigation';

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
  ClipboardList,
  Star,
  UserPlus,
  Users,
  UserMinus,
  MoreHorizontal,
  LogOut,
  Video,
  X,
  HeartHandshake,
  Printer,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import {
  addPost,
  addReply,
  approveMember,
  leaveGroup,
  deletePost,
  getPosts,
  getSessions,
  markPrayerAnswered,
  nextMeetingDate,
  openMeeting,
  rejectMember,
  removeMember,
  setMemberRole,
  setSessionAttendance,
  subscribe,
  toggleAmen,
  togglePrayed,
  updateGroupSettings,
} from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import BinomesPriere from '@/components/BinomesPriere';
import {
  LONGUEUR_REPONSE,
  REPONSES_MAX,
} from '@/lib/types';
import type {
  AttendanceMode,
  GroupMeetingMode,
  GroupMember,
  GroupPost,
  GroupPostKind,
  GroupRhythm,
  GroupSession,
  ParcoursGroup,
} from '@/lib/types';

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
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [codeCopie, setCodeCopie] = useState(false);
  const [inviteOuvert, setInviteOuvert] = useState(false);
  const [reglagesOuvert, setReglagesOuvert] = useState(false);

  const chargerPosts = useCallback(() => {
    if (!group) return;
    void getPosts(group.id).then(setPosts);
  }, [group]);

  useEffect(() => {
    chargerPosts();
    if (!group) return;
    return subscribe(`posts:${group.id}`, chargerPosts);
  }, [group, chargerPosts]);

  const chargerSessions = useCallback(() => {
    if (!group) return;
    void getSessions(group.id).then(setSessions);
  }, [group]);

  useEffect(() => {
    chargerSessions();
    if (!group) return;
    return subscribe(`sessions:${group.id}`, chargerSessions);
  }, [group, chargerSessions]);

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

              {isLeader && (
                <button
                  onClick={() => setReglagesOuvert(true)}
                  title="Modifier les paramètres de la cellule (nom, date de rencontre, mode, lieu/visio)"
                  className="verre inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/14"
                >
                  <Settings className="h-3.5 w-3.5 text-or-300" />
                  <span>Paramètres</span>
                </button>
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
                actifs.length >= 2 ? (
                  <button
                    onClick={() => void ouvrirRencontre()}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-md"
                  >
                    <PlayCircle className="h-4 w-4" strokeWidth={2} />
                    Ouvrir la rencontre
                  </button>
                ) : (
                  <button
                    onClick={() => void copierCode()}
                    title="Une cellule fraternelle a besoin d'au moins 2 membres pour ouvrir une rencontre"
                    className="verre inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-amber-200 border border-amber-300/30 hover:bg-white/10 transition-colors"
                  >
                    <Users className="h-4 w-4 text-or-400" />
                    {codeCopie ? 'Code d’invitation copié !' : 'Inviter un membre pour ouvrir (1/2)'}
                  </button>
                )
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
            dernierRecap={[...sessions]
              .filter((item) => item.status === 'terminee' && item.recap)
              .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))[0]}
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

      {reglagesOuvert && group && (
        <ModalReglagesCellule
          group={group}
          onFermer={() => setReglagesOuvert(false)}
          onEnregistre={() => {
            setReglagesOuvert(false);
            void refresh();
          }}
        />
      )}
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
  dernierRecap,
}: {
  enRencontre: boolean;
  onDeclarer: (mode: AttendanceMode) => Promise<void>;
  monMode?: AttendanceMode;
  dernierRecap?: GroupSession;
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
        {dernierRecap?.recap && (
          <article className="fiche-bristol relative rounded-3xl border border-parchemin-400 p-6 shadow-md">
            <span className="ruban -top-2.5 left-10 -rotate-2" />
            <div className="flex items-center gap-2 text-2xs font-black uppercase tracking-[0.16em] text-or-700">
              <ClipboardList className="h-4 w-4" />
              Si vous étiez absent · fiche {dernierRecap.step}
            </div>
            <h3 className="manuscrit mt-3 text-2xl font-bold text-encre-950">Ce que la cellule retient</h3>
            <p className="mt-3 text-sm leading-relaxed text-encre-700">{dernierRecap.recap.summary}</p>
            {(dernierRecap.recap.highlights.length > 0 || dernierRecap.recap.prayerFocus.length > 0) && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {dernierRecap.recap.highlights.length > 0 && (
                  <div className="post-it-jaune -rotate-[0.4deg] p-4">
                    <p className="text-2xs font-black uppercase tracking-[0.12em] text-encre-600">Pépites</p>
                    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-encre-800">
                      {dernierRecap.recap.highlights.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}
                {dernierRecap.recap.prayerFocus.length > 0 && (
                  <div className="post-it-rose rotate-[0.5deg] p-4">
                    <p className="text-2xs font-black uppercase tracking-[0.12em] text-encre-600">À porter dans la prière</p>
                    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-encre-800">
                      {dernierRecap.recap.prayerFocus.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {dernierRecap.recap.nextStep && (
              <p className="mt-4 border-l-2 border-or-400 pl-3 text-xs font-semibold text-encre-700">
                Prochain pas : {dernierRecap.recap.nextStep}
              </p>
            )}
          </article>
        )}

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

function genererBinomes(membres: GroupMember[]): GroupMember[][] {
  if (membres.length < 2) return [];
  const paires: GroupMember[][] = [];
  const copie = [...membres];
  while (copie.length > 3) {
    paires.push([copie.shift()!, copie.shift()!]);
  }
  if (copie.length === 3) {
    paires.push(copie);
  } else if (copie.length === 2) {
    paires.push(copie);
  } else if (copie.length === 1 && paires.length > 0) {
    paires[paires.length - 1].push(copie[0]);
  }
  return paires;
}

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

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-2xs font-bold ${
                    membre.preparedSteps.includes(group.currentStep)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-or-50 text-or-700'
                  }`}
                >
                  {membre.preparedSteps.includes(group.currentStep) ? 'Prêt' : 'En cours'}
                </span>
                {isLeader && membre.uid !== user.uid && (
                  <ActionsMembre membre={membre} groupId={group.id} />
                )}
              </div>
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

      {/* ══ Binômes & Trinômes de Prière (Attelage Fraternel) ══ */}
      {actifs.length >= 2 && (
        <div className="rounded-3xl border border-or-300 bg-[#fdfbf7] p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-or-700" />
              <h3 className="font-serif text-lg font-bold text-encre-950">
                Attelage fraternel de la semaine
              </h3>
            </div>
            <Link
              href="/guide-pastoral"
              target="_blank"
              className="text-3xs font-bold text-or-800 hover:underline flex items-center gap-1"
            >
              <Printer className="h-3 w-3" /> Fiche prière (A4)
            </Link>
          </div>

          <p className="text-2xs text-encre-600 leading-relaxed">
            <em>« Le faire en équipe, à 2 ou 3 »</em> (Guide pastoral, p. 160).
            Pour veiller les uns sur les autres et prier en binôme cette semaine :
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            {genererBinomes(actifs).map((groupe, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-parchemin-300 bg-white p-3.5 flex items-center gap-3 shadow-2xs"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-or-100 font-serif font-bold text-xs text-or-900 shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <span className="text-3xs uppercase tracking-wider font-bold text-or-800 block">
                    {groupe.length === 2 ? 'Binôme de prière' : 'Trinôme de prière'}
                  </span>
                  <p className="text-xs font-bold text-encre-950">
                    {groupe.map((m) => m.displayName).join(' & ')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="pt-1 text-3xs text-encre-400 font-serif italic">
            Aucune note personnelle n’est enregistrée. Seuls les prénoms sont reliés pour organiser le soin mutuel en vérité.
          </p>
        </div>
      )}

      {!isLeader && (
        <p className="rounded-2xl bg-parchemin-200/60 px-4 py-3 text-2xs leading-relaxed text-encre-500">
          Tout membre peut inviter : le groupe grandit par les relations, pas par un annuaire.
        </p>
      )}

      <BinomesPriere />

      <QuitterLeGroupe />
    </div>
  );
}

/**
 * Ce que l'animateur peut faire d'un membre : le nommer adjoint, ou le
 * retirer du groupe.
 *
 * Retirer quelqu'un demande une confirmation nommée. C'est délibéré : sur un
 * parcours où l'on se confie, l'exclusion ne doit jamais être le résultat
 * d'un doigt qui glisse.
 */
function ActionsMembre({ membre, groupId }: { membre: GroupMember; groupId: string }) {
  const { refresh } = useParcours();
  const [ouvert, setOuvert] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const adjoint = membre.role === 'co_animateur';

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOuvert((v) => !v);
          setConfirme(false);
        }}
        aria-label={`Gérer ${membre.displayName}`}
        className="grid h-7 w-7 place-items-center rounded-full text-encre-300 transition-colors hover:bg-parchemin-200 hover:text-encre-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-8 z-50 w-60 overflow-hidden rounded-2xl border border-parchemin-400 bg-white p-1 shadow-xl">
            <button
              disabled={occupe}
              onClick={async () => {
                setOccupe(true);
                await setMemberRole(groupId, membre.uid, adjoint ? 'membre' : 'co_animateur');
                await refresh();
                setOccupe(false);
                setOuvert(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-encre-800 transition-colors hover:bg-parchemin-100 disabled:opacity-40"
            >
              <Crown className="h-3.5 w-3.5 text-or-600" />
              {adjoint ? 'Retirer le rôle d’adjoint' : 'Nommer adjoint'}
            </button>

            {!adjoint && (
              <p className="px-3 pb-1.5 pt-0.5 text-3xs leading-relaxed text-encre-400">
                Un adjoint peut clôturer une rencontre à votre place.
              </p>
            )}

            <div className="my-1 border-t border-parchemin-300" />

            {confirme ? (
              <div className="px-3 py-2">
                <p className="text-3xs leading-relaxed text-encre-600">
                  Retirer <strong>{membre.displayName}</strong> du groupe ? Ses écrits personnels
                  lui restent.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={occupe}
                    onClick={async () => {
                      setOccupe(true);
                      await removeMember(groupId, membre.uid);
                      await refresh();
                      setOccupe(false);
                      setOuvert(false);
                    }}
                    className="rounded-full bg-rose-600 px-3 py-1.5 text-3xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-40"
                  >
                    Retirer
                  </button>
                  <button
                    onClick={() => setConfirme(false)}
                    className="rounded-full px-3 py-1.5 text-3xs font-bold text-encre-500 hover:text-encre-800"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirme(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Retirer du groupe
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Partir de soi-même.
 *
 * Deux clics, sans justification ni approbation : la porte de sortie doit
 * être plus large que la trappe. Le seul refus possible est celui d'un
 * animateur unique, qui laisserait le groupe sans personne pour clôturer.
 */
function QuitterLeGroupe() {
  const { user } = useAuth();
  const { group, refresh } = useParcours();
  const router = useRouter();
  const [demande, setDemande] = useState(false);
  const [refus, setRefus] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  if (!group || !user) return null;

  return (
    <div className="rounded-2xl border border-parchemin-400 bg-parchemin-100/60 px-4 py-3.5">
      {refus ? (
        <p className="text-2xs leading-relaxed text-amber-800">{refus}</p>
      ) : demande ? (
        <>
          <p className="text-2xs leading-relaxed text-encre-700">
            Quitter <strong>{group.name}</strong> ? Votre journal, vos réponses et vos versets
            restent à vous. Vous pourrez rejoindre un autre groupe.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              disabled={occupe}
              onClick={async () => {
                setOccupe(true);
                const issue = await leaveGroup(group.id, user.uid);
                setOccupe(false);
                if (issue.parti) {
                  await refresh();
                  router.push('/onboarding');
                } else {
                  setRefus(issue.raison);
                }
              }}
              className="rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-800 disabled:opacity-40"
            >
              {occupe ? 'Un instant…' : 'Quitter le groupe'}
            </button>
            <button
              onClick={() => setDemande(false)}
              className="rounded-full px-3 py-2 text-2xs font-bold text-encre-500 hover:text-encre-800"
            >
              Rester
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setDemande(true)}
          className="flex items-center gap-2 text-2xs font-bold text-encre-400 transition-colors hover:text-encre-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          Quitter ce groupe
        </button>
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

      <FilDeReponses post={post} onChange={onChange} />
    </article>
  );
}

/**
 * Les réponses à un message du mur.
 *
 * Brèves par construction — deux cents caractères. Le mur n'est pas un salon :
 * ce qui se dit longuement se dit à la rencontre, où l'on s'entend et où l'on
 * se voit. Ici on porte, on acquiesce, on dit qu'on a compris.
 */
function FilDeReponses({ post, onChange }: { post: GroupPost; onChange: () => void }) {
  const { user } = useAuth();
  const { group } = useParcours();
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [occupe, setOccupe] = useState(false);

  if (!group || !user) return null;

  const reponses = post.replies ?? [];
  const complet = reponses.length >= REPONSES_MAX;
  const restant = LONGUEUR_REPONSE - texte.length;

  const envoyer = async () => {
    const propre = texte.trim();
    if (!propre || occupe) return;
    setOccupe(true);
    await addReply(group.id, post.id, { uid: user.uid, nom: user.displayName || 'Un membre' }, propre);
    setTexte('');
    setOuvert(false);
    setOccupe(false);
    onChange();
  };

  return (
    <div className="border-t border-parchemin-300 px-4 pb-3 pt-2.5 sm:px-5">
      {reponses.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {reponses.map((reponse) => (
            <li key={reponse.id} className="flex gap-2 text-2xs leading-relaxed">
              <span className="shrink-0 font-bold text-encre-700">{reponse.authorName}</span>
              <span className="text-encre-600">{reponse.content}</span>
            </li>
          ))}
        </ul>
      )}

      {complet ? (
        <p className="text-3xs italic text-encre-400">
          Le fil est plein — la suite se dira à la rencontre.
        </p>
      ) : ouvert ? (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <textarea
              autoFocus
              rows={2}
              value={texte}
              maxLength={LONGUEUR_REPONSE}
              onChange={(event) => setTexte(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void envoyer();
                }
                if (event.key === 'Escape') setOuvert(false);
              }}
              placeholder="Quelques mots…"
              className="w-full resize-none rounded-xl border border-parchemin-400 bg-parchemin-100/50 px-3 py-2 text-2xs text-encre-800 outline-none focus:border-or-400"
            />
            <p className="mt-0.5 text-3xs text-encre-300">
              {restant} caractère{restant > 1 ? 's' : ''} — Entrée pour envoyer
            </p>
          </div>
          <button
            onClick={envoyer}
            disabled={!texte.trim() || occupe}
            className="mb-4 shrink-0 rounded-full bg-encre-950 px-3.5 py-1.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-800 disabled:opacity-30"
          >
            Envoyer
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOuvert(true)}
          className="text-2xs font-bold text-encre-400 transition-colors hover:text-encre-800"
        >
          {reponses.length ? 'Répondre' : 'Répondre en quelques mots'}
        </button>
      )}
    </div>
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

          <div className="rounded-2xl border border-or-300 bg-or-100/80 p-4">
            <strong className="mb-1 block text-or-950">Fiche Mémo Pastoral (A4)</strong>
            <p className="text-2xs text-or-900 mb-2.5">
              Le guide complet « Prendre soin les uns des autres » (p. 160-162) prêt à imprimer pour votre Bible.
            </p>
            <Link
              href="/guide-pastoral"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-3.5 py-1.5 text-2xs font-bold text-parchemin-100 shadow-xs hover:bg-encre-800 transition-colors"
            >
              <Printer className="h-3 w-3 text-or-300" />
              Imprimer la fiche prière (A4)
            </Link>
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

function ModalReglagesCellule({
  group,
  onFermer,
  onEnregistre,
}: {
  group: ParcoursGroup;
  onFermer: () => void;
  onEnregistre: () => void;
}) {
  const [nom, setNom] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [weekday, setWeekday] = useState(group.meeting.weekday);
  const [nextMeetingDate, setNextMeetingDate] = useState(
    group.meeting.nextMeetingDate || group.meeting.firstMeetingDate || ''
  );
  const [time, setTime] = useState(group.meeting.time);
  const [rhythm, setRhythm] = useState<GroupRhythm>(group.meeting.rhythm || 'hebdomadaire');
  const [mode, setMode] = useState<GroupMeetingMode>(group.meeting.mode || 'presentiel');
  const [callLink, setCallLink] = useState(group.meeting.callLink || '');
  const [capacity, setCapacity] = useState(group.capacity || 6);
  const [enSauvegarde, setEnSauvegarde] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const onDateChange = (dateStr: string) => {
    setNextMeetingDate(dateStr);
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        setWeekday(d.getDay());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setErreur('Le nom de la cellule est requis.');
      return;
    }
    setEnSauvegarde(true);
    setErreur(null);
    try {
      await updateGroupSettings({
        groupId: group.id,
        name: nom.trim(),
        description: description.trim(),
        capacity: Number(capacity),
        meeting: {
          ...group.meeting,
          weekday: Number(weekday),
          time: time.trim(),
          nextMeetingDate: nextMeetingDate || undefined,
          rhythm,
          mode,
          callLink: callLink.trim() || undefined,
        },
      });
      onEnregistre();
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setEnSauvegarde(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="feuille relative max-w-lg w-full rounded-3xl border-2 border-or-400 bg-[#fffdfa] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <span className="punaise-bois absolute -top-2.5 left-10" />
        <div className="flex items-center justify-between border-b border-parchemin-300 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-or-100 flex items-center justify-center text-or-800 font-bold">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-encre-950">Paramètres de la Cellule</h3>
              <p className="text-3xs text-encre-500 font-serif italic">Réservé à l&apos;animateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            className="rounded-full p-1.5 text-encre-400 hover:bg-parchemin-200 hover:text-encre-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {erreur && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
              Nom de la cellule
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-xl border border-parchemin-300 bg-white px-3.5 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
              Description & Vision fraternelle
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-parchemin-300 bg-white px-3.5 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
                Date de la prochaine séance
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={nextMeetingDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full rounded-xl border border-parchemin-300 bg-white px-3 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
                Heure de rendez-vous
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="20:00"
                className="w-full rounded-xl border border-parchemin-300 bg-white px-3 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
                Fréquence
              </label>
              <select
                value={rhythm}
                onChange={(e) => setRhythm(e.target.value as GroupRhythm)}
                className="w-full rounded-xl border border-parchemin-300 bg-white px-3 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
              >
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="bimensuel">Bimensuelle</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
                Mode de rencontre
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as GroupMeetingMode)}
                className="w-full rounded-xl border border-parchemin-300 bg-white px-3 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
              >
                <option value="presentiel">Sur place (Maison)</option>
                <option value="ligne">En ligne (Visio)</option>
                <option value="hybride">Hybride (Maison + Visio)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
              Lien Visio (Google Meet, Zoom...) ou Adresse
            </label>
            <input
              type="text"
              value={callLink}
              onChange={(e) => setCallLink(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full rounded-xl border border-parchemin-300 bg-white px-3.5 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
            />
            <p className="mt-1 text-3xs text-encre-400 font-serif italic">
              Ce lien sera accessible en un clic par tous les membres le soir de la rencontre.
            </p>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1">
              Capacité maximale (recommandé : 5 à 7 personnes)
            </label>
            <input
              type="number"
              min={2}
              max={15}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-parchemin-300 bg-white px-3.5 py-2.5 text-xs text-encre-950 font-medium focus:border-or-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-parchemin-300 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onFermer}
              className="rounded-full px-4 py-2 text-2xs font-bold text-encre-600 hover:bg-parchemin-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enSauvegarde}
              className="bouton-or rounded-full px-6 py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
            >
              {enSauvegarde ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="attente">
      <CelluleContent />
    </ParcoursGate>
  );
}
