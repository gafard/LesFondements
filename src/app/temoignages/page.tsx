'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Heart,
  Plus,
  X,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Wand2,
  Loader2,
  Check,
  Trash2,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  abonnerTemoignages,
  publierTemoignage as publierDistant,
  supprimerTemoignage as supprimerDistant,
  voterAmen as voterAmenDistant,
  reinitialiserTableauLocal,
  TEMOIGNAGES_INITIAUX,
  type TemoignageItem,
} from '@/lib/temoignagesStore';
import { useAuth } from '@/lib/AuthContext';
import { jetonFirebase } from '@/lib/firebase';
import { FICHES_META } from '@/data/fichesMeta';
import { lireAVoixHaute, lectureDisponible } from '@/lib/ambiance';

/**
 * La reconnaissance vocale du navigateur n'est pas standardisée : elle vit
 * sous deux noms et n'a pas de types fournis. On décrit ici le peu qu'on en
 * utilise, plutôt que de laisser `any` masquer une faute de frappe sur un
 * nom de propriété.
 */
interface ResultatDicte {
  readonly length: number;
  [index: number]: { readonly 0: { readonly transcript: string } };
}

interface MoteurDictee {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evenement: { results: ResultatDicte }) => void) | null;
  start: () => void;
  stop: () => void;
}

type FenetreAvecDictee = Window & {
  SpeechRecognition?: new () => MoteurDictee;
  webkitSpeechRecognition?: new () => MoteurDictee;
};

export default function TemoignagesPage() {
  const { user } = useAuth();
  const [temoignages, setTemoignages] = useState<TemoignageItem[]>(TEMOIGNAGES_INITIAUX);
  const [temoignageActif, setTemoignageActif] = useState<TemoignageItem>(TEMOIGNAGES_INITIAUX[0]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [modalConnexion, setModalConnexion] = useState(false);
  const [ficheSelectionnee, setFicheSelectionnee] = useState<number>(1);
  const [texteTemoignage, setTexteTemoignage] = useState('');
  const [couleurChoisie, setCouleurChoisie] = useState<'rose' | 'jaune' | 'vert' | 'blanc' | 'orange'>('rose');
  const [enEnregistrement, setEnEnregistrement] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [soucisPartage, setSoucisPartage] = useState<string | null>(null);
  const [audioEnLecture, setAudioEnLecture] = useState<string | null>(null);
  const [enPublication, setEnPublication] = useState(false);
  const [enTranscription, setEnTranscription] = useState(false);
  const [messageTranscription, setMessageTranscription] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioFichierRef = useRef<Blob | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<MoteurDictee | null>(null);

  // ── Synchronisation Temps Réel (Cloud Firestore + Cache Local) ──
  useEffect(() => {
    const desabonner = abonnerTemoignages(user?.uid, (nouvelleListe) => {
      setTemoignages(nouvelleListe);
      setTemoignageActif((actuel) => {
        const toujoursExistant = nouvelleListe.find((t) => t.id === actuel?.id);
        return toujoursExistant || nouvelleListe[0] || TEMOIGNAGES_INITIAUX[0];
      });
    });

    return () => desabonner();
  }, [user?.uid]);

  // ── Mettre la voix par écrit ──
  // Le nom du fournisseur et celui du modèle n'ont rien à faire dans
  // l'interface : ce qui compte pour la personne, c'est que ce qu'elle vient
  // de dire s'écrive. Le « comment » reste ici, dans le code.
  const mettreParEcrit = async (blob: Blob) => {
    try {
      setEnTranscription(true);
      setMessageTranscription('On met vos mots par écrit…');
      const formData = new FormData();
      formData.append('file', blob, 'temoignage.webm');

      const jeton = await jetonFirebase();
      const reponse = await fetch('/api/temoignages/transcription', {
        method: 'POST',
        headers: jeton ? { Authorization: `Bearer ${jeton}` } : undefined,
        body: formData,
      });

      if (reponse.ok) {
        const data = (await reponse.json()) as { text?: string };
        if (data.text?.trim()) {
          setTexteTemoignage((prev) => (prev.trim() ? `${prev} ${data.text}` : data.text || ''));
          setMessageTranscription('Vos paroles sont écrites — relisez-les avant de publier.');
        }
      } else {
        // Le refus était avalé : le bouton semblait ne rien faire du tout.
        const detail = (await reponse.json().catch(() => null)) as { error?: string } | null;
        setMessageTranscription(
          reponse.status === 503
            ? 'La mise par écrit n’est pas encore activée sur ce serveur.'
            : detail?.error ?? 'Vos mots n’ont pas pu être écrits. Votre voix, elle, est bien gardée.'
        );
      }
    } catch {
      setMessageTranscription('La mise par écrit n’a pas répondu. Votre voix est gardée.');
    } finally {
      setEnTranscription(false);
      setTimeout(() => setMessageTranscription(null), 3000);
    }
  };

  // ── Enregistrement vocal universel (WebM / MP4 / AAC) + Web Speech en direct ──
  const demarrerEnregistrement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioFichierRef.current = audioBlob;
        setAudioBlobUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());

        // Si rien n'a été écrit à la voix, on tente la mise par écrit
        if (!texteTemoignage.trim()) {
          void mettreParEcrit(audioBlob);
        }
      };

      // Démarrage Web Speech Recognition en direct
      if (typeof window !== 'undefined') {
        const fenetre = window as FenetreAvecDictee;
        const SpeechRec = fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const recog = new SpeechRec();
            recog.lang = 'fr-FR';
            recog.continuous = true;
            recog.interimResults = true;
            recog.onresult = (evt) => {
              let directText = '';
              for (let i = 0; i < evt.results.length; i++) {
                directText += evt.results[i][0].transcript + ' ';
              }
              if (directText.trim()) {
                setTexteTemoignage(directText.trim());
              }
            };
            recog.start();
            recognitionRef.current = recog;
          } catch {
            /* Speech recognition fallback */
          }
        }
      }

      mediaRecorder.start();
      setEnEnregistrement(true);
    } catch {
      alert('Impossible d’accéder au microphone. Veuillez autoriser l’accès dans votre navigateur.');
    }
  };

  const arreterEnregistrement = () => {
    if (mediaRecorderRef.current && enEnregistrement) {
      mediaRecorderRef.current.stop();
      setEnEnregistrement(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const ouvrirFormulaire = () => {
    if (!user) {
      setModalConnexion(true);
      return;
    }
    setFormulaireOuvert((v) => !v);
  };

  const publier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setModalConnexion(true);
      return;
    }
    if (!texteTemoignage.trim() && !audioBlobUrl) return;

    setEnPublication(true);
    setSoucisPartage(null);

    // L'audio va sur R2 ; le document ne portera plus qu'un lien.
    let adresseAudio: string | undefined;
    if (audioFichierRef.current) {
      try {
        const jeton = await jetonFirebase();
        const reponse = await fetch('/api/temoignages/audio', {
          method: 'POST',
          headers: {
            'Content-Type': audioFichierRef.current.type || 'audio/webm',
            ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
          },
          body: audioFichierRef.current,
        });
        if (reponse.ok) {
          ({ url: adresseAudio } = (await reponse.json()) as { url: string });
        } else {
          const detail = (await reponse.json().catch(() => null)) as { error?: string } | null;
          setSoucisPartage(
            detail?.error ??
              'Votre voix n’a pas pu être déposée. Le texte sera partagé, l’enregistrement reste ici.'
          );
        }
      } catch {
        setSoucisPartage(
          'Votre voix n’a pas pu être déposée — la connexion a manqué. Le texte sera partagé.'
        );
      }
    }

    const nouveau: TemoignageItem = {
      id: 'tem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      auteur: user?.displayName || 'Compagnon de route',
      auteurId: user?.uid,
      ficheId: ficheSelectionnee,
      texte: texteTemoignage.trim() || 'Témoignage audio partagé avec la communauté.',
      audioUrl: adresseAudio,
      amens: 1,
      amensVotants: user?.uid ? [user.uid] : [],
      aVote: true,
      date: Date.now(),
      couleur: couleurChoisie,
      attache: 'punaise-bois',
      rotation: '-rotate-2',
    };

    // 1. Optimistic local update
    setTemoignages((prev) => [nouveau, ...prev]);
    setTemoignageActif(nouveau);
    setTexteTemoignage('');
    setAudioBlobUrl(null);
    audioFichierRef.current = null;
    setFormulaireOuvert(false);

    // 2. Diffusion aux autres appareils. Le résultat était ignoré : un
    // témoignage refusé par Firestore restait sur le seul appareil de son
    // auteur, qui le voyait bien et le croyait partagé.
    const issue = await publierDistant(nouveau);
    setEnPublication(false);
    if (!issue.partage) {
      setSoucisPartage(
        issue.raison === 'trop_long'
          ? 'Votre témoignage est enregistré ici, mais il est trop long pour être partagé — un enregistrement doit rester sous les trois minutes environ. Reprenez-le plus court pour que le groupe l’entende.'
          : issue.raison === 'hors_ligne'
            ? 'Votre témoignage est gardé sur cet appareil. Il sera partagé dès que la connexion reviendra.'
            : 'Votre témoignage est gardé ici, mais il n’a pas pu être partagé. Réessayez dans un moment.'
      );
    }
  };

  const supprimerTemoignage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Voulez-vous décrocher et supprimer ce témoignage du tableau de liège communautaire ?')) {
      const nouvelleListe = temoignages.filter((t) => t.id !== id);
      setTemoignages(nouvelleListe);
      if (temoignageActif.id === id) {
        setTemoignageActif(nouvelleListe[0] || TEMOIGNAGES_INITIAUX[0]);
      }
      await supprimerDistant(id);
    }
  };

  const reinitialiserTableau = () => {
    if (window.confirm('Voulez-vous restaurer les témoignages initiaux sur votre écran ?')) {
      const init = reinitialiserTableauLocal();
      setTemoignages(init);
      setTemoignageActif(init[0]);
    }
  };

  const voterAmen = async (id: string) => {
    const res = await voterAmenDistant(id, user?.uid);
    setTemoignages((prev) =>
      prev.map((t) => (t.id === id ? { ...t, amens: res.amens, aVote: res.aVote } : t))
    );
    if (temoignageActif.id === id) {
      setTemoignageActif((prev) => ({ ...prev, amens: res.amens, aVote: res.aVote }));
    }
  };

  const basculerAudio = (t: TemoignageItem) => {
    if (audioEnLecture === t.id) {
      audioPlayerRef.current?.pause();
      setAudioEnLecture(null);
      return;
    }

    if (t.audioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.src = t.audioUrl;
      audioPlayerRef.current
        .play()
        .then(() => setAudioEnLecture(t.id))
        .catch(() => setAudioEnLecture(null));
    } else if (lectureDisponible()) {
      lireAVoixHaute(`${t.auteur} témoigne : ${t.texte}`);
      setAudioEnLecture(t.id);
    }
  };

  const obtenirClassesCouleur = (couleur?: string) => {
    switch (couleur) {
      case 'rose':
        return 'bg-[#ffd7e2] text-rose-950 border border-rose-300 shadow-md';
      case 'jaune':
        return 'bg-[#fef08a] text-amber-950 border border-amber-300 shadow-md';
      case 'vert':
        return 'bg-[#dcfce7] text-emerald-950 border border-emerald-300 shadow-md';
      case 'orange':
        return 'bg-[#fed7aa] text-orange-950 border border-orange-300 shadow-md';
      case 'blanc':
      default:
        return 'bg-[#fefbf6] text-encre-950 border border-parchemin-300 shadow-md';
    }
  };

  const metaFiche = FICHES_META.find((f) => f.id === temoignageActif.ficheId);

  return (
    <div className="tableau-liege relative min-h-screen overflow-hidden p-4 sm:p-8 lg:p-12 text-encre-950">
      <audio
        ref={audioPlayerRef}
        onEnded={() => setAudioEnLecture(null)}
        onError={() => setAudioEnLecture(null)}
      />

      {/* ══ Faisceau de Lumière de la Lampe d'Atelier (Haut Droit) ══ */}
      <div className="faisceau-lampe pointer-events-none absolute inset-0 z-0" />

      {/* Abat-jour / Lampe d'architecte vintage */}
      <div className="pointer-events-none absolute right-[-20px] top-[-30px] z-10 hidden md:block opacity-95">
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          {/* Bras articulé métallique */}
          <path d="M190 10 L140 40 L160 80" stroke="#222" strokeWidth="12" strokeLinecap="round" />
          <circle cx="140" cy="40" r="8" fill="#444" />
          {/* Abat-jour noir biseauté */}
          <path d="M110 50 L180 100 L140 160 L70 110 Z" fill="#18181b" stroke="#27272a" strokeWidth="4" />
          <ellipse cx="105" cy="135" rx="35" ry="20" fill="#fef08a" opacity="0.85" filter="blur(8px)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* ══ En-tête : Carte de Titre épinglée (Haut Gauche) & Bouton d'Ajout ══ */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Carte Titre : "Le fruit visible de l'atelier" */}
          <div className="feuille relative rounded-2xl border border-parchemin-400 bg-[#fbf7ee] p-5 sm:p-6 shadow-xl -rotate-1 max-w-sm">
            <span className="punaise-metal absolute -top-2 left-6" />
            <span className="text-3xs font-bold uppercase tracking-[0.22em] text-or-800 font-serif block mb-1">
              Table de transformation
            </span>
            <h1 className="manuscrit text-2xl sm:text-3xl font-bold text-encre-950 leading-tight">
              Le fruit visible de l’atelier
            </h1>
            <p className="mt-1 font-serif text-2xs italic text-encre-600">
              « Ce que Dieu a fait au milieu de nous, partagé par nos compagnons. »
            </p>
          </div>

          {/* Boutons d'action en-tête */}
          <div className="flex items-center gap-2">
            <button
              onClick={reinitialiserTableau}
              title="Réinitialiser les témoignages du tableau"
              className="inline-flex items-center gap-1.5 rounded-full bg-parchemin-100/90 px-3.5 py-3 text-2xs font-bold text-encre-700 hover:bg-white hover:text-encre-950 shadow-md border border-parchemin-300 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>

            {/* Bouton pour Épingler son témoignage */}
            <button
              onClick={ouvrirFormulaire}
              className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-6 py-3.5 text-xs font-bold text-parchemin-100 shadow-2xl transition-all hover:bg-encre-900 hover:scale-105 active:scale-95 border border-or-400/40 shrink-0"
            >
              <Plus className="h-4 w-4 text-or-400" strokeWidth={2.5} />
              {formulaireOuvert ? 'Fermer le bloc-notes' : 'Épingler mon témoignage (Voix ou Texte)'}
            </button>
          </div>
        </div>

        {/* ══ Formulaire de dépôt en Post-it ══ */}
        {soucisPartage && (
          <div className="postit postit-jaune pose-2 relative mx-auto mb-8 max-w-2xl rounded-2xl px-5 py-4 shadow-md">
            <span className="ruban -top-3 left-8 -rotate-2 rounded-[2px]" />
            <p className="manuscrit pt-1 text-xl font-bold text-encre-950">
              Gardé ici, pas encore partagé
            </p>
            <p className="mt-1 font-serif text-xs italic leading-relaxed text-encre-800">
              {soucisPartage}
            </p>
            <button
              onClick={() => setSoucisPartage(null)}
              className="mt-2 text-2xs font-bold text-encre-500 underline underline-offset-2 hover:text-encre-800"
            >
              J’ai compris
            </button>
          </div>
        )}

        {formulaireOuvert && user && (
          <form
            onSubmit={publier}
            className="feuille relative mx-auto mb-10 max-w-2xl rounded-3xl border-2 border-or-400/80 bg-[#fffdfa] p-6 sm:p-8 shadow-2xl animate-fadeIn"
          >
            <span className="punaise-bois absolute -top-2.5 left-12" />
            <span className="scotch-kraft absolute -top-3 right-10 h-6 w-16 rotate-2" />

            <div className="flex items-center justify-between border-b border-parchemin-300 pb-3 mb-4">
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-or-700">
                  Nouvelle Note sur le Liège
                </span>
                <h3 className="manuscrit text-2xl font-bold text-encre-950">
                  Déposer une pépite ou un témoignage
                </h3>
                <p className="text-3xs text-encre-600 mt-0.5">
                  Épinglé au nom de : <strong className="text-or-950">{user.displayName || user.email}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormulaireOuvert(false)}
                className="rounded-full p-1.5 text-encre-400 hover:bg-parchemin-200 hover:text-encre-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Choix de la couleur du Post-it */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xs font-bold text-encre-700">Couleur du papillon :</span>
              <div className="flex items-center gap-2">
                {(['rose', 'jaune', 'vert', 'orange', 'blanc'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCouleurChoisie(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${
                      c === 'rose'
                        ? 'bg-[#ffd7e2]'
                        : c === 'jaune'
                        ? 'bg-[#fef08a]'
                        : c === 'vert'
                        ? 'bg-[#dcfce7]'
                        : c === 'orange'
                        ? 'bg-[#fed7aa]'
                        : 'bg-white'
                    } ${couleurChoisie === c ? 'scale-125 border-encre-950 shadow-xs' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Sélecteur de fiche associée */}
            <div className="mb-4">
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-600 mb-1.5">
                Fiche concernée
              </label>
              <select
                value={ficheSelectionnee}
                onChange={(e) => setFicheSelectionnee(Number(e.target.value))}
                className="w-full rounded-2xl border border-parchemin-400 bg-white p-3 text-xs font-bold text-encre-900 focus:outline-none"
              >
                {FICHES_META.map((meta) => (
                  <option key={meta.id} value={meta.id}>
                    Fiche {meta.id} · {meta.titre}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone de texte */}
            <div className="mb-4">
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-600 mb-1.5">
                Votre phrase / Récit de transformation
              </label>
              <textarea
                value={texteTemoignage}
                onChange={(e) => setTexteTemoignage(e.target.value)}
                placeholder="« La révélation que Dieu m'aime m'a guéri... »"
                rows={4}
                className="manuscrit w-full rounded-2xl border border-parchemin-300 bg-parchemin-50/70 p-4 text-xl text-encre-950 placeholder-encre-400 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Enregistreur Audio & Transcription IA */}
            <div className="mb-6 rounded-2xl border border-or-300 bg-or-50/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-or-700" />
                    <span className="text-xs font-bold text-or-950">Mémo vocal &amp; Dictée</span>
                  </div>
                  <p className="text-3xs text-encre-600 mt-0.5">
                    Parlez au micro : vos paroles s&apos;écrivent en direct sur le post-it !
                  </p>
                </div>

                {!enEnregistrement ? (
                  <button
                    type="button"
                    onClick={demarrerEnregistrement}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-or-600 px-4 py-2 text-2xs font-bold text-white hover:bg-or-700 shadow-xs transition-transform active:scale-95"
                  >
                    <Mic className="h-3.5 w-3.5" /> Enregistrer ma voix
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={arreterEnregistrement}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-2xs font-bold text-white animate-pulse shadow-xs"
                  >
                    <MicOff className="h-3.5 w-3.5" /> Terminer l’enregistrement
                  </button>
                )}
              </div>

              {/* Animation pendant l'enregistrement */}
              {enEnregistrement && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-2xs font-semibold text-rose-800 animate-fadeIn">
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Enregistrement en cours... Parlez clairement, le texte se dicte automatiquement.</span>
                </div>
              )}

              {/* Où en est la mise par écrit */}
              {messageTranscription && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-100/80 border border-or-400 p-2.5 text-2xs font-bold text-encre-900 animate-fadeIn">
                  {enTranscription ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-or-700 shrink-0" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-or-700 shrink-0" />
                  )}
                  <span>{messageTranscription}</span>
                </div>
              )}

              {audioBlobUrl && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-2xs font-semibold text-emerald-900 bg-emerald-50/90 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Votre voix est enregistrée</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={enTranscription}
                      onClick={() => audioFichierRef.current && void mettreParEcrit(audioFichierRef.current)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 text-3xs font-bold shadow-2xs transition-colors disabled:opacity-50"
                      title="Écrire automatiquement ce que vous venez de dire"
                    >
                      {enTranscription ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 text-amber-300" />
                      )}
                      <span>Mettre par écrit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAudioBlobUrl(null)}
                      className="text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 hover:underline text-3xs font-bold"
                    >
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-parchemin-300 pt-4">
              <button
                type="button"
                onClick={() => setFormulaireOuvert(false)}
                className="rounded-full px-5 py-2.5 text-xs font-bold text-encre-600 hover:bg-parchemin-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enPublication || (!texteTemoignage.trim() && !audioBlobUrl)}
                className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-6 py-2.5 text-xs font-bold text-parchemin-100 shadow-md hover:bg-encre-900 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-or-300" />
                {enPublication ? 'Diffusion en cours...' : 'Épingler sur le Liège'}
              </button>
            </div>
          </form>
        )}

        {/* ══ Le Pêle-Mêle Central : Post-it Vedette & Constellation de Papillons ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 🌟 LE GRAND POST-IT VEDETTE AU PREMIER PLAN (Gauche / Centre) */}
          <div className="lg:col-span-6 relative">
            <div
              className={`relative rounded-3xl p-7 sm:p-9 shadow-2xl transition-all duration-300 ${temoignageActif.rotation || '-rotate-2'} ${obtenirClassesCouleur(
                temoignageActif.couleur
              )}`}
            >
              {/* Punaise en bois réaliste */}
              <span className="punaise-bois absolute -top-3 left-10" />

              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
                <div>
                  <span className="text-3xs font-bold uppercase tracking-wider text-encre-600 block">
                    Témoignage mis en lumière
                  </span>
                  <h3 className="manuscrit text-2xl font-bold text-encre-950">
                    {temoignageActif.auteur}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {metaFiche && (
                    <span className="rounded-full bg-black/10 px-3 py-1 text-3xs font-bold uppercase tracking-wider text-encre-800">
                      Fiche {metaFiche.id}
                    </span>
                  )}
                  {/* Bouton Décrocher / Supprimer ce post-it vedette */}
                  <button
                    type="button"
                    onClick={(e) => supprimerTemoignage(temoignageActif.id, e)}
                    title="Décrocher et effacer ce témoignage du tableau"
                    className="p-1.5 rounded-full text-encre-500 hover:text-rose-700 hover:bg-rose-100/60 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Texte Mis en Avant */}
              <p className="manuscrit text-2xl sm:text-3xl leading-snug text-encre-950 font-bold my-4">
                « {temoignageActif.texte} »
              </p>

              {/* Barre d'action basse : Écouter, Voter Amen & Supprimer */}
              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => basculerAudio(temoignageActif)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                    audioEnLecture === temoignageActif.id
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-encre-950 text-white hover:bg-encre-800'
                  }`}
                >
                  {temoignageActif.audioUrl ? (
                    audioEnLecture === temoignageActif.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {audioEnLecture === temoignageActif.id
                      ? 'Pause audio'
                      : temoignageActif.audioUrl
                      ? 'Écouter le mémo vocal'
                      : 'Écouter la lecture'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => voterAmen(temoignageActif.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      temoignageActif.aVote
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white/80 text-rose-900 border border-rose-300 hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${temoignageActif.aVote ? 'fill-current' : ''}`} />
                    <span>{temoignageActif.amens} Amen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 LA CONSTELLATION DE POST-ITS ÉPINGLÉS (Droite) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {temoignages.map((item) => {
              const estSelectionne = temoignageActif.id === item.id;
              const meta = FICHES_META.find((f) => f.id === item.ficheId);

              return (
                <div
                  key={item.id}
                  onClick={() => setTemoignageActif(item)}
                  className={`group relative cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:scale-105 hover:z-20 ${item.rotation || 'rotate-1'} ${obtenirClassesCouleur(
                    item.couleur
                  )} ${estSelectionne ? 'ring-3 ring-encre-950 scale-102 z-10' : ''}`}
                >
                  {/* Attache physique */}
                  {item.attache === 'punaise-bois' ? (
                    <span className="punaise-bois absolute -top-2 left-6" />
                  ) : item.attache === 'trombone' ? (
                    <span className="trombone absolute -top-3 right-6 rotate-12" />
                  ) : item.attache === 'scotch' ? (
                    <span className="scotch-kraft absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-12" />
                  ) : (
                    <span className="punaise-metal absolute -top-2 right-6" />
                  )}

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="manuscrit text-sm font-bold text-encre-950 truncate max-w-[120px]">
                      {item.auteur}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {meta && (
                        <span className="text-3xs font-semibold text-encre-600">
                          F.{meta.id}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => supprimerTemoignage(item.id, e)}
                        title="Décrocher ce témoignage"
                        className="p-1 rounded-full text-encre-400 hover:text-rose-700 hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="manuscrit text-base font-bold leading-snug line-clamp-3 text-encre-950">
                    « {item.texte} »
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 text-3xs text-encre-600">
                    <span className="flex items-center gap-1">
                      {item.audioUrl && <span>🎙️ Audio</span>}
                      <span>{item.amens} Amen</span>
                    </span>
                    <span className="font-bold text-encre-950 group-hover:underline">
                      Afficher en grand →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Encart Bas Droit : "La technologie s'efface. La transformation demeure." ══ */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/15 pt-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎙️</span>
            <span className="text-2xl">💬</span>
            <span className="text-xs font-serif italic text-encre-800">
              Récits vocaux &amp; témoignages écrits vérifiés
            </span>
          </div>

          {/* Bandeau de papier kraft */}
          <div className="bandeau-kraft rounded-2xl px-6 py-3 shadow-md rotate-1 text-center">
            <p className="manuscrit text-lg sm:text-xl font-bold text-encre-950 tracking-wide">
              « La technologie s’efface. La transformation demeure. »
            </p>
          </div>
        </div>

      </div>

      {/* ══ Modal : Connexion Requise pour Témoigner ══ */}
      {modalConnexion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="feuille relative max-w-md w-full rounded-3xl border-2 border-or-400 bg-white p-7 text-center shadow-2xl">
            <span className="punaise-bois absolute -top-3 left-1/2 -translate-x-1/2" />
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-or-100 text-or-800 mb-4 border border-or-300">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-encre-950">
              Compte requis pour témoigner
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-encre-600 font-serif">
              Le mur des témoignages est en <strong>libre lecture</strong> pour tout le monde. Pour déposer votre propre récit ou mémo vocal, veuillez vous connecter afin que votre témoignage soit signé de votre nom.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="bouton-or inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold shadow-md"
              >
                Se connecter ou créer un compte
              </Link>
              <button
                type="button"
                onClick={() => setModalConnexion(false)}
                className="rounded-full py-2 text-2xs font-bold text-encre-500 hover:text-encre-800"
              >
                Continuer la lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

