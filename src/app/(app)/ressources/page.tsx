'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HeartHandshake,
  Quote,
  ScrollText,
  MessageSquareHeart,
  Send,
  CheckCircle2,
  BookOpen,
  Library,
  Layers,
  Search,
  ChevronRight,
  Mail,
  HelpCircle,
  Printer,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';
import { chargerLivret, type Bloc, type Livret } from '@/lib/livret';
import { useAuth } from '@/lib/AuthContext';
import { hasRemoteBackend } from '@/lib/parcoursStore';
import { getFirebaseDb } from '@/lib/firebase';

type Onglet = 'presentation' | 'prendre-soin' | 'bibliographie' | 'retours';

interface LivreVisual {
  id: string;
  auteur: string | null;
  titreCourt: string;
  ouvrages: string;
  note: string;
  couleurCuir: string;
  couleurBordure: string;
  couleurFers: string;
  fiches: number[];
}

const LIVRES_BIBLIOTHEQUE: LivreVisual[] = [
  {
    id: 'anderson',
    auteur: 'Neil Anderson',
    titreCourt: 'Une Nouvelle identité',
    ouvrages: 'Une Nouvelle identité pour une nouvelle vie (fiches 5, 6, 7, 9, 14).',
    note: "Sur la délivrance des mensonges intérieurs et la marche concrète dans l'identité d'enfant de Dieu.",
    couleurCuir: 'from-[#4a121e] to-[#2d0a12]',
    couleurBordure: 'border-[#b8860b]/60',
    couleurFers: 'text-[#ffd700]',
    fiches: [5, 6, 7, 9, 14],
  },
  {
    id: 'prince',
    auteur: 'Derek Prince',
    titreCourt: "L'Échange divin & L'Esprit",
    ouvrages: "L'échange divin (fiche 5). Comment passer de la malédiction à la bénédiction (fiche 8). Qui est le Saint-Esprit ? ; Le Saint-Esprit, oui mais... ; Les dons de l'Esprit, le fruit de l'Esprit (fiches 9, 10, 11).",
    note: "Des enseignements clairs et pratiques : la puissance de la croix, les malédictions brisées, le ministère de l'Esprit.",
    couleurCuir: 'from-[#14233c] to-[#091322]',
    couleurBordure: 'border-[#c5a059]/60',
    couleurFers: 'text-[#f5d77f]',
    fiches: [5, 8, 9, 10, 11],
  },
  {
    id: 'nee',
    auteur: 'Watchman Nee',
    titreCourt: 'Assis, Marcher, Tenir ferme',
    ouvrages: 'Être assis, marcher, tenir ferme (fiches 5, 6, 9, 11, 16).',
    note: "Un commentaire classique de l'épître aux Éphésiens : la position en Christ, la marche, le combat spirituel.",
    couleurCuir: 'from-[#173829] to-[#0c1f17]',
    couleurBordure: 'border-[#d4af37]/60',
    couleurFers: 'text-[#f3e5ab]',
    fiches: [5, 6, 9, 11, 16],
  },
  {
    id: 'wommack',
    auteur: 'Andrew Wommack',
    titreCourt: 'La Grâce et la Foi',
    ouvrages: "La vraie nature de Dieu (fiche 18). L'équilibre entre la grâce et la foi (fiches 3 et 16). Esprit, âme et corps (fiche 20).",
    note: "La bonté inconditionnelle de Dieu, l'équilibre entre la foi et la grâce, et la constitution tripartite de l'être humain.",
    couleurCuir: 'from-[#543015] to-[#2c1708]',
    couleurBordure: 'border-[#e6ca65]/60',
    couleurFers: 'text-[#ffe899]',
    fiches: [3, 16, 18, 20],
  },
  {
    id: 'chester',
    auteur: 'Tm Chester, Steve Timmis',
    titreCourt: 'Total Church',
    ouvrages: "Total Church (fiches 13, 14, 15).",
    note: "Une vision de l'Église centrée sur l'Évangile et vécue au quotidien, en communauté relationnelle de maison.",
    couleurCuir: 'from-[#203243] to-[#101b24]',
    couleurBordure: 'border-[#c4b58a]/60',
    couleurFers: 'text-[#ede3c2]',
    fiches: [13, 14, 15],
  },
  {
    id: 'dye',
    auteur: 'Colin Dye',
    titreCourt: 'Vivre libre',
    ouvrages: 'Vivre libre (fiches 5, 6, 7, 8).',
    note: "Un guide pratique pour sortir des blessures du passé, du rejet et renverser les forteresses de pensée.",
    couleurCuir: 'from-[#422218] to-[#24110b]',
    couleurBordure: 'border-[#d99b26]/60',
    couleurFers: 'text-[#fedb74]',
    fiches: [5, 6, 7, 8],
  },
  {
    id: 'heidler',
    auteur: 'Robert Heidler',
    titreCourt: "L'Église messianique",
    ouvrages: "L'Église messianique se lève (fiches 18, 19, 20).",
    note: "Les racines hébraïques de la foi chrétienne, l'alliance éternelle avec Israël et le dessein de Dieu pour la fin des temps.",
    couleurCuir: 'from-[#37193b] to-[#1c0c1e]',
    couleurBordure: 'border-[#e0b0ff]/50',
    couleurFers: 'text-[#f5d9ff]',
    fiches: [18, 19, 20],
  },
  {
    id: 'bevere',
    auteur: 'John Bevere',
    titreCourt: 'Briser l’intimidation',
    ouvrages: "Briser l'intimidation (fiche 7) ; Approchez-vous de lui (fiches 1, 9, 11).",
    note: "Vaincre la peur des hommes et le contrôle pour retrouver une sainte intimité et autorité avec Dieu.",
    couleurCuir: 'from-[#501323] to-[#290710]',
    couleurBordure: 'border-[#e89090]/60',
    couleurFers: 'text-[#ffd0d0]',
    fiches: [1, 7, 9, 11],
  },
  {
    id: 'johnson',
    auteur: 'Bill Johnson',
    titreCourt: 'Quand le Ciel envahit la terre',
    ouvrages: 'Quand le ciel envahit la terre (fiches 11, 12, 14).',
    note: "La réalité du Royaume de Dieu manifesté ici-bas : marcher dans le surnaturel d'amour au quotidien.",
    couleurCuir: 'from-[#122b44] to-[#081523]',
    couleurBordure: 'border-[#8fc5ff]/60',
    couleurFers: 'text-[#d6ebff]',
    fiches: [11, 12, 14],
  },
  {
    id: 'mcvey',
    auteur: 'Steve McVey',
    titreCourt: 'Le Règne de la Grâce',
    ouvrages: 'Le Règne de la Grâce (fiche 4)',
    note: 'Sortir de la religion de la culpabilité et de la performance pour se reposer dans un amour qui ne se mérite pas.',
    couleurCuir: 'from-[#1b3d2b] to-[#0e2217]',
    couleurBordure: 'border-[#92d392]/60',
    couleurFers: 'text-[#d8ffd8]',
    fiches: [4],
  },
  {
    id: 'eldredge',
    auteur: 'John Eldredge',
    titreCourt: 'Les Trésors du cœur',
    ouvrages: 'Les trésors du cœur (fiche 4)',
    note: 'Retrouver les désirs profonds, la liberté et la passion que Dieu a placés dans le cœur de ses enfants.',
    couleurCuir: 'from-[#3c1d10] to-[#1f0d06]',
    couleurBordure: 'border-[#df9e66]/60',
    couleurFers: 'text-[#ffe0c2]',
    fiches: [4],
  },
  {
    id: 'virgo',
    auteur: 'Terry Virgo',
    titreCourt: "L'Extravagante Grâce",
    ouvrages: "L'extravagante grâce de Dieu (fiche 4)",
    note: 'La grâce souveraine qui transforme le devoir légaliste et lourd en une adoration joyeuse et filiale.',
    couleurCuir: 'from-[#1d2744] to-[#0c1223]',
    couleurBordure: 'border-[#a3b8ff]/60',
    couleurFers: 'text-[#e0e7ff]',
    fiches: [4],
  },
  {
    id: 'hagin',
    auteur: 'Kenneth E. Hagin',
    titreCourt: 'La Nouvelle Naissance',
    ouvrages: 'La nouvelle naissance (fiche 3).',
    note: "Ce qui se passe réellement dans l'esprit humain à la nouvelle naissance : passer de la mort à la vie divine.",
    couleurCuir: 'from-[#42172d] to-[#210915]',
    couleurBordure: 'border-[#e293be]/60',
    couleurFers: 'text-[#ffd3ea]',
    fiches: [3],
  },
  {
    id: 'venditti',
    auteur: 'Nicolas et Lena Venditti',
    titreCourt: 'INSTE — Formation de Disciples',
    ouvrages: 'INSTE (fiches 16, 17, 20).',
    note: "Une méthode d'étude biblique interactive et d'enracinement théologique, pensée pour les petits groupes.",
    couleurCuir: 'from-[#372418] to-[#1d110a]',
    couleurBordure: 'border-[#c49a6c]/60',
    couleurFers: 'text-[#f5dec4]',
    fiches: [16, 17, 20],
  },
  {
    id: 'hameau',
    auteur: 'Dany Hameau',
    titreCourt: 'Vue sur l’Enfer & Espérance',
    ouvrages: 'Vue sur l’enfer (fiche 20).',
    note: "Une étude biblique rigoureuse sur les fins dernières, le jugement, l'éternité et l’espérance glorieuse du croyant.",
    couleurCuir: 'from-[#27282c] to-[#121315]',
    couleurBordure: 'border-[#a8a8a8]/60',
    couleurFers: 'text-[#e8e8e8]',
    fiches: [20],
  },
  {
    id: 'dictionnaire-emmaus',
    auteur: 'Dictionnaire Biblique',
    titreCourt: 'Nouveau Dictionnaire Emmaüs',
    ouvrages: 'Nouveau Dictionnaire biblique Emmaüs (fiches 3, 18).',
    note: 'Ouvrage de référence encyclopédique pour l’approfondissement des termes bibliques et des contextes d’alliance.',
    couleurCuir: 'from-[#581818] to-[#2e0909]',
    couleurBordure: 'border-[#e09292]/60',
    couleurFers: 'text-[#ffcccc]',
    fiches: [3, 18],
  },
];

export default function RessourcesPage() {
  const { user } = useAuth();
  const [livret, setLivret] = useState<Livret | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('presentation');

  // Bibliothèque state
  const [modeVue, setModeVue] = useState<'rayonnage' | 'table'>('table');
  const [livreSelectionne, setLivreSelectionne] = useState<LivreVisual | null>(null);
  const [filtreRecherche, setFiltreRecherche] = useState('');

  // Retours & Besoins Form state
  const [categorie, setCategorie] = useState<'suggestion' | 'temoignage' | 'aide' | 'theologie'>('suggestion');
  const [nom, setNom] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageEnvoye, setMessageEnvoye] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');

  useEffect(() => {
    void chargerLivret().then(setLivret);
  }, []);

  // Les champs se pré-remplissent à l'affichage plutôt que par un effet :
  // recopier `user` dans l'état déclenchait un rendu en cascade, et écrasait
  // ce que la personne venait de taper si `user` changeait entre-temps.
  const nomAffiche = nom || user?.displayName || '';
  const emailAffiche = email || user?.email || '';

  const onglets: { id: Onglet; label: string; icon: typeof ScrollText }[] = [
    { id: 'presentation', label: 'Mode d’emploi', icon: ScrollText },
    { id: 'prendre-soin', label: 'Prendre soin les uns des autres', icon: HeartHandshake },
    { id: 'bibliographie', label: 'Bibliothèque d’Étude', icon: Library },
    { id: 'retours', label: 'Retours & Besoins (Nous écrire)', icon: MessageSquareHeart },
  ];

  const livresFiltres = LIVRES_BIBLIOTHEQUE.filter((l) => {
    if (!filtreRecherche.trim()) return true;
    const q = filtreRecherche.toLowerCase();
    return (
      (l.auteur && l.auteur.toLowerCase().includes(q)) ||
      l.titreCourt.toLowerCase().includes(q) ||
      l.ouvrages.toLowerCase().includes(q) ||
      l.note.toLowerCase().includes(q) ||
      l.fiches.some((f) => f.toString() === q.replace('fiche', '').trim())
    );
  });

  const envoyerRetour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (message.trim().length > 5000) { setErreurEnvoi('Votre message dépasse 5 000 caractères. Raccourcissez-le avant l’envoi.'); return; }

    if (envoiEnCours) return;
    setEnvoiEnCours(true); setErreurEnvoi('');
    const retourData = {
      uid: user?.uid || null,
      nom: nomAffiche.trim().slice(0, 120) || 'Ami des Fondements',
      email: emailAffiche.trim().slice(0, 254) || 'Non renseigné',
      categorie, message: message.trim().slice(0, 5000),
      date: Date.now(), dateIso: new Date().toISOString(),
    };
    try {
      if (!hasRemoteBackend()) {
        setErreurEnvoi('L’envoi à l’équipe est indisponible dans cette version locale. Votre texte reste dans le formulaire ; copiez-le avant de quitter.');
        return;
      }
      const [db, { collection, addDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')]);
      await addDoc(collection(db, 'retours'), retourData);
      setMessageEnvoye(true); setMessage('');
    } catch {
      setErreurEnvoi('L’envoi n’a pas été confirmé. Votre texte reste ici. Vérifiez votre connexion avant de réessayer.');
    } finally { setEnvoiEnCours(false); }
  };

  return (
    <div className="table-travail min-h-screen pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* En-tête */}
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">
            Documentation, bibliothèque & dialogue fraternel
          </p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">
            Ressources des Fondements
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-encre-600 sm:text-sm">
            La vision originelle du parcours, le guide pastoral pour votre cellule, les ouvrages de référence reliés et l&apos;espace pour nous écrire.
          </p>
        </div>

        {/* Navigation des Onglets */}
        <div className="mb-8 flex gap-1.5 overflow-x-auto border-b border-parchemin-300 pb-px scrollbar-none">
          {onglets.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                onglet === tab.id
                  ? 'border-or-600 text-or-800 bg-amber-50/60 rounded-t-xl'
                  : 'border-transparent text-encre-500 hover:text-encre-800 hover:bg-parchemin-100/50'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {!livret ? (
          <p className="animate-pulse text-center font-serif text-sm text-encre-400 py-16">
            Ouverture du livret…
          </p>
        ) : onglet === 'presentation' ? (
          /* ══ ONGLET 1 : MODE D'EMPLOI ══ */
          <div className="feuille relative space-y-8 rounded-3xl border border-parchemin-300 p-6 sm:p-10 shadow-md">
            <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />
            <span className="ruban -top-2.5 right-8 rotate-1 rounded-[2px]" />

            <blockquote className="rounded-3xl border border-or-300 bg-amber-50/70 p-6 text-center shadow-xs">
              <Quote className="mx-auto h-5 w-5 text-or-600" strokeWidth={1.5} />
              <p className="mt-3 font-serif text-base italic leading-relaxed text-encre-900">
                « Notre but est de placer tout homme en présence de Dieu et d&apos;amener les
                chrétiens à leur pleine maturité spirituelle par une communion vivante avec le
                Christ. »
              </p>
              <span className="manuscrit mt-2 block text-base text-or-800">Colossiens 1:28</span>
            </blockquote>

            {livret.presentation.map((section, index) => (
              <section key={index} className="pt-2">
                {section.titre && (
                  <h2 className="mb-4 flex items-baseline gap-3 font-serif text-xl font-bold text-encre-950 border-b border-parchemin-200 pb-2">
                    <span className="text-sm text-or-600 font-sans">•</span>
                    {section.titre}
                  </h2>
                )}
                <div className="prose-livret text-sm text-encre-700 leading-relaxed">
                  {section.blocs.map((bloc, i) => (
                    <RenduBloc key={i} bloc={bloc} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : onglet === 'prendre-soin' ? (
          /* ══ ONGLET 2 : PRENDRE SOIN LES UNS DES AUTRES ══ */
          <div className="feuille relative space-y-8 rounded-3xl border border-parchemin-300 p-6 sm:p-10 shadow-md">
            <span className="punaise -top-2.5 left-8" />
            <span className="ruban -top-2.5 right-8 -rotate-1 rounded-[2px]" />

            <div className="rounded-2xl border border-or-300 bg-amber-50/90 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-or-900 font-bold text-sm">
                <HeartHandshake className="h-4 w-4 text-or-700" />
                Guide pastoral des cellules de partage
              </div>
              <p className="text-xs leading-relaxed text-or-950">
                Cette annexe accompagne particulièrement les fiches 7, 8 et 15. Le livret la donne aux responsables
                avant les temps de prière personnels — mais elle concerne la vie et l&apos;amour fraternel de tout le groupe.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/guide-pastoral"
                  target="_blank"
                  className="timbre inline-flex items-center gap-1.5 rounded-lg bg-or-300 px-3.5 py-1.5 text-2xs font-bold text-or-950 hover:bg-or-400 transition-colors shadow-2xs"
                >
                  <Printer className="h-3 w-3" />
                  Imprimer la Fiche Bible (A4)
                </Link>
                {[7, 8, 15].map((id) => (
                  <Link
                    key={id}
                    href={`/fiches/${id}`}
                    className="timbre rounded-lg px-3 py-1.5 text-2xs font-bold text-or-900 hover:bg-or-200 transition-colors shadow-2xs"
                  >
                    Ouvrir Fiche {id}
                  </Link>
                ))}
              </div>
            </div>

            {livret.annexeTransversale.sections.map((section, index) => (
              <section key={index} className="pt-2">
                {section.titre && (
                  <h2 className="mb-4 flex items-baseline gap-3 font-serif text-xl font-bold text-encre-950 border-b border-parchemin-200 pb-2">
                    <span className="text-sm text-or-600 font-sans">•</span>
                    {section.titre}
                  </h2>
                )}
                <div className="prose-livret text-sm text-encre-700 leading-relaxed">
                  {section.blocs.map((bloc, i) => (
                    <RenduBloc key={i} bloc={bloc} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : onglet === 'bibliographie' ? (
          /* ══ ONGLET 3 : LA BIBLIOTHÈQUE D'ÉTUDE RELIÉE ══ */
          <div className="space-y-6">
            
            {/* Barre d'outils de la Bibliothèque */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-parchemin-300 bg-white/80 p-4 shadow-sm backdrop-blur-md">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-encre-400" />
                <input
                  type="text"
                  placeholder="Chercher un auteur, titre, fiche..."
                  value={filtreRecherche}
                  onChange={(e) => setFiltreRecherche(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-parchemin-300 bg-parchemin-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-or-400 text-encre-900 placeholder:text-encre-400"
                />
              </div>

              {/* Sélecteur de Vue : Rayonnage vs Table */}
              <div className="flex items-center gap-1 rounded-2xl bg-parchemin-200/80 p-1 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setModeVue('table')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-2xs font-bold transition-all ${
                    modeVue === 'table'
                      ? 'bg-encre-950 text-parchemin-100 shadow-xs'
                      : 'text-encre-600 hover:text-encre-900'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Couvertures
                </button>
                <button
                  type="button"
                  onClick={() => setModeVue('rayonnage')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-2xs font-bold transition-all ${
                    modeVue === 'rayonnage'
                      ? 'bg-encre-950 text-parchemin-100 shadow-xs'
                      : 'text-encre-600 hover:text-encre-900'
                  }`}
                >
                  <Library className="h-3.5 w-3.5" />
                  Rayonnage 3D
                </button>
              </div>
            </div>

            {/* VUE 1 : RAYONNAGE 3D DE LIVRES EN BOIS DE CHÊNE */}
            {modeVue === 'rayonnage' ? (
              <div className="rounded-3xl border-4 border-[#3c2514] bg-[#1a0e07] p-6 shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a1d0d]/40 via-transparent to-black pointer-events-none" />
                
                <div className="mb-4 flex items-center justify-between border-b border-amber-900/40 pb-2 relative z-10">
                  <span className="font-serif italic text-xs text-amber-200/70">
                    Bibliothèque des principaux ouvrages référencés dans le parcours
                  </span>
                  <span className="text-3xs font-bold uppercase tracking-widest text-amber-400/80">
                    Bibliothèque du Disciple
                  </span>
                </div>

                {/* Étagère avec tranche des livres */}
                <div className="pt-8 pb-3 px-2 flex items-end gap-2 sm:gap-3 overflow-x-auto scrollbar-thin relative z-10 min-h-[300px]">
                  {livresFiltres.map((livre) => (
                    <button
                      key={livre.id}
                      type="button"
                      onClick={() => setLivreSelectionne(livre)}
                      className={`group relative flex-shrink-0 w-11 sm:w-14 h-56 sm:h-64 rounded-t-sm transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-4 hover:shadow-2xl bg-gradient-to-r ${
                        livre.couleurCuir
                      } border-t-2 border-r border-l ${livre.couleurBordure} flex flex-col justify-between py-3 items-center`}
                    >
                      {/* Nervures de reliure dorées */}
                      <span className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent block" />
                      
                      {/* Titre vertical le long du dos */}
                      <span
                        className={`font-serif text-3xs sm:text-2xs font-bold tracking-wider ${livre.couleurFers} uppercase [writing-mode:vertical-rl] rotate-180 truncate max-h-40 group-hover:brightness-125`}
                      >
                        {livre.titreCourt}
                      </span>

                      {/* Nervure basse et auteur */}
                      <div className="w-full flex flex-col items-center gap-1">
                        <span className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent block" />
                        <span className="text-[9px] font-mono text-amber-200/50 truncate w-full px-1 text-center">
                          {livre.auteur?.split(' ')[0] || 'Emmaüs'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Planche de bois de l'étagère */}
                <div className="h-5 w-full rounded-sm bg-gradient-to-b from-[#5a3619] via-[#3a200d] to-[#1c0d04] border-t border-amber-500/30 shadow-md relative z-20" />
                <div className="h-3 w-full bg-black/60 shadow-inner" />
              </div>
            ) : (
              /* VUE 2 : TABLE D'ÉTUDE AVEC COUVERTURES RELIÉES */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {livresFiltres.map((livre) => (
                  <article
                    key={livre.id}
                    onClick={() => setLivreSelectionne(livre)}
                    className={`group relative rounded-3xl p-6 sm:p-7 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br ${livre.couleurCuir} border-2 ${livre.couleurBordure} text-parchemin-100 overflow-hidden`}
                  >
                    {/* Ruban marque-page satiné */}
                    <span className="absolute right-6 -top-1 w-5 h-12 bg-red-700/80 shadow-md rounded-b-sm border-x border-red-500/40 pointer-events-none" />

                    {/* Cadre ornemental doré */}
                    <div className="border border-white/15 rounded-2xl p-5 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-3">
                          <span className="text-3xs font-mono tracking-wider uppercase text-amber-200/70 font-bold">
                            Ouvrage Référencé
                          </span>
                          <span className="text-3xs font-serif italic text-white/50">
                            {livre.fiches.length > 0 ? `${livre.fiches.length} fiches` : 'Général'}
                          </span>
                        </div>

                        {livre.auteur && (
                          <p className="font-serif text-sm font-semibold tracking-wide text-amber-300/90">
                            {livre.auteur}
                          </p>
                        )}
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug mt-1 group-hover:text-amber-200 transition-colors">
                          « {livre.titreCourt} »
                        </h3>
                        
                        <p className="mt-3 text-xs leading-relaxed text-parchemin-100/80 line-clamp-3">
                          {livre.note}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {livre.fiches.slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-white/15 px-2 py-0.5 text-3xs font-bold text-amber-200 border border-white/10"
                            >
                              Fiche {f}
                            </span>
                          ))}
                          {livre.fiches.length > 4 && (
                            <span className="text-3xs text-white/50 self-center">
                              +{livre.fiches.length - 4}
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform">
                          Consulter <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* MODAL / FEUILLE D'ÉTUDE DU LIVRE SÉLECTIONNÉ */}
            {livreSelectionne && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={() => setLivreSelectionne(null)}
              >
                <div
                  className={`relative max-w-lg w-full rounded-3xl p-7 sm:p-9 shadow-2xl bg-gradient-to-br ${livreSelectionne.couleurCuir} border-2 ${livreSelectionne.couleurBordure} text-parchemin-100`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setLivreSelectionne(null)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white transition-colors"
                  >
                    ✕
                  </button>

                  <div className="border border-white/15 rounded-2xl p-6">
                    <span className="text-3xs uppercase font-bold tracking-widest text-amber-300/80 block mb-1">
                      Fiche de Lecture & Citation
                    </span>
                    {livreSelectionne.auteur && (
                      <h4 className="font-serif text-base text-amber-200">
                        {livreSelectionne.auteur}
                      </h4>
                    )}
                    <h3 className="font-serif text-2xl font-bold text-white mt-1 mb-4">
                      {livreSelectionne.titreCourt}
                    </h3>

                    <div className="space-y-3 text-xs leading-relaxed text-parchemin-100/90 bg-black/20 p-4 rounded-xl border border-white/10">
                      <p className="italic text-amber-100/90 font-serif">
                        « {livreSelectionne.ouvrages} »
                      </p>
                      <p className="text-parchemin-100/80">
                        {livreSelectionne.note}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-2xs font-bold uppercase tracking-wider text-amber-300/90 mb-2">
                        Fiches du parcours s&apos;appuyant sur cet ouvrage :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {livreSelectionne.fiches.map((id) => (
                          <Link
                            key={id}
                            href={`/fiches/${id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-encre-950 px-3 py-1 text-xs font-bold hover:bg-amber-300 transition-colors shadow-sm"
                          >
                            <BookOpen className="h-3 w-3" /> Fiche {id}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-parchemin-300/80 bg-white/70 p-5 text-xs leading-relaxed text-encre-700 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-serif font-bold text-encre-950 mb-1">
                  À propos des sources & traductions :
                </p>
                <p className="text-2xs text-encre-600">
                  Le livret est librement téléchargeable en version PDF originale. Les versets bibliques y sont tirés de la Bible du Semeur (BDS), sauf mention contraire.
                </p>
              </div>
              <a
                href="https://leparcoursdesfondements.files.wordpress.com/2012/01/livret-vf-12-03-2015.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-or-500 bg-amber-50 px-4 py-2 text-2xs font-bold text-or-950 hover:bg-or-100 transition-colors shadow-2xs"
              >
                Ouvrir le Livret PDF original ↗
              </a>
            </div>
          </div>
        ) : (
          /* ══ ONGLET 4 : RETOURS & BESOINS (NOUS ÉCRIRE) ══ */
          <div className="feuille relative space-y-8 rounded-3xl border border-parchemin-300 p-6 sm:p-10 shadow-md">
            <span className="punaise-rouge -top-3 left-10" />
            <span className="ruban -top-2.5 right-8 -rotate-1 rounded-[2px]" />

            <div className="border-b border-parchemin-300 pb-5">
              <span className="text-3xs font-bold uppercase tracking-widest text-or-800">
                Dialogue, Écoute & Suggestions
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-encre-950">
                Les retours et besoins
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-encre-700">
                « Nous recevrons avec plaisir vos retours d&apos;expérience et suggestions. Nous sommes disponibles également pour toute forme d&apos;aide ou de conseils vous permettant de tirer le meilleur parti de ce parcours. »
              </p>
            </div>

            {messageEnvoye ? (
              <div className="rounded-3xl border border-emerald-300 bg-emerald-50/90 p-7 text-center shadow-xs animate-fade-in">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-3" />
                <h3 className="font-serif text-xl font-bold text-emerald-950">
                  Votre message a été transmis avec joie !
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-emerald-800">
                  Merci pour votre cœur, votre investissement dans le discipulat et votre précieux retour d&apos;expérience. L&apos;équipe vous répondra avec attention.
                </p>
                <button
                  type="button"
                  onClick={() => setMessageEnvoye(false)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={envoyerRetour} className="space-y-6">
                {erreurEnvoi && <p role="alert" className="rounded-xl border border-or-400 bg-or-50 p-4 text-sm text-encre-900">{erreurEnvoi}</p>}
                {/* Choix du type de retour */}
                <div>
                  <label className="block text-xs font-bold text-encre-900 mb-2">
                    De quoi s&apos;agit-il ?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'suggestion',
                        label: 'Suggestion d’amélioration',
                        icon: Lightbulb,
                        desc: 'Une idée ou proposition pour enrichir l’outil',
                      },
                      {
                        id: 'temoignage',
                        label: 'Retour d’expérience / Témoignage',
                        icon: MessageCircle,
                        desc: 'Comment votre cellule ou groupe vit le parcours',
                      },
                      {
                        id: 'aide',
                        label: 'Demande d’aide ou conseil d’animation',
                        icon: HelpCircle,
                        desc: 'Besoin d’un accompagnement pour animer',
                      },
                      {
                        id: 'theologie',
                        label: 'Question théologique ou coquille',
                        icon: BookOpen,
                        desc: 'Une précision sur un verset ou une fiche',
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategorie(item.id as typeof categorie)}
                        className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                          categorie === item.id
                            ? 'border-or-600 bg-amber-50/90 shadow-2xs ring-1 ring-or-500'
                            : 'border-parchemin-300 bg-white/60 hover:bg-white hover:border-parchemin-400'
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            categorie === item.id ? 'text-or-700' : 'text-encre-400'
                          }`}
                        />
                        <div>
                          <p className="text-xs font-bold text-encre-950">{item.label}</p>
                          <p className="text-3xs text-encre-600 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Informations de contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1.5">
                      Votre prénom / nom
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Samuel M."
                      value={nomAffiche}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-parchemin-300 bg-white focus:outline-none focus:ring-2 focus:ring-or-400 text-encre-900"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1.5">
                      Votre adresse e-mail (pour vous répondre)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="samuel@exemple.com"
                      value={emailAffiche}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-parchemin-300 bg-white focus:outline-none focus:ring-2 focus:ring-or-400 text-encre-900"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-encre-700 mb-1.5">
                    Votre message ou retour d&apos;expérience
                  </label>
                  <textarea
                    maxLength={5000}
                    required
                    rows={5}
                    placeholder="Partagez vos impressions, vos questions ou vos besoins d'animation pour votre cellule..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-parchemin-300 bg-white focus:outline-none focus:ring-2 focus:ring-or-400 text-encre-900 leading-relaxed placeholder:text-encre-400"
                  />
                </div>

                {/* Bouton d'envoi */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-2xs text-encre-600">
                    <Mail className="h-3.5 w-3.5 text-or-700" />
                    <span>Retour concernant le Parcours des Fondements · Fonction expérimentale de cette adaptation numérique</span>
                  </div>

                  <button
                    type="submit"
                    disabled={envoiEnCours || !message.trim()}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-3 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {envoiEnCours ? (
                      'Transmission en cours…'
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Envoyer mon message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Bloc d'information complémentaire */}
            <div className="rounded-2xl border border-or-300/80 bg-amber-50/60 p-5 text-xs leading-relaxed text-encre-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-encre-950">
                  Télécharger le livret original (PDF)
                </p>
                <p className="text-2xs text-encre-600 mt-0.5">
                  Livret complet original (édition 2015) mis à disposition sur le portail moneglisepreferee.net
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://leparcoursdesfondements.files.wordpress.com/2012/01/livret-vf-12-03-2015.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-or-600 bg-or-400 text-encre-950 px-4 py-2 text-2xs font-bold hover:bg-or-300 transition-colors shadow-2xs"
                >
                  Télécharger le Livret PDF ↗
                </a>
                <a
                  href="https://moneglisepreferee.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-parchemin-300 bg-white px-4 py-2 text-2xs font-bold text-encre-800 hover:bg-parchemin-50 transition-colors shadow-2xs"
                >
                  Visiter moneglisepreferee.net ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RenduBloc({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case 'sous-titre':
      return <h4 className="font-serif font-bold text-encre-950 text-base mt-4 mb-2">{bloc.texte}</h4>;
    case 'citation':
      return (
        <blockquote className="my-3 border-l-3 border-or-500 pl-4 py-1 italic font-serif text-encre-900 bg-amber-50/30 rounded-r-lg">
          {bloc.texte}
        </blockquote>
      );
    case 'encadre':
      return (
        <div className="my-4 rounded-2xl border border-or-300 bg-amber-50/70 p-4 text-sm font-medium text-encre-900 shadow-2xs">
          {bloc.texte}
        </div>
      );
    case 'liste': {
      const items = bloc.texte
        .split(/(?=^|\s)-\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return (
        <ul className="my-3 space-y-1.5 pl-4 list-disc marker:text-or-600">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    case 'aparte':
      return (
        <p className="my-3 rounded-xl border border-or-300 bg-amber-50/90 px-4 py-2.5 text-xs italic text-or-900">
          {bloc.texte.replace(/^>\s*/, '')}
        </p>
      );
    default:
      return <p className="my-2 leading-relaxed">{bloc.texte}</p>;
  }
}
