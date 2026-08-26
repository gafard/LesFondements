'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Bookmark,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  Headphones,
  PenLine,
  Sparkles,
  Star,
  Users,
  Hourglass,
  Printer,
  LogOut,
  Search,
  TrendingUp,
  BookMarked,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import ProgressBar from '@/components/ProgressBar';
import YearHeatmap from '@/components/YearHeatmap';
import ModernIcon from '@/components/ModernIcon';
import NotificationCenter from '@/components/NotificationCenter';
import EdificeFondements from '@/components/EdificeFondements';
import RecapManque from '@/components/RecapManque';
import PauseSanctuaire from '@/components/PauseSanctuaire';
import TelechargementHorsLigne from '@/components/TelechargementHorsLigne';
import { getCachedJournalEntries, getJournalEntries, timestampToDate } from '@/lib/firestore';
import type { JournalEntry } from '@/lib/firestore';
import { getCachedPosts, getPosts, nextMeetingDate, subscribe } from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import Illumination from '@/components/Illumination';
import { Etincelle, MotFantome, Pastille } from '@/components/decor';
import { chargerFiche, versetsDe } from '@/lib/livret';
import { texteDuVerset } from '@/data/versets';
import type { GroupPost } from '@/lib/types';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function DashboardContent() {
  const { user, logout } = useAuth();
  const { group, members, membership, session, isLeader } = useParcours();
  const [notifOuvert, setNotifOuvert] = useState(false);
  const [pauseOuverte, setPauseOuverte] = useState(false);
  const [horsLigneOuvert, setHorsLigneOuvert] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>(() =>
    user ? getCachedJournalEntries(user.uid).slice(0, 3) : []
  );
  const [posts, setPosts] = useState<GroupPost[]>(() =>
    group ? getCachedPosts(group.id) : []
  );
  const [ancre, setAncre] = useState<{ reference: string; texte: string | null } | null>(null);
  const [maintenant] = useState(() => Date.now());

  const chargerPosts = useCallback(() => {
    if (!group) return;
    void getPosts(group.id).then(setPosts);
  }, [group]);

  useEffect(() => {
    if (!user) return;
    void getJournalEntries(user.uid).then((entries) => setJournal(entries.slice(0, 3)));
  }, [user]);

  useEffect(() => {
    chargerPosts();
    if (!group) return;
    return subscribe(`posts:${group.id}`, chargerPosts);
  }, [group, chargerPosts]);

  // Le premier verset à mémoriser de la fiche en cours.
  useEffect(() => {
    if (!group) return;
    void chargerFiche(group.currentStep).then((contenu) => {
      const reference = contenu ? versetsDe(contenu)[0] : undefined;
      setAncre(reference ? { reference, texte: texteDuVerset(reference) } : null);
    });
  }, [group]);

  const actifs = useMemo(() => members.filter((m) => m.status === 'actif'), [members]);

  if (!user || !group) return null;

  const fiche = FICHES_META.find((f) => f.id === group.currentStep);
  const prochaine = nextMeetingDate(group.meeting, group.stepOpenedAt);
  const jours = Math.max(
    0,
    Math.ceil((prochaine.getTime() - maintenant) / (1000 * 60 * 60 * 24))
  );
  const jePrepare = membership?.preparedSteps.includes(group.currentStep) ?? false;
  const prets = actifs.filter((m) => m.preparedSteps.includes(group.currentStep)).length;
  const enRencontre = group.stepPhase === 'rencontre' && session?.status === 'ouverte';

  const prieres = posts.filter((p) => p.kind === 'priere' && !p.answered);
  const pepite = posts.find((p) => p.kind === 'pepite');
  const versetAncre = ancre;

  return (
    <div className="table-travail min-h-screen px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* ══ En-tête : Grande feuille de bureau épinglée ══ */}
        <div className="feuille relative rounded-3xl p-6 sm:p-8 shadow-md">
          {/* Punaise dorée en haut à gauche & Washi tape à droite */}
          <span className="punaise -top-2 left-8" />
          <span className="ruban -top-3 right-10 rotate-3 rounded-[2px]" />

          <MotFantome haut="-18%" droite="-2%" taille="clamp(6rem, 16vw, 11rem)">
            {String(group.currentStep).padStart(2, '0')}
          </MotFantome>

          <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Pastille>
                  <Etincelle taille={12} />
                  {group.name}
                </Pastille>
                <span className="timbre rounded-md px-2.5 py-0.5 text-2xs font-bold text-or-800">
                  Semaine {group.currentStep} / 20
                </span>
              </div>

              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-encre-950 sm:text-4xl">
                Bonjour, {user.displayName?.split(' ')[0] || 'cher disciple'}.
              </h1>

              <p className="manuscrit mt-2 text-xl sm:text-2xl text-or-800 leading-relaxed max-w-xl">
                {enRencontre
                  ? 'La rencontre de votre cellule est ouverte en ce moment même sur la table.'
                  : jePrepare
                    ? `Fiche ${group.currentStep} prête ! Rendez-vous ${JOURS[group.meeting.weekday]} avec vos compagnons.`
                    : `Prenez un temps à part : il vous reste ${jours} jour${jours > 1 ? 's' : ''} pour préparer votre fiche.`}
              </p>
            </div>

            {/* Enluminure de la fiche */}
            <Illumination
              fiche={group.currentStep}
              taille={110}
              tone="clair"
              className="hidden shrink-0 sm:block drop-shadow-md"
            />
          </div>
        </div>

        {/* ══ Rencontre en direct (si ouverte) ══ */}
        {enRencontre && (
          <Link
            href="/groupes/rencontre"
            className="nuit nuit-grain animate-reveal relative block overflow-hidden rounded-3xl p-6 text-parchemin-100 shadow-xl transition-transform hover:-translate-y-0.5 sm:p-7 border border-or-400/30"
          >
            <span className="punaise punaise-rouge -top-2 left-6" />
            <span className="vitrail right-[-4rem] top-[-4rem] h-56 w-56 bg-or-400/18" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-2xs font-bold uppercase tracking-[0.16em] text-rose-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
                  </span>
                  En direct
                </span>
                <h2 className="mt-2.5 font-serif text-xl font-bold sm:text-2xl">
                  Votre cellule est réunie
                </h2>
                <p className="mt-1 text-xs text-parchemin-100/70">
                  Rejoignez vos compagnons de parcours — sur place ou en visio.
                </p>
              </div>
              <span className="bouton-or inline-flex shrink-0 items-center gap-2 self-start rounded-full px-6 py-3 text-xs font-bold sm:self-auto">
                Prendre place <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </div>
          </Link>
        )}

        {/* ══ Fiche courante (Feuille d'étude) & Post-it Verset ══ */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          
          {/* Feuille de travail : La fiche de la semaine */}
          <div className="feuille pose-1 relative rounded-3xl p-6 sm:p-8 shadow-md md:col-span-2 flex flex-col justify-between">
            {/* Pince d'attache noire et argentée */}
            <span className="attache-pince -top-3 left-10" />

            <div>
              <div className="mb-4 flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <ModernIcon icon={Compass} variant="amber" size="sm" />
                  <div>
                    <span className="text-2xs font-bold uppercase tracking-[0.16em] text-encre-400">
                      Cahier d&apos;étude de la semaine
                    </span>
                    <h2 className="font-serif text-xl font-bold text-encre-950">
                      {group.currentStep}. {fiche?.titre}
                    </h2>
                  </div>
                </div>

                <span className="timbre px-3 py-1 text-2xs font-bold text-or-800 rounded-lg">
                  {group.closedSteps.length} / 20 fiches
                </span>
              </div>

              <p className="manuscrit mb-4 text-sm text-encre-700 leading-relaxed">
                {fiche?.sousTitre}
              </p>

              <ProgressBar current={group.closedSteps.length} total={20} showLabel={false} />

              <div className="mt-5 space-y-2.5 bg-parchemin-50/70 rounded-2xl p-4 border border-encre-950/5">
                <Etape
                  faite={jePrepare}
                  texte="Lire l’exposé et répondre aux questions, chez vous"
                />
                <Etape
                  faite={group.stepPhase !== 'preparation'}
                  texte={`Partager la fiche avec le groupe, ${JOURS[group.meeting.weekday]} à ${group.meeting.time}`}
                />
                <Etape
                  faite={false}
                  texte={
                    group.currentStep >= 20
                      ? 'Achever le parcours'
                      : `Ouvrir la fiche ${group.currentStep + 1}`
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-encre-950/10 pt-5">
              <Link
                href={`/fiches/${group.currentStep}?immersion=1`}
                className="bouton-or inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold shadow-sm"
              >
                <Headphones className="h-4 w-4" strokeWidth={2} />
                Lancer l&apos;immersion guidée
              </Link>
              <Link
                href={`/fiches/${group.currentStep}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-parchemin-400 bg-white/80 px-5 py-3 text-xs font-bold text-encre-700 transition-colors hover:bg-parchemin-200"
              >
                <BookOpen className="h-4 w-4" strokeWidth={2} />
                Lecture libre & Étude
              </Link>
            </div>
          </div>

          {/* Post-it : Verset à méditer */}
          <div className="postit pose-2 relative rounded-2xl p-6 shadow-md">
            {/* Punaise rouge */}
            <span className="punaise punaise-rouge -top-2.5 right-6" />

            <div className="flex items-center justify-between gap-2 border-b border-encre-950/10 pb-2 mb-3">
              <span className="manuscrit text-base font-bold text-encre-900 flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-or-700" />
                Verset à méditer
              </span>
              <span className="text-2xs font-semibold text-encre-600">
                Fiche {group.currentStep}
              </span>
            </div>

            <p className="font-serif text-sm italic leading-relaxed text-encre-900 mb-4">
              {versetAncre?.texte
                ? `« ${versetAncre.texte} »`
                : versetAncre
                  ? 'À recopier de votre main, Bible ouverte — c’est ainsi que le livret le demande.'
                  : '« Approchez-vous de Dieu, et il s’approchera de vous. »'}
            </p>

            <div className="flex items-center justify-between border-t border-encre-950/10 pt-3">
              <span className="manuscrit text-base font-bold text-or-800">
                {versetAncre?.reference ?? 'Jacques 4:8'}
              </span>
              <Link
                href="/memorisation"
                className="inline-flex items-center gap-1 text-2xs font-bold text-encre-800 underline hover:text-encre-950"
              >
                Flashcards →
              </Link>
            </div>
          </div>
        </div>

        {/* ══ Rappels & Méditations du jour ══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-or-300/80 bg-gradient-to-r from-or-50/80 via-white/80 to-indigo-50/80 p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-or-100 text-or-800 shadow-2xs">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-encre-950">
                Goutte de Rosée & Rappels quotidiens
              </p>
              <p className="text-2xs text-encre-500">
                Préparez vos rappels sur cet appareil ; les notifications distantes s’activent lorsque le service d’envoi est configuré.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotifOuvert(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 shadow-xs transition-colors hover:bg-encre-900"
          >
            <BellRing className="h-3.5 w-3.5 text-or-300" />
            Régler mes rappels
          </button>
        </div>

        <NotificationCenter ouvert={notifOuvert} onFermer={() => setNotifOuvert(false)} />

        {/* ══ Le pouls de la cellule : Mur de Post-its colorés ══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="punaise inline-block relative !top-0 !left-0 shrink-0" />
              <h3 className="font-serif text-xl font-bold text-encre-950">Le pouls de la cellule</h3>
            </div>
            <Link
              href="/groupes"
              className="manuscrit text-sm font-bold text-or-800 hover:text-or-950 inline-flex items-center gap-1"
            >
              Voir le carnet du groupe <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Post-it Bleu : Prochaine rencontre */}
            <div className="postit-bleu pose-3 relative rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <span className="punaise punaise-bleue -top-2.5 left-6" />
              <div>
                <span className="text-2xs font-bold uppercase tracking-[0.14em] text-sky-800 block">
                  Prochaine rencontre
                </span>
                <p className="manuscrit mt-1.5 text-xl font-bold text-encre-950">
                  {JOURS[group.meeting.weekday]} {prochaine.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="mt-1 text-xs text-sky-900 leading-snug">
                  {group.meeting.time} · {
                    group.meeting.mode === 'ligne'
                      ? 'en visio'
                      : group.meeting.mode === 'hybride'
                        ? 'sur place ou en visio'
                        : 'en présentiel'
                  }
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-sky-900/10 text-2xs text-sky-800 font-medium">
                Cellule {group.name}
              </div>
            </div>

            {/* Post-it Jaune : Fiches préparées */}
            <div className="postit pose-1 relative rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <span className="ruban -top-2.5 left-1/2 -translate-x-1/2 rotate-1 rounded-[2px]" />
              <div>
                <span className="text-2xs font-bold uppercase tracking-[0.14em] text-or-800 block">
                  Fiches préparées
                </span>
                <p className="manuscrit mt-1.5 text-2xl font-bold text-encre-950">
                  {prets} / {actifs.length} prêts
                </p>
                <p className="mt-1 text-xs text-encre-800 leading-snug">
                  {jePrepare
                    ? '✓ Vous avez préparé la vôtre'
                    : '⏳ En attente de votre réponse'}
                </p>
              </div>
              <Link
                href="/groupes"
                className="mt-4 pt-2 border-t border-encre-950/10 text-2xs font-bold text-or-900 hover:underline flex items-center justify-between"
              >
                <span>Détail du groupe</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Post-it Rose : Sujets de prière */}
            <div className="postit-rose pose-4 relative rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <span className="trombone -top-3 right-5 rotate-6" />
              <div>
                <span className="text-2xs font-bold uppercase tracking-[0.14em] text-rose-800 block">
                  Sujets de prière
                </span>
                <p className="manuscrit mt-1.5 text-2xl font-bold text-rose-950">
                  {prieres.length} en cours
                </p>
                <p className="mt-1 text-xs text-rose-900 line-clamp-2 leading-snug">
                  {prieres[0] ? `Dernier : ${prieres[0].authorName}` : 'Le carnet de prière est paisible'}
                </p>
              </div>
              <Link
                href="/groupes"
                className="mt-4 pt-2 border-t border-rose-900/10 text-2xs font-bold text-rose-900 hover:underline flex items-center justify-between"
              >
                <span>Prier ensemble</span>
                <Heart className="h-3 w-3 text-rose-600" />
              </Link>
            </div>

            {/* Post-it Vert : Dernière pépite */}
            <div className="postit-vert pose-2 relative rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <span className="punaise -top-2.5 right-6" />
              <div>
                <span className="text-2xs font-bold uppercase tracking-[0.14em] text-emerald-800 block">
                  Pépite de la semaine
                </span>
                <p className="manuscrit mt-1.5 text-lg font-bold text-emerald-950 truncate">
                  {pepite?.reference ?? 'Partage fraternel'}
                </p>
                <p className="mt-1 text-xs text-emerald-900 line-clamp-2 leading-snug">
                  {pepite
                    ? `« ${pepite.content.slice(0, 45)}… »`
                    : 'Partagez ce qui vous a touché'}
                </p>
              </div>
              <Link
                href="/groupes"
                className="mt-4 pt-2 border-t border-emerald-900/10 text-2xs font-bold text-emerald-900 hover:underline flex items-center justify-between"
              >
                <span>Déposer une pépite</span>
                <Star className="h-3 w-3 text-emerald-700" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══ Assiduité & Rythme (Feuille de registre) ══ */}
        <div className="feuille relative rounded-3xl p-6 sm:p-8 shadow-sm">
          <span className="ruban -top-3 left-12 -rotate-1 rounded-[2px]" />
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-encre-950">Registre d&apos;assiduité spirituelle</h3>
            <p className="manuscrit text-sm text-encre-600">Votre fidélité au fil des jours</p>
          </div>
          <YearHeatmap />
        </div>

        {/* Ce qui s'est dit pendant une absence : en haut, avant le reste,
            parce que c'est ce qu'on a manqué qui doit se rattraper d'abord. */}
        <RecapManque />

        {/* ══ L'Édifice des Fondements (Temple architectural de 20 pierres) ══ */}
        <EdificeFondements
          closedSteps={group.closedSteps}
          currentStep={group.currentStep}
        />

        {/* ══ Établi Vivant : Les 8 Objets & Instruments du Disciple ══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="punaise inline-block relative !top-0 !left-0 shrink-0" />
              <h3 className="font-serif text-xl font-bold text-encre-950">
                Instruments de votre table d&apos;étude
              </h3>
            </div>
            <span className="text-3xs font-bold uppercase tracking-wider text-or-700 font-serif italic">
              Objets du disciple
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4 pt-1">
            {/* 1. La Photo Polaroid : Ma cellule */}
            <Link
              href="/groupes"
              className="objet-table objet-polaroid relative rounded-3xl p-4 sm:p-5 -rotate-2 flex flex-col justify-between overflow-hidden group"
            >
              <span className="trombone -top-3 left-6 rotate-6" />
              <div className="aspect-[4/3] rounded-2xl bg-amber-50/80 border border-parchemin-300 flex items-center justify-center p-3 text-center overflow-hidden relative shadow-inner">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-xs group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="absolute bottom-1 right-2 text-3xs font-serif italic text-encre-400">
                  {group.name}
                </span>
              </div>
              <div className="mt-3 text-center">
                <h4 className="manuscrit text-base font-bold text-encre-950">Notre Cellule</h4>
                <p className="text-3xs text-encre-500 font-serif italic">Prière & Partage</p>
              </div>
            </Link>

            {/* 2. Le Paquet de fiches bristol : Mémorisation */}
            <Link
              href="/memorisation"
              className="objet-table objet-paquet-bristol relative rounded-3xl p-4 sm:p-5 rotate-1 flex flex-col justify-between overflow-hidden group"
            >
              {/* Anneau métallique doré */}
              <div className="absolute top-3 left-4 flex items-center gap-1">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-600/60 bg-parchemin-200/50 shadow-xs" />
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-700">Fiches Bristol</span>
                  <Brain className="h-4 w-4 text-or-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="font-serif text-xs font-bold text-encre-900 line-clamp-2 leading-snug">
                  {versetAncre?.reference ? `« ${versetAncre.reference} »` : '« Ta parole est une lampe… »'}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-parchemin-300 flex items-center justify-between text-3xs text-encre-600">
                <span className="manuscrit font-bold text-xs text-or-800">Mémorisation</span>
                <span className="font-semibold text-or-900">Réciter →</span>
              </div>
            </Link>

            {/* 3. Le Carnet Moleskine Cuir : Journal */}
            <Link
              href="/journal"
              className="objet-table objet-carnet-cuir relative rounded-3xl p-4 sm:p-5 -rotate-1 flex flex-col justify-between overflow-hidden group text-parchemin-100"
            >
              {/* Ruban marque-page qui dépasse */}
              <span className="absolute -top-1 right-6 h-6 w-3 bg-or-400 rounded-b-xs shadow-xs" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-300/80">Carnet Privé</span>
                  <PenLine className="h-4 w-4 text-or-300 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-lg font-bold text-parchemin-100">Journal</h4>
                <p className="text-3xs text-parchemin-200/70 font-serif italic mt-0.5">Méditations & prières</p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-3xs text-or-300/90 font-medium">
                <span>{journal.length} entrée{journal.length > 1 ? 's' : ''}</span>
                <span>Ouvrir →</span>
              </div>
            </Link>

            {/* 4. La Cassette Audio Vintage : Témoignages */}
            <Link
              href="/temoignages"
              className="objet-table objet-cassette relative rounded-3xl p-4 sm:p-5 rotate-2 flex flex-col justify-between overflow-hidden group text-parchemin-100"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xs font-mono uppercase tracking-widest text-or-400">AUDIO TAPE</span>
                <Heart className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              {/* Deux bobines de cassette */}
              <div className="my-2 rounded-xl bg-black/60 p-2 border border-white/10 flex items-center justify-around">
                <div className="h-5 w-5 rounded-full border-2 border-dashed border-white/40 bg-neutral-900 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
                </div>
                <div className="h-1 flex-1 mx-2 bg-white/15 rounded-full" />
                <div className="h-5 w-5 rounded-full border-2 border-dashed border-white/40 bg-neutral-900 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
                </div>
              </div>
              <div className="rounded-lg bg-parchemin-100 p-1.5 text-center shadow-xs">
                <h4 className="manuscrit text-xs font-bold text-encre-950">Récits & Témoignages</h4>
              </div>
            </Link>

            {/* 5. Le Sablier en Laiton : Pause Sanctuaire */}
            <button
              type="button"
              onClick={() => setPauseOuverte(true)}
              className="objet-table objet-sablier relative rounded-3xl p-4 sm:p-5 -rotate-1 flex flex-col justify-between text-left group border border-amber-300"
            >
              <span className="ruban -top-2.5 left-6 rotate-2 rounded-[2px]" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-amber-800">Recueillement</span>
                  <Hourglass className="h-4 w-4 text-amber-700 group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <h4 className="manuscrit text-base sm:text-lg font-bold text-encre-950">Pause Sanctuaire</h4>
                <p className="text-3xs text-encre-600 font-serif italic mt-0.5">Sablier de silence</p>
              </div>
              <div className="mt-4 pt-2 border-t border-amber-300/60 flex items-center justify-between text-3xs font-bold text-amber-900">
                <span>Prendre 5 min</span>
                <span>Lancer ⌛</span>
              </div>
            </button>

            {/* 6. Le Livret Broché : Carnet PDF */}
            <Link
              href="/carnet-export"
              className="objet-table objet-livret-pdf relative rounded-3xl p-4 sm:p-5 rotate-1 flex flex-col justify-between overflow-hidden group"
            >
              <span className="attache-pince -top-3 right-6" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-700">Format A4</span>
                  <Printer className="h-4 w-4 text-or-600 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-base font-bold text-encre-950">Carnet PDF</h4>
                <p className="text-3xs text-encre-500 font-serif italic mt-0.5">Imprimer pour classeur</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="timbre px-2 py-0.5 text-3xs font-bold text-or-800">
                  Prêt à relier
                </span>
                <span className="text-3xs text-encre-700 font-semibold">Télécharger →</span>
              </div>
            </Link>

            {/* 7. La Boussole de Pèlerin : Mode Retraite */}
            <button
              type="button"
              onClick={() => setHorsLigneOuvert(true)}
              className="objet-table objet-boussole relative rounded-3xl p-4 sm:p-5 -rotate-2 flex flex-col justify-between text-left group text-parchemin-100"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-300/80">Pèlerinage</span>
                  <Compass className="h-4 w-4 text-or-300 group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <h4 className="manuscrit text-base font-bold text-parchemin-100">Mode Retraite</h4>
                <p className="text-3xs text-parchemin-200/70 font-serif italic mt-0.5">100% hors-ligne</p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-3xs text-or-300 font-medium">
                <span>Synchronisé</span>
                <span>Ouvrir 🧭</span>
              </div>
            </button>

            {/* 8. Le Parchemin & Sceau de Cire : Attestation */}
            <Link
              href="/certificat"
              className="objet-table objet-parchemin-sceau relative rounded-3xl p-4 sm:p-5 rotate-2 flex flex-col justify-between overflow-hidden group"
            >
              {/* Sceau de cire rouge officiel */}
              <div className="absolute top-3 right-4 h-6 w-6 rounded-full bg-gradient-to-br from-red-600 to-red-800 border border-amber-300/80 shadow-xs flex items-center justify-center text-amber-200 text-3xs font-bold group-hover:scale-110 transition-transform">
                ✓
              </div>
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-or-800 block mb-1">
                  Parchemin Scellé
                </span>
                <h4 className="manuscrit text-base font-bold text-encre-950">Attestation</h4>
                <p className="text-3xs text-encre-600 font-serif italic mt-0.5">Sceau de fin</p>
              </div>
              <div className="mt-4 pt-2 border-t border-parchemin-300 flex items-center justify-between text-3xs font-bold text-or-900">
                <span>20 Fondements</span>
                <span>Consulter →</span>
              </div>
            </Link>

            {/* 9. La Loupe d'Étude : Retrouver mes écrits */}
            <Link
              href="/recherche"
              className="objet-table relative rounded-3xl p-4 sm:p-5 -rotate-1 flex flex-col justify-between overflow-hidden group bg-[#faf6ee] border border-parchemin-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-700">Index & Notes</span>
                  <Search className="h-4 w-4 text-or-600 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-base font-bold text-encre-950">Mes Écrits</h4>
                <p className="text-3xs text-encre-500 font-serif italic mt-0.5">Rechercher mes notes</p>
              </div>
              <div className="mt-4 pt-2 border-t border-parchemin-300 flex items-center justify-between text-3xs text-encre-700 font-semibold">
                <span>Tout retrouver</span>
                <span>Chercher 🔍</span>
              </div>
            </Link>

            {/* 10. Le Tracé de Croissance : Mon chemin parcouru */}
            <Link
              href="/transformation"
              className="objet-table relative rounded-3xl p-4 sm:p-5 rotate-1 flex flex-col justify-between overflow-hidden group bg-[#f5f8f5] border border-emerald-200"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-emerald-800">Croissance</span>
                  <TrendingUp className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-base font-bold text-encre-950">Chemin Parcouru</h4>
                <p className="text-3xs text-emerald-700 font-serif italic mt-0.5">Transformation spirituelle</p>
              </div>
              <div className="mt-4 pt-2 border-t border-emerald-200 flex items-center justify-between text-3xs text-emerald-800 font-semibold">
                <span>Évolution</span>
                <span>Voir 📈</span>
              </div>
            </Link>

            {/* 11. Le Rayonnage Relié : Bibliothèque & Contact */}
            <Link
              href="/ressources"
              className="objet-table relative rounded-3xl p-4 sm:p-5 -rotate-2 flex flex-col justify-between overflow-hidden group bg-[#fbf6f0] border border-amber-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-amber-800">Ouvrages Clés</span>
                  <BookMarked className="h-4 w-4 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-base font-bold text-encre-950">Bibliothèque</h4>
                <p className="text-3xs text-encre-600 font-serif italic mt-0.5">Livres référencés</p>
              </div>
              <div className="mt-4 pt-2 border-t border-amber-200 flex items-center justify-between text-3xs text-amber-900 font-semibold">
                <span>Étude approfondie</span>
                <span>Ouvrir 📚</span>
              </div>
            </Link>

            {/* 12. Le Mémo Pastoral A4 : Guide des Cellules */}
            <Link
              href="/guide-pastoral"
              className="objet-table relative rounded-3xl p-4 sm:p-5 rotate-1 flex flex-col justify-between overflow-hidden group bg-or-50/80 border border-or-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-or-800">Accompagnement</span>
                  <Shield className="h-4 w-4 text-or-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="manuscrit text-base font-bold text-encre-950">Guide Pastoral</h4>
                <p className="text-3xs text-encre-600 font-serif italic mt-0.5">Prendre soin (A4)</p>
              </div>
              <div className="mt-4 pt-2 border-t border-or-200 flex items-center justify-between text-3xs text-or-900 font-semibold">
                <span>Prière en équipe</span>
                <span>Imprimer 🛡️</span>
              </div>
            </Link>
          </div>
        </section>

        <PauseSanctuaire ouvert={pauseOuverte} onFermer={() => setPauseOuverte(false)} />
        <TelechargementHorsLigne ouvert={horsLigneOuvert} onFermer={() => setHorsLigneOuvert(false)} />

        {/* ══ Journal Spirituel Récent (Cahier ouvert) ══ */}
        <div className="feuille feuille-dechiree relative rounded-3xl p-6 sm:p-8 shadow-md">
          <span className="punaise -top-2.5 left-10" />
          <span className="ruban -top-3 right-12 rotate-2 rounded-[2px]" />

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ModernIcon icon={PenLine} variant="amber" size="sm" />
              <div>
                <h2 className="font-serif text-lg font-bold text-encre-950">Feuillets du journal récent</h2>
                <p className="manuscrit text-sm text-encre-600">Vos notes et inspirations personnelles</p>
              </div>
            </div>
            <Link
              href="/journal"
              className="manuscrit text-sm font-bold text-or-800 hover:text-or-950 inline-flex items-center gap-1"
            >
              Ouvrir le carnet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {journal.length ? (
            <div className="space-y-3">
              {journal.map((entree) => (
                <div
                  key={entree.id}
                  className="rounded-2xl border border-encre-950/10 bg-parchemin-50/70 p-4 transition-colors hover:bg-parchemin-100/80"
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h4 className="manuscrit text-base font-bold text-encre-900">
                      {entree.title || 'Note personnelle'}
                    </h4>
                    <span className="flex shrink-0 items-center gap-1 text-2xs text-encre-400">
                      <Clock className="h-3 w-3" />
                      {timestampToDate(entree.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <p className="font-serif text-xs italic leading-relaxed text-encre-700 line-clamp-2">
                    « {entree.content} »
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-encre-950/15 py-8 text-center bg-white/40">
              <ModernIcon icon={PenLine} variant="slate" size="md" className="mx-auto mb-2" />
              <p className="manuscrit text-base font-bold text-encre-800">Le carnet est encore vierge</p>
              <p className="mx-auto mt-1 max-w-xs text-2xs leading-relaxed text-encre-600">
                Ce que vous notez pendant votre préparation personnelle éclaire souvent tout le groupe.
              </p>
              <Link
                href="/journal"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-encre-950 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-encre-900"
              >
                Écrire dans mon journal
              </Link>
            </div>
          )}
        </div>

        {isLeader && (
          <div className="feuille relative rounded-2xl p-4 shadow-sm border border-or-300/40 bg-or-50/60">
            <span className="punaise -top-2 left-6" />
            <p className="flex items-start gap-2.5 text-xs leading-relaxed text-or-950">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-or-600" />
              <span>
                <strong>Note d&apos;animateur :</strong> C&apos;est vous qui ouvrez et clôturez la rencontre de cellule. La clôture débloque automatiquement l&apos;étape suivante pour tous vos compagnons.
              </span>
            </p>
          </div>
        )}

        {/* Compte & Déconnexion (Accessible sur Mobile) */}
        <div className="feuille rounded-3xl p-5 shadow-xs border border-parchemin-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-or-100 font-serif font-bold text-or-800 text-base">
              {(user.displayName || user.email || 'D')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-bold text-encre-950 truncate">
                {user.displayName || 'Compte Disciple'}
              </p>
              <p className="text-2xs text-encre-500 truncate">{user.email || 'Mode connecté'}</p>
            </div>
          </div>

          <button
            onClick={() => void logout()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 px-4 py-2.5 text-xs font-bold text-rose-700 transition-colors shadow-xs active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function Etape({ faite, texte }: { faite: boolean; texte: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
          faite ? 'bg-emerald-500 text-white' : 'border border-encre-300'
        }`}
      >
        {faite && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className={`text-xs leading-relaxed ${faite ? 'text-encre-400 line-through' : 'text-encre-800'}`}>
        {texte}
      </span>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate>
      <DashboardContent />
    </ParcoursGate>
  );
}

