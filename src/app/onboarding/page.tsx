'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  Hourglass,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Search,
  Bookmark,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import {
  createGroup,
  discoverGroups,
  findInvitationsFor,
  getGroupByCode,
  requestToJoin,
  type CreateGroupInput,
} from '@/lib/parcoursStore';
import { formatDistance } from '@/lib/geo';
import PlacePicker from '@/components/PlacePicker';
import GroupMatchCard from '@/components/GroupMatchCard';
import GroupCreateForm from '@/components/GroupCreateForm';
import InvitePanel from '@/components/InvitePanel';
import type { AttendanceMode, GroupMatch, ParcoursGroup, PlaceRef } from '@/lib/types';

type Etape = 'intro' | 'situer' | 'chemin' | 'rejoindre' | 'demande' | 'creer' | 'inviter' | 'attente';

const ETAPES_VISIBLES: Etape[] = ['situer', 'chemin', 'rejoindre', 'demande'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, group, gate, loading, refresh, updateProfile } = useParcours();

  const [etape, setEtape] = useState<Etape>('intro');
  const [place, setPlace] = useState<PlaceRef | undefined>();
  const [matches, setMatches] = useState<GroupMatch[] | null>(null);
  const [selected, setSelected] = useState<GroupMatch | null>(null);
  const [invitations, setInvitations] = useState<ParcoursGroup[]>([]);
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState<AttendanceMode>('presentiel');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveauGroupe, setNouveauGroupe] = useState<ParcoursGroup | null>(null);

  // ── Redirections ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?suite=/onboarding');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (loading) return;
    if (gate.state === 'ouvert' && etape !== 'inviter') router.replace('/dashboard');
  }, [gate.state, loading, router, etape]);

  // Synchronisation des états locaux sur les données chargées, pendant le
  // rendu : un re-rendu immédiat plutôt qu'un aller-retour d'effet.
  if (profile?.place && !place) setPlace(profile.place);
  if (!loading && gate.state === 'en_attente' && etape !== 'inviter' && etape !== 'attente') {
    setEtape('attente');
  }

  // Invitations reçues à cette adresse.
  useEffect(() => {
    if (!user?.email) return;
    void findInvitationsFor(user.email).then(setInvitations);
  }, [user?.email]);

  useEffect(() => {
    if (etape === 'rejoindre' && place && matches === null) {
      void discoverGroups(place, { includeFull: true, limit: 30 }).then(setMatches);
    }
  }, [etape, place, matches]);

  // ── Actions ─────────────────────────────────────────────────

  const validerPosition = async () => {
    if (!place) return;
    await updateProfile({ place });
    setMatches(null);
    setEtape('chemin');
  };

  const soumettreDemande = async () => {
    if (!selected || !user) return;
    setBusy(true);
    setErreur(null);
    try {
      await requestToJoin({
        groupId: selected.group.id,
        user: {
          uid: user.uid,
          displayName: user.displayName || 'Disciple',
          email: user.email,
          photoURL: user.photoURL,
        },
        message,
        place,
        attendance,
      });
      await refresh();
      setEtape('attente');
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'La demande a échoué.');
    } finally {
      setBusy(false);
    }
  };

  const creerLeGroupe = async (input: CreateGroupInput) => {
    const created = await createGroup(input);
    setNouveauGroupe(created);
    await refresh();
    setEtape('inviter');
  };

  const rejoindreParCode = async () => {
    setCodeError(null);
    if (!code.trim() || !user) return;
    setBusy(true);
    try {
      const found = await getGroupByCode(code);
      if (!found) {
        setCodeError("Aucun groupe ne correspond à ce code. Vérifiez auprès de la personne qui vous l'a donné.");
        return;
      }
      await requestToJoin({
        groupId: found.id,
        user: {
          uid: user.uid,
          displayName: user.displayName || 'Disciple',
          email: user.email,
          photoURL: user.photoURL,
        },
        message: 'Arrivé·e avec le code d’invitation.',
        place,
        attendance,
      });
      await refresh();
      setEtape('attente');
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Impossible de rejoindre ce groupe.');
    } finally {
      setBusy(false);
    }
  };

  const rejoindreDepuisInvitation = async (invitationGroup: ParcoursGroup) => {
    setSelected({
      group: invitationGroup,
      distanceKm: place ? null : null,
      seatsLeft: Math.max(0, invitationGroup.capacity - invitationGroup.membersCount),
      joinable: true,
    });
    setEtape('demande');
  };

  const progression = useMemo(() => {
    const index = ETAPES_VISIBLES.indexOf(etape);
    if (etape === 'creer') return 0.72;
    if (etape === 'inviter') return 0.9;
    if (etape === 'attente') return 1;
    if (index < 0) return 0;
    return (index + 1) / (ETAPES_VISIBLES.length + 1);
  }, [etape]);

  if (authLoading || (loading && etape === 'intro')) {
    return (
      <div className="nuit flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-or-300" />
      </div>
    );
  }

  return (
    <div className="nuit nuit-grain relative min-h-screen overflow-hidden">
      
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

      {/* Vitraux de fond */}
      <span className="vitrail left-[-8rem] top-[-6rem] h-96 w-96 bg-or-400/12 animate-souffle relative z-1" />
      <span
        className="vitrail right-[-10rem] top-32 h-[28rem] w-[28rem] bg-encre-400/25 animate-souffle relative z-1"
        style={{ animationDelay: '1.6s' }}
      />
      <span className="vitrail bottom-[-12rem] left-1/3 h-96 w-96 bg-or-500/8 relative z-1" />

      {/* Rail de progression */}
      <div className="fixed inset-x-0 top-0 z-40 px-4 pt-[4.5rem] sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rail">
            <span style={{ width: `${Math.round(progression * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-8">
        {/* ═══════════ INTRO ═══════════ */}
        {etape === 'intro' && (
          <section className="animate-reveal text-center">
            <p className="font-serif italic text-amber-300/90 text-sm">
              Avant de commencer la première étape
            </p>

            <h1 className="mt-5 font-serif text-4xl leading-[1.1] font-bold text-parchemin-100 sm:text-5xl">
              Ce parcours ne
              <br />
              <span className="titre-or">se marche pas seul.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-parchemin-100/70 sm:text-base">
              Les Fondements, ce sont vingt fiches préparées chez soi, dans le silence — et vingt
              rencontres où l&apos;on met des mots dessus, à cinq ou six, autour d&apos;une table ou
              d&apos;un écran.
            </p>

            <div className="mx-auto mt-8 max-w-lg encadre-nuit text-sm leading-relaxed">
              « Un nombre de 5-6 participants semble être un bon équilibre. »
              <span className="mt-1 block text-2xs not-italic text-or-200/60">
                Le parcours des fondements, p. 3
              </span>
            </div>

            <div className="mx-auto mt-9 grid max-w-lg gap-3 text-left cascade">
              {[
                {
                  icon: Users,
                  titre: 'Un groupe, d’abord',
                  texte:
                    'Vous rejoignez un groupe près de chez vous, ou vous créez le vôtre et vous invitez.',
                },
                {
                  icon: Lock,
                  titre: 'Puis le parcours s’ouvre',
                  texte:
                    'Tant qu’il n’y a pas de groupe, les fiches restent fermées. C’est voulu.',
                },
                {
                  icon: Compass,
                  titre: 'Une fiche à la fois',
                  texte:
                    'Vous la préparez seul, le groupe la partage, puis la suivante s’ouvre. Jamais avant.',
                },
              ].map((item) => (
                <div
                  key={item.titre}
                  className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-or-400/15 text-or-300">
                    <item.icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-parchemin-100">{item.titre}</p>
                    <p className="mt-0.5 text-2xs leading-relaxed text-parchemin-100/60">
                      {item.texte}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setEtape(place ? 'chemin' : 'situer')}
              className="bouton-or mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
            >
              Commencer
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </section>
        )}

        {/* ═══════════ SE SITUER ═══════════ */}
        {etape === 'situer' && (
          <section className="animate-reveal">
            <EnTete
              numero="1"
              titre="D’où partez-vous ?"
              sous="Les groupes vous seront proposés du plus proche au plus lointain. Votre position sert uniquement à ce classement."
            />

            <div className="mt-8 rounded-3xl border border-white/12 bg-white/[0.05] p-5 sm:p-7">
              <PlacePicker value={place} onChange={setPlace} autoFocus />

              <p className="mt-5 flex items-start gap-2 text-2xs leading-relaxed text-parchemin-100/45">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                Votre position exacte n&apos;est jamais affichée aux autres. Les membres d&apos;un
                groupe voient seulement une distance approximative.
              </p>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEtape('intro')}
                className="inline-flex items-center gap-1.5 text-2xs font-bold text-parchemin-100/55 transition-colors hover:text-parchemin-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
              <button
                type="button"
                onClick={validerPosition}
                disabled={!place}
                className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuer
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </section>
        )}

        {/* ═══════════ CHOISIR SON CHEMIN ═══════════ */}
        {etape === 'chemin' && (
          <section className="animate-reveal">
            <EnTete
              numero="2"
              titre="Rejoindre, ou rassembler ?"
              sous={
                place
                  ? `Vous êtes situé à ${place.city}. Deux chemins s'ouvrent, aucun n'est meilleur que l'autre.`
                  : "Deux chemins s'ouvrent, aucun n'est meilleur que l'autre."
              }
            />

            {invitations.length > 0 && (
              <div className="mt-7 rounded-3xl border border-or-300/30 bg-or-400/10 p-5">
                <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.18em] text-or-200">
                  <Bookmark className="h-3.5 w-3.5" />
                  On vous attend déjà
                </p>
                <div className="mt-3.5 space-y-2">
                  {invitations.map((invitation) => (
                    <button
                      key={invitation.id}
                      type="button"
                      onClick={() => void rejoindreDepuisInvitation(invitation)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/12"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-sm font-bold text-parchemin-100">
                          {invitation.name}
                        </span>
                        <span className="block truncate text-2xs text-parchemin-100/55">
                          Invitation de {invitation.leaderName} · {invitation.place.city}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-or-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMatches(null);
                  setEtape('rejoindre');
                }}
                className="group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.05] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-or-300/40 hover:bg-white/[0.09]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-or-400/15 text-or-300 transition-transform duration-300 group-hover:scale-110">
                  <Search className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-parchemin-100">
                  Rejoindre un groupe
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-parchemin-100/65">
                  Voir qui parcourt Les Fondements autour de vous. Vous envoyez une demande,
                  l&apos;animateur vous accueille.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-2xs font-bold text-or-200">
                  Voir les groupes proches <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEtape('creer')}
                className="group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.05] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-or-300/40 hover:bg-white/[0.09]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-or-400/15 text-or-300 transition-transform duration-300 group-hover:scale-110">
                  <Flame className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-parchemin-100">
                  Créer mon groupe
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-parchemin-100/65">
                  Vous avez déjà des personnes en tête. Vous fixez le jour, le lieu, et vous les
                  invitez par e-mail ou par code.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-2xs font-bold text-or-200">
                  Je rassemble <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>

            {/* Code d'invitation */}
            <div className="mt-5 rounded-3xl border border-white/12 bg-white/[0.04] p-5">
              <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.18em] text-parchemin-100/60">
                <KeyRound className="h-3.5 w-3.5" />
                On vous a donné un code ?
              </p>
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="FOND-XXXXX"
                  className="verre flex-1 rounded-2xl px-4 py-3.5 font-mono text-sm tracking-[0.18em] text-parchemin-100 placeholder:tracking-normal placeholder:font-sans placeholder:text-parchemin-100/50 outline-none focus:border-or-400/50"
                />
                <button
                  type="button"
                  onClick={() => void rejoindreParCode()}
                  disabled={busy || code.trim().length < 4}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/12 px-6 py-3.5 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/20 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Rejoindre
                </button>
              </div>
              {codeError && (
                <p className="mt-2.5 rounded-xl bg-rose-500/12 px-3 py-2 text-2xs leading-relaxed text-rose-200">
                  {codeError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEtape('situer')}
              className="mt-7 inline-flex items-center gap-1.5 text-2xs font-bold text-parchemin-100/55 transition-colors hover:text-parchemin-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Changer de position
            </button>
          </section>
        )}

        {/* ═══════════ REJOINDRE ═══════════ */}
        {etape === 'rejoindre' && (
          <section className="animate-reveal">
            <EnTete
              numero="3"
              titre="Les groupes autour de vous"
              sous={
                place
                  ? `Classés depuis ${place.city}, du plus proche au plus lointain.`
                  : 'Classés du plus proche au plus lointain.'
              }
            />

            {matches === null ? (
              <div className="mt-10 flex flex-col items-center gap-3 py-16">
                <Loader2 className="h-6 w-6 animate-spin text-or-300" />
                <p className="text-2xs text-parchemin-100/50">Recherche des groupes proches…</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
                <MapPin className="mx-auto h-8 w-8 text-parchemin-100/55" strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-lg font-bold text-parchemin-100">
                  Personne encore, dans votre coin
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-parchemin-100/60">
                  C&apos;est souvent comme ça que les meilleures cellules commencent : quelqu&apos;un
                  ouvre la porte le premier.
                </p>
                <button
                  type="button"
                  onClick={() => setEtape('creer')}
                  className="bouton-or mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold"
                >
                  Créer le premier groupe ici <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="mt-7 space-y-3 cascade">
                  {matches.map((match) => (
                    <GroupMatchCard
                      key={match.group.id}
                      match={match}
                      selected={selected?.group.id === match.group.id}
                      onSelect={(chosen) => {
                        setSelected(chosen);
                        setAttendance(
                          chosen.group.meeting.mode === 'ligne' ? 'ligne' : 'presentiel'
                        );
                        setEtape('demande');
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
                  <p className="text-xs text-parchemin-100/65">
                    Aucun ne vous correspond ? Le vôtre manque peut-être à quelqu&apos;un d&apos;autre.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEtape('creer')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
                  >
                    Créer mon groupe <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setEtape('chemin')}
              className="mt-7 inline-flex items-center gap-1.5 text-2xs font-bold text-parchemin-100/55 transition-colors hover:text-parchemin-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Retour
            </button>
          </section>
        )}

        {/* ═══════════ DEMANDE D'ADHÉSION ═══════════ */}
        {etape === 'demande' && selected && (
          <section className="animate-reveal">
            <EnTete
              numero="4"
              titre={`Frapper à la porte de ${selected.group.name}`}
              sous="Un mot pour vous présenter, et l’animateur vous répond."
            />

            <div className="mt-7 rounded-3xl border border-white/12 bg-white/[0.05] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-2xs text-parchemin-100/65">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-or-300/80" />
                  {selected.group.membersCount}/{selected.group.capacity} participants
                </span>
                {selected.distanceKm !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-or-300/80" />
                    {formatDistance(selected.distanceKm)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-or-300/80" />
                  {selected.group.meeting.mode === 'ligne'
                    ? 'Rencontres en ligne'
                    : selected.group.meeting.mode === 'hybride'
                      ? 'Présentiel + visio'
                      : 'En présentiel'}
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-parchemin-100/75">
                {selected.group.description}
              </p>

              <div className="mt-6">
                <label className="mb-2.5 block text-2xs font-bold uppercase tracking-[0.18em] text-or-300/80">
                  Votre mot de présentation
                </label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="Qui vous êtes, où vous en êtes, pourquoi ce parcours maintenant. Trois lignes suffisent."
                  className="verre w-full resize-none rounded-2xl px-4 py-3.5 text-sm leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/50 focus:border-or-400/50"
                  maxLength={400}
                />
              </div>

              {selected.group.meeting.mode === 'hybride' && (
                <div className="mt-5">
                  <label className="mb-2.5 block text-2xs font-bold uppercase tracking-[0.18em] text-or-300/80">
                    Vous pensez venir plutôt…
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        { value: 'presentiel' as const, label: 'Sur place', icon: MapPin },
                        { value: 'ligne' as const, label: 'En visio', icon: Monitor },
                      ]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAttendance(option.value)}
                        className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold transition-all ${
                          attendance === option.value
                            ? 'border-or-400/60 bg-or-400/12 text-or-200'
                            : 'border-white/12 bg-white/[0.05] text-parchemin-100/70 hover:border-white/25'
                        }`}
                      >
                        <option.icon className="h-4 w-4" strokeWidth={2} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-2xs text-parchemin-100/45">
                    Ce n&apos;est pas un engagement : vous pourrez changer avant chaque rencontre.
                  </p>
                </div>
              )}

              {erreur && (
                <p className="mt-4 rounded-xl bg-rose-500/12 px-3.5 py-2.5 text-2xs leading-relaxed text-rose-200">
                  {erreur}
                </p>
              )}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEtape('rejoindre')}
                className="inline-flex items-center gap-1.5 text-2xs font-bold text-parchemin-100/55 transition-colors hover:text-parchemin-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Autres groupes
              </button>
              <button
                type="button"
                onClick={() => void soumettreDemande()}
                disabled={busy}
                className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer ma demande
              </button>
            </div>
          </section>
        )}

        {/* ═══════════ CRÉER ═══════════ */}
        {etape === 'creer' && user && (
          <section className="animate-reveal">
            <EnTete
              numero="3"
              titre="Votre groupe"
              sous="Vous en serez l’animateur : celui qui ouvre la porte, garde le rythme et veille à ce que chacun puisse parler."
            />

            <div className="mt-7 rounded-3xl border border-white/12 bg-white/[0.05] p-5 sm:p-7">
              <GroupCreateForm
                defaultPlace={place}
                leader={{
                  uid: user.uid,
                  displayName: user.displayName || 'Animateur',
                  email: user.email,
                  photoURL: user.photoURL,
                }}
                onCreate={creerLeGroupe}
                onBack={() => setEtape('chemin')}
              />
            </div>
          </section>
        )}

        {/* ═══════════ INVITER ═══════════ */}
        {etape === 'inviter' && (nouveauGroupe || group) && user && (
          <section className="animate-reveal">
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
                <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
              </span>
              <h1 className="mt-6 font-serif text-3xl font-bold text-parchemin-100 sm:text-4xl">
                <span className="titre-or">{(nouveauGroupe ?? group)!.name}</span> existe.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchemin-100/70">
                Le parcours est ouvert pour vous. Il ne manque plus que ceux avec qui vous allez le
                vivre.
              </p>
            </div>

            <div className="mt-8">
              <InvitePanel
                group={(nouveauGroupe ?? group)!}
                inviter={{ uid: user.uid, displayName: user.displayName || 'Animateur' }}
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
              >
                Entrer dans le parcours <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <p className="text-2xs text-parchemin-100/45">
                Vous pourrez inviter d&apos;autres personnes à tout moment depuis l&apos;espace du
                groupe.
              </p>
            </div>
          </section>
        )}

        {/* ═══════════ SALLE D'ATTENTE ═══════════ */}
        {etape === 'attente' && (
          <section className="animate-reveal text-center">
            <span className="mx-auto grid h-16 w-16 animate-souffle place-items-center rounded-full bg-or-400/12 text-or-300">
              <Hourglass className="h-7 w-7" strokeWidth={1.75} />
            </span>

            <h1 className="mt-6 font-serif text-3xl font-bold text-parchemin-100 sm:text-4xl">
              Votre demande est <span className="titre-or">partie.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/70">
              {group
                ? `${group.leaderName} anime ${group.name}. Dès que votre place est confirmée, la première fiche s'ouvre.`
                : "Dès que l'animateur confirme votre place, la première fiche s'ouvre."}
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-3xl border border-white/12 bg-white/[0.05] p-5 text-left">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-or-300/80">
                En attendant
              </p>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-parchemin-100/70">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-or-400" />
                  Prenez une bible à portée de main : le parcours s&apos;appuie dessus à chaque
                  fiche.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-or-400" />
                  Réservez le créneau dans votre agenda. L&apos;assiduité fait plus que la bonne
                  volonté.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-or-400" />
                  Notez ce que vous espérez de ces mois-ci. Vous le relirez à la fiche 20.
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
              >
                Voir mon espace
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setMatches(null);
                  setEtape('chemin');
                }}
                className="text-2xs font-bold text-parchemin-100/45 transition-colors hover:text-parchemin-100/80"
              >
                Choisir un autre groupe
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EnTete({ numero, titre, sous }: { numero: string; titre: string; sous: string }) {
  return (
    <div>
      <p className="font-serif italic text-amber-300/90 text-xs">
        Étape {numero} sur 3
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
        {titre}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-parchemin-100/65">{sous}</p>
    </div>
  );
}
