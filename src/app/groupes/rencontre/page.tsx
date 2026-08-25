'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Hand,
  Lock,
  MapPin,
  Mic,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  StickyNote,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import {
  MEETING_FLOW,
  MEETING_FLOW_LENGTH,
  addPost,
  closeMeeting,
  getPosts,
  openMeeting,
  setMeetingStage,
  setSessionAttendance,
  subscribe,
} from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import { chargerFiche, questionsDe } from '@/lib/livret';
import type { AttendanceMode, GroupPost } from '@/lib/types';

function RencontreContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { group, members, session, isLeader, refresh } = useParcours();

  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [pepitesRecap, setPepitesRecap] = useState('');
  const [prieresRecap, setPrieresRecap] = useState('');
  const [prochainPas, setProchainPas] = useState('');
  const [confirmerCloture, setConfirmerCloture] = useState(false);
  const [soucisCloture, setSoucisCloture] = useState<string | null>(null);
  const [cloture, setCloture] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [questions, setQuestions] = useState<{ id: string; texte: string }[]>([]);

  const chargerPosts = useCallback(() => {
    if (!group) return;
    void getPosts(group.id).then(setPosts);
  }, [group]);

  useEffect(() => {
    chargerPosts();
    if (!group) return;
    return subscribe(`posts:${group.id}`, chargerPosts);
  }, [group, chargerPosts]);

  // Les questions de partage de la fiche, telles qu'elles sont dans le livret.
  useEffect(() => {
    if (!group) return;
    void chargerFiche(group.currentStep).then((contenu) =>
      setQuestions(contenu ? questionsDe(contenu) : [])
    );
  }, [group]);

  const actifs = useMemo(() => members.filter((m) => m.status === 'actif'), [members]);

  if (!group || !user) return null;

  const fiche = FICHES_META.find((f) => f.id === group.currentStep);
  const stage = session?.liveStage ?? 0;
  const etape = MEETING_FLOW[Math.min(stage, MEETING_FLOW_LENGTH - 1)];
  const ouverte = session?.status === 'ouverte';

  // Ce qu'une personne a déclaré pour la rencontre, sinon son intention
  // annoncée en amont, sinon le mode par défaut du groupe.
  const presence = (uid: string): AttendanceMode =>
    session?.attendance[uid] ??
    actifs.find((m) => m.uid === uid)?.nextAttendance ??
    (group.meeting.mode === 'ligne' ? 'ligne' : 'presentiel');

  const surPlace = actifs.filter((m) => presence(m.uid) === 'presentiel');
  const enLigne = actifs.filter((m) => presence(m.uid) === 'ligne');

  const monMode = presence(user.uid);

  const questionCourante = questions[Math.min(questionIndex, Math.max(0, questions.length - 1))];
  const surLaSellette = actifs.find((m) => m.uid === session?.speakingUid) ?? null;

  const avancer = async (delta: number) => {
    await setMeetingStage(group.id, stage + delta);
    await refresh();
  };

  const donnerLaParole = async (uid: string | null) => {
    await setMeetingStage(group.id, stage, uid);
    await refresh();
  };

  const terminer = async () => {
    const suivants = group.currentStep + 1;
    const lignes = (texte: string) =>
      texte
        .split(/\n|;/)
        .map((ligne) => ligne.trim())
        .filter(Boolean);
    const resume = notes.trim();
    setSoucisCloture(null);
    try {
      await closeMeeting(group.id, user.uid, {
      notes: resume || undefined,
      prayerFocus: lignes(prieresRecap),
      recap: resume
        ? {
            summary: resume,
            highlights: lignes(pepitesRecap),
            prayerFocus: lignes(prieresRecap),
            nextStep: prochainPas.trim() || undefined,
            createdAt: Date.now(),
          }
        : undefined,
    });
      await refresh();
      setCloture(true);
      setConfirmerCloture(false);
    } catch (erreur) {
      // L'erreur était avalée : rien ne se passait, sans un mot.
      setSoucisCloture(
        erreur instanceof Error ? erreur.message : 'La rencontre n’a pas pu être clôturée.'
      );
      setConfirmerCloture(false);
    }
    void suivants;
  };

  const publier = async (kind: 'partage' | 'priere') => {
    if (!saisie.trim()) return;
    await addPost({
      groupId: group.id,
      authorId: user.uid,
      authorName: user.displayName || 'Un membre',
      kind,
      content: saisie,
      step: group.currentStep,
      questionId: kind === 'partage' ? questionCourante?.id : undefined,
    });
    setSaisie('');
    chargerPosts();
  };

  // ── Écran de clôture ────────────────────────────────────────
  if (cloture) {
    const termine = group.currentStep >= 20;
    return (
      <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28">
        <span className="vitrail left-[-6rem] top-[-4rem] h-80 w-80 bg-or-400/14 animate-souffle" />
        <div className="animate-reveal relative z-10 max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
            <Flame className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-parchemin-100 sm:text-4xl">
            {termine ? (
              <>
                Vous avez achevé <span className="titre-or">les vingt fiches.</span>
              </>
            ) : (
              <>
                La fiche est <span className="titre-or">refermée.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/70">
            {termine
              ? 'Cinq mois de chemin, ensemble. Prenez le temps de relire ce que chacun espérait au début.'
              : `La fiche ${group.currentStep} vient de s'ouvrir pour tout le groupe. Chacun la prépare chez lui d'ici la prochaine rencontre.`}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={termine ? '/certificat' : `/fiches/${group.currentStep}`}
              className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
            >
              {termine ? 'Voir mon attestation' : `Ouvrir la fiche ${group.currentStep}`}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/groupes"
              className="rounded-full bg-white/10 px-6 py-3.5 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
            >
              Retour à la cellule
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Rencontre pas encore ouverte ────────────────────────────
  if (!ouverte) {
    return (
      <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28">
        <span className="vitrail left-[-6rem] top-[-4rem] h-80 w-80 bg-or-400/12 animate-souffle" />
        <div className="animate-reveal relative z-10 max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/8 text-parchemin-100/60">
            <Clock className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-parchemin-100">
            La rencontre n&apos;est pas encore ouverte
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/70">
            {isLeader
              ? actifs.length < 2
                ? 'Une cellule exige au moins 2 personnes pour ouvrir sa rencontre fraternelle. Partagez votre code d’invitation pour accueillir un frère ou une sœur.'
                : 'Ouvrez-la quand le groupe est prêt : le déroulé se synchronisera pour tout le monde, sur place comme en visio.'
              : `${group.leaderName} ouvrira la rencontre au moment venu. Vous serez au même endroit du déroulé que les autres.`}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isLeader && (
              actifs.length >= 2 ? (
                <button
                  onClick={async () => {
                    await openMeeting(group.id, user.uid);
                    await refresh();
                  }}
                  className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
                >
                  <Play className="h-4 w-4" strokeWidth={2.5} />
                  Ouvrir la rencontre
                </button>
              ) : (
                <button
                  onClick={() => router.push('/groupes')}
                  className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg"
                >
                  <Users className="h-4 w-4" />
                  Inviter un membre ({actifs.length}/2 min)
                </button>
              )
            )}
            <button
              onClick={() => router.push('/groupes')}
              className="rounded-full bg-white/10 px-6 py-3.5 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
            >
              Retour à la cellule
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Rencontre en cours ──────────────────────────────────────
  return (
    <div className="nuit nuit-grain relative min-h-screen overflow-hidden pb-16 pt-20">
      
      {/* Background Illustrated Warm Fellowship */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/warm-fellowship.jpg"
          alt="Rencontre fraternelle chaleureuse"
          fill
          sizes="100vw"
          priority
          className="object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07162b]/95 via-[#07162b]/85 to-[#07162b]/95" />
      </div>

      <span className="vitrail right-[-10rem] top-[-6rem] h-96 w-96 bg-or-400/10 animate-souffle relative z-1" />
      <span className="vitrail bottom-[-12rem] left-[-8rem] h-[26rem] w-[26rem] bg-encre-400/22 relative z-1" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Bandeau ── */}
        <div className="verre flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-2xs font-bold uppercase tracking-[0.16em] text-rose-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
              </span>
              Rencontre en cours
            </span>
            <h1 className="mt-2 truncate font-serif text-xl font-bold text-parchemin-100 sm:text-2xl">
              Fiche {group.currentStep} — {fiche?.titre}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {group.meeting.callLink && (
              <a
                href={group.meeting.callLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
              >
                <Video className="h-3.5 w-3.5 text-or-300" />
                Ouvrir la visio
              </a>
            )}
            <Link
              href="/groupes"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quitter
            </Link>
          </div>
        </div>

        {/* ── Fil du déroulé ── */}
        <div className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
          {MEETING_FLOW.map((item, index) => (
            <button
              key={item.key}
              onClick={() => isLeader && void setMeetingStage(group.id, index).then(refresh)}
              disabled={!isLeader}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-2xs font-bold transition-all ${
                index === stage
                  ? 'bg-or-400 text-encre-950'
                  : index < stage
                    ? 'bg-white/12 text-parchemin-100/70'
                    : 'bg-white/[0.06] text-parchemin-100/35'
              } ${isLeader ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {index < stage ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-black/15 text-[9px]">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{item.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* ══ Scène principale ══ */}
          <div className="space-y-5 lg:col-span-2">
            <section className="verre animate-reveal rounded-4xl p-6 sm:p-8">
              <span className="text-2xs font-bold uppercase tracking-[0.2em] text-or-300/80">
                Étape {stage + 1} sur {MEETING_FLOW_LENGTH} · environ {etape.minutes} min
              </span>
              <h2 className="mt-2.5 font-serif text-2xl font-bold text-parchemin-100 sm:text-3xl">
                {etape.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-parchemin-100/70">{etape.hint}</p>

              {/* Contenu selon l'étape */}
              {etape.key === 'accueil' && (
                <div className="encadre-nuit mt-6 text-sm leading-relaxed">
                  « Approchez-vous de Dieu, et il s&apos;approchera de vous. »
                  <span className="mt-1.5 block text-2xs not-italic text-or-200/60">Jacques 4:8</span>
                </div>
              )}

              {etape.key === 'partage' && (
                <div className="mt-6">
                  <TourDeParole
                    membres={actifs.map((m) => ({
                      uid: m.uid,
                      nom: m.displayName,
                      present: presence(m.uid) !== 'absent',
                    }))}
                    actuel={session?.speakingUid ?? null}
                    peutDonner={isLeader}
                    onDonner={donnerLaParole}
                  />
                </div>
              )}

              {etape.key === 'questions' && questions.length > 0 && (
                <div className="mt-6">
                  <div className="rounded-3xl border border-or-300/25 bg-or-400/8 p-5">
                    <span className="text-2xs font-bold uppercase tracking-[0.16em] text-or-300/80">
                      Question {questionIndex + 1} sur {questions.length}
                    </span>
                    <p className="mt-2.5 font-serif text-lg leading-relaxed text-parchemin-100">
                      {questionCourante?.texte}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                      disabled={questionIndex === 0}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-2xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/14 disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Précédente
                    </button>
                    <button
                      onClick={() =>
                        setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
                      }
                      disabled={questionIndex >= questions.length - 1}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-2xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/14 disabled:opacity-30"
                    >
                      Suivante <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <textarea
                      value={saisie}
                      onChange={(event) => setSaisie(event.target.value)}
                      rows={3}
                      placeholder="Garder une trace de ce qui vient d’être dit, pour le groupe…"
                      className="verre w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => void publier('partage')}
                        disabled={!saisie.trim()}
                        className="rounded-full bg-or-400/20 px-4 py-2 text-2xs font-bold text-or-200 transition-colors hover:bg-or-400 hover:text-encre-950 disabled:opacity-30"
                      >
                        Ajouter au mur du groupe
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {etape.key === 'application' && (
                <div className="mt-6">
                  <div className="encadre-nuit text-sm leading-relaxed">
                    « Un pas, un seul, mais précis, daté, et que quelqu&apos;un connaît. »
                  </div>
                  <textarea
                    value={saisie}
                    onChange={(event) => setSaisie(event.target.value)}
                    rows={3}
                    placeholder="Mon pas concret pour la semaine…"
                    className="verre mt-4 w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => void publier('partage')}
                      disabled={!saisie.trim()}
                      className="rounded-full bg-or-400/20 px-4 py-2 text-2xs font-bold text-or-200 transition-colors hover:bg-or-400 hover:text-encre-950 disabled:opacity-30"
                    >
                      Le confier au groupe
                    </button>
                  </div>
                </div>
              )}

              {etape.key === 'priere' && (
                <div className="mt-6 space-y-3">
                  {(group.currentStep === 7 ||
                    group.currentStep === 8 ||
                    group.currentStep === 10) && (
                    <div className="rounded-2xl border border-or-300/30 bg-or-400/10 p-4 text-xs leading-relaxed text-or-100/85">
                      <strong className="mb-1 block text-or-200">
                        Un temps de prière personnel est prévu pour cette fiche
                      </strong>
                      {group.currentStep === 10
                        ? 'Priez pour chaque personne individuellement, afin qu’elle soit remplie et renouvelée du Saint-Esprit. (livret p. 4)'
                        : 'Proposez à chacun un temps à part : blessures, liens, non-pardons, forteresses. Prévoyez de l’intimité et du temps. (livret p. 4, annexes p. 160-162)'}
                    </div>
                  )}

                  <p className="text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/45">
                    Sujets déposés par le groupe
                  </p>
                  {posts.filter((p) => p.kind === 'priere' && !p.answered).length === 0 ? (
                    <p className="rounded-2xl bg-white/[0.05] px-4 py-3.5 text-xs text-parchemin-100/50">
                      Aucun sujet sur le mur. C&apos;est le moment de les dire à voix haute.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {posts
                        .filter((p) => p.kind === 'priere' && !p.answered)
                        .slice(0, 6)
                        .map((post) => (
                          <li
                            key={post.id}
                            className="rounded-2xl bg-white/[0.05] px-4 py-3 text-xs leading-relaxed text-parchemin-100/75"
                          >
                            <span className="mb-0.5 block text-2xs font-bold text-or-300/80">
                              {post.authorName}
                            </span>
                            {post.content}
                          </li>
                        ))}
                    </ul>
                  )}

                  <textarea
                    value={saisie}
                    onChange={(event) => setSaisie(event.target.value)}
                    rows={2}
                    placeholder="Ajouter un sujet entendu ce soir…"
                    className="verre w-full resize-none rounded-2xl px-4 py-3 text-sm text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => void publier('priere')}
                      disabled={!saisie.trim()}
                      className="rounded-full bg-or-400/20 px-4 py-2 text-2xs font-bold text-or-200 transition-colors hover:bg-or-400 hover:text-encre-950 disabled:opacity-30"
                    >
                      Déposer sur le mur
                    </button>
                  </div>
                </div>
              )}
            </section>

            {soucisCloture && (
              <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                <p className="text-2xs leading-relaxed text-amber-100">{soucisCloture}</p>
              </div>
            )}

            {/* Commandes de l'animateur */}
            {isLeader && actifs.length < 2 ? (
              /* Le blocage ne vivait que sur l'écran de démarrage. Une session
                 créée d'office laissait ensuite dérouler toute la rencontre et
                 clore la fiche — donc avancer le parcours seul. */
              <div className="verre rounded-3xl p-4 text-center">
                <p className="text-xs leading-relaxed text-parchemin-100/80">
                  Vous êtes seul dans ce groupe. Une rencontre ne se clôt pas seul — invitez au
                  moins une personne pour ouvrir la fiche suivante.
                </p>
              </div>
            ) : isLeader ? (
              <div className="verre flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
                <button
                  onClick={() => void avancer(-1)}
                  disabled={stage === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/18 disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Étape précédente
                </button>

                {stage < MEETING_FLOW_LENGTH - 1 ? (
                  <button
                    onClick={() => void avancer(1)}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold"
                  >
                    Étape suivante <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmerCloture(true)}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold"
                  >
                    Clore la fiche {group.currentStep}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ) : (
              <p className="rounded-3xl bg-white/[0.05] px-5 py-4 text-2xs leading-relaxed text-parchemin-100/55">
                {group.leaderName} conduit le déroulé. Votre écran suit le sien, que vous soyez sur
                place ou connecté.
              </p>
            )}
          </div>

          {/* ══ Colonne : qui est là ══ */}
          <aside className="space-y-4">
            <div className="verre rounded-3xl p-5">
              <h3 className="font-serif text-sm font-bold text-parchemin-100">Qui est là ce soir</h3>

              <div className="mt-4 space-y-4">
                <GroupePresence
                  titre="Sur place"
                  icone={MapPin}
                  membres={surPlace.map((m) => m.displayName)}
                  couleur="text-emerald-300"
                />
                <GroupePresence
                  titre="En visio"
                  icone={Monitor}
                  membres={enLigne.map((m) => m.displayName)}
                  couleur="text-sky-300"
                />
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2.5 text-2xs font-bold uppercase tracking-[0.14em] text-parchemin-100/45">
                  Vous êtes
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'presentiel' as const, label: 'Sur place', icon: MapPin },
                      { value: 'ligne' as const, label: 'En visio', icon: Monitor },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      onClick={async () => {
                        await setSessionAttendance(group.id, user.uid, option.value);
                        await refresh();
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-2xs font-bold transition-all ${
                        monMode === option.value
                          ? 'bg-or-400 text-encre-950'
                          : 'bg-white/8 text-parchemin-100/65 hover:bg-white/14'
                      }`}
                    >
                      <option.icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {surLaSellette && (
              <div className="rounded-3xl border border-or-300/35 bg-or-400/12 p-5 text-center">
                <Mic className="mx-auto h-5 w-5 text-or-300" strokeWidth={1.75} />
                <p className="mt-2 text-2xs font-bold uppercase tracking-[0.16em] text-or-200/70">
                  La parole est à
                </p>
                <p className="mt-1 font-serif text-lg font-bold text-parchemin-100">
                  {surLaSellette.displayName}
                </p>
              </div>
            )}

            <MinuteurPartage />

            <Link
              href={`/fiches/${group.currentStep}`}
              className="verre flex items-center justify-between gap-2 rounded-3xl px-5 py-4 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/12"
            >
              Rouvrir la fiche {group.currentStep}
              <ArrowRight className="h-3.5 w-3.5 text-or-300" />
            </Link>
          </aside>
        </div>
      </div>

      {/* ── Confirmation de clôture ── */}
      {confirmerCloture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-encre-950/80 px-4 backdrop-blur-sm">
          <div className="animate-reveal w-full max-w-md rounded-4xl border border-white/12 bg-encre-900 p-6 sm:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-or-400/15 text-or-300">
              <Lock className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 font-serif text-xl font-bold text-parchemin-100">
              Clore la fiche {group.currentStep} ?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-parchemin-100/65">
              {group.currentStep >= 20
                ? 'C’est la dernière fiche. La clore achève le parcours pour tout le groupe.'
                : `La fiche ${group.currentStep + 1} s'ouvrira pour tous les membres, et celle-ci se refermera. C'est irréversible.`}
            </p>

            <label className="mt-4 block text-2xs font-bold uppercase tracking-[0.14em] text-or-200" htmlFor="recap-resume">
              Le récapitulatif de l’absent
            </label>
            <textarea
              id="recap-resume"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="En quelques phrases : ce que le groupe a compris et vécu…"
              className="verre mt-4 w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
            />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <textarea
                value={pepitesRecap}
                onChange={(event) => setPepitesRecap(event.target.value)}
                rows={3}
                placeholder={'Pépites retenues\nUne idée par ligne'}
                aria-label="Pépites retenues"
                className="verre w-full resize-none rounded-2xl px-4 py-3 text-xs leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
              />
              <textarea
                value={prieresRecap}
                onChange={(event) => setPrieresRecap(event.target.value)}
                rows={3}
                placeholder={'Sujets de prière\nUn sujet par ligne'}
                aria-label="Sujets de prière"
                className="verre w-full resize-none rounded-2xl px-4 py-3 text-xs leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/35 focus:border-or-400/50"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5">
              <StickyNote className="h-4 w-4 shrink-0 text-or-300" />
              <input
                value={prochainPas}
                onChange={(event) => setProchainPas(event.target.value)}
                placeholder="Le prochain pas concret du groupe"
                aria-label="Prochain pas concret"
                className="min-w-0 flex-1 bg-transparent py-3 text-xs text-parchemin-100 outline-none placeholder:text-parchemin-100/35"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirmerCloture(false)}
                className="rounded-full bg-white/10 px-5 py-3 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
              >
                Pas encore
              </button>
              <button
                onClick={() => void terminer()}
                className="bouton-or rounded-full px-6 py-3 text-xs font-bold"
              >
                {group.currentStep >= 20 ? 'Achever le parcours' : 'Clore et ouvrir la suivante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function GroupePresence({
  titre,
  icone: Icone,
  membres,
  couleur,
}: {
  titre: string;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  membres: string[];
  couleur: string;
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-2xs font-bold ${couleur}`}>
        <Icone className="h-3.5 w-3.5" strokeWidth={2} />
        {titre} · {membres.length}
      </p>
      {membres.length === 0 ? (
        <p className="mt-1.5 text-2xs text-parchemin-100/30">Personne pour l&apos;instant</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {membres.map((nom) => (
            <li key={nom} className="text-xs text-parchemin-100/75">
              {nom}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TourDeParole({
  membres,
  actuel,
  peutDonner,
  onDonner,
}: {
  membres: { uid: string; nom: string; present: boolean }[];
  actuel: string | null;
  peutDonner: boolean;
  onDonner: (uid: string | null) => Promise<void>;
}) {
  const presents = membres.filter((m) => m.present);
  const index = presents.findIndex((m) => m.uid === actuel);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/45">
          Tour de partage
        </p>
        {peutDonner && (
          <button
            onClick={() =>
              void onDonner(presents[(index + 1) % Math.max(1, presents.length)]?.uid ?? null)
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-or-400/20 px-3.5 py-1.5 text-2xs font-bold text-or-200 transition-colors hover:bg-or-400 hover:text-encre-950"
          >
            <Hand className="h-3.5 w-3.5" />
            {index < 0 ? 'Commencer le tour' : 'Au suivant'}
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {presents.map((membre) => {
          const actif = membre.uid === actuel;
          const passe = index >= 0 && presents.indexOf(membre) < index;
          return (
            <button
              key={membre.uid}
              onClick={() => peutDonner && void onDonner(membre.uid)}
              disabled={!peutDonner}
              className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition-all ${
                actif
                  ? 'bg-or-400 text-encre-950'
                  : passe
                    ? 'bg-white/[0.06] text-parchemin-100/45'
                    : 'bg-white/10 text-parchemin-100/80 hover:bg-white/16'
              } ${peutDonner ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {actif ? (
                <Mic className="h-3.5 w-3.5 shrink-0" />
              ) : passe ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-40" />
              )}
              <span className="truncate text-xs font-bold">{membre.nom}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MinuteurPartage() {
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

  const presque = secondes <= 30 && secondes > 0;

  return (
    <div className="verre rounded-3xl p-5 text-center">
      <p className="text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/45">
        Temps de parole
      </p>
      <p
        className={`my-3 font-mono text-3xl font-bold transition-colors ${
          presque ? 'text-rose-300' : 'text-parchemin-100'
        }`}
      >
        {Math.floor(secondes / 60)}:{(secondes % 60).toString().padStart(2, '0')}
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setTourne((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/20"
        >
          {tourne ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {tourne ? 'Pause' : 'Démarrer'}
        </button>
        <button
          onClick={() => {
            setTourne(false);
            setSecondes(180);
          }}
          className="rounded-full bg-white/8 p-2 text-parchemin-100/60 transition-colors hover:bg-white/16"
          aria-label="Remettre à 3 minutes"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate>
      <RencontreContent />
    </ParcoursGate>
  );
}
