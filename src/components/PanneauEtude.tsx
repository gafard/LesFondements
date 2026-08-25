'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Languages,
  Layers,
  Loader2,
  ScrollText,
  Sparkles,
  Tag,
  Volume2,
  X,
} from 'lucide-react';
import {
  chargerCommentaire,
  chargerReferencesCroisees,
  chargerStrong,
  chargerTheme,
  chargerThemesDuVerset,
  langueDe,
  libelleClef,
  lirePassage,
  prechargerLivre,
  texteSeul,
  type EntreeStrong,
  type GroupeReferences,
  type Passage,
  type Theme,
  type Verset,
} from '@/lib/etudes';
import { analyserClefVerset, formaterReference } from '@/lib/reference';
import { fermerEtude, ouvrirEtude, usePanneauEtude } from '@/lib/panneauEtude';
import {
  getComparaisonVerset,
  getAudioChapitre,
  chargerTraductionEnLigne,
} from '@/lib/bibleVersions';
import { arreterLecture, lireAVoixHaute } from '@/lib/ambiance';

type Onglet = 'texte' | 'comparer' | 'renvois' | 'themes' | 'commentaire';

export default function PanneauEtude() {
  const reference = usePanneauEtude();
  const [passage, setPassage] = useState<Passage | null | undefined>(undefined);
  const [versetActif, setVersetActif] = useState<number | null>(null);
  const [strongActif, setStrongActif] = useState<EntreeStrong | null>(null);
  const [chargementStrong, setChargementStrong] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('texte');
  const [afficherStrong, setAfficherStrong] = useState(true);
  const [copie, setCopie] = useState(false);
  const [audioVersion, setAudioVersion] = useState<'lsg' | 'semeur'>('semeur');
  const [audioEnCours, setAudioEnCours] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lectureIdRef = useRef(0);
  const [referencePrecedente, setReferencePrecedente] = useState(reference);

  // ── Chargement du passage ───────────────────────────────────
  // Réinitialisation au changement de référence, pendant le rendu.
  if (reference !== referencePrecedente) {
    setReferencePrecedente(reference);
    setPassage(undefined);
    setStrongActif(null);
    if (reference) setOnglet('texte');
  }

  useEffect(() => {
    if (!reference) return;
    prechargerLivre(reference.livre.code);
    void lirePassage(reference).then((resultat) => {
      setPassage(resultat);
      setVersetActif(resultat?.versets[0]?.v ?? null);
    });
  }, [reference]);

  // ── Fermeture au clavier ────────────────────────────────────
  useEffect(() => {
    if (!reference) return;
    const auClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') fermerEtude();
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [reference]);

  const arreterAudio = useCallback(() => {
    lectureIdRef.current += 1;
    audioRef.current?.pause();
    arreterLecture();
    setAudioEnCours(false);
  }, []);

  useEffect(
    () => () => {
      lectureIdRef.current += 1;
      audioRef.current?.pause();
      arreterLecture();
    },
    [reference]
  );

  const ouvrirStrong = useCallback(
    async (code: number) => {
      if (!passage) return;
      setChargementStrong(true);
      const entree = await chargerStrong(langueDe(passage.reference.livre), code);
      setStrongActif(entree);
      setChargementStrong(false);
    },
    [passage]
  );

  const changerChapitre = (delta: number) => {
    if (!passage) return;
    const suivant = passage.reference.chapitre + delta;
    if (suivant < 1 || suivant > passage.nbChapitres) return;
    ouvrirEtude({
      livre: passage.reference.livre,
      chapitre: suivant,
      brut: `${passage.reference.livre.nom} ${suivant}`,
    });
  };

  const copier = async () => {
    if (!passage) return;
    try {
      await navigator.clipboard.writeText(
        `« ${texteSeul(passage.versets)} » — ${passage.titre} (Segond 1910)`
      );
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const basculerAudio = (version: 'lsg' | 'semeur') => {
    if (!passage) return;
    if (audioEnCours && audioVersion === version) {
      arreterAudio();
      return;
    }

    arreterAudio();
    setAudioVersion(version);

    // Le flux studio est un chapitre complet. On ne l'utilise que lorsque la
    // référence vise réellement tout le chapitre ; une plage de versets est
    // lue depuis son premier verset et s'arrête à sa dernière ligne.
    const url = passage.chapitreEntier
      ? getAudioChapitre(
          passage.reference.livre.numero,
          passage.reference.livre.nom,
          passage.reference.chapitre,
          version
        )
      : '';

    if (url && audioRef.current) {
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      audioRef.current
        .play()
        .then(() => {
          setAudioEnCours(true);
        })
        .catch((err) => {
          console.warn('PanneauEtude audio playback error:', err);
          setAudioEnCours(false);
        });
      return;
    }

    const comparaison =
      getComparaisonVerset(passage.reference.brut) ?? getComparaisonVerset(passage.titre);
    const texteExact =
      version === 'semeur' && comparaison?.bds
        ? comparaison.bds
        : texteSeul(passage.versets);
    const lectureId = ++lectureIdRef.current;
    const lectureDemarree = lireAVoixHaute(`${passage.titre}. ${texteExact}`, {
      onFin: () => {
        if (lectureId === lectureIdRef.current) setAudioEnCours(false);
      },
      onErreur: () => {
        if (lectureId === lectureIdRef.current) setAudioEnCours(false);
      },
    });
    setAudioEnCours(lectureDemarree);
  };

  if (!reference) return null;

  const onglets: { id: Onglet; label: string; icon: typeof BookOpen }[] = [
    { id: 'texte', label: 'Texte LSG', icon: BookOpen },
    { id: 'comparer', label: 'Comparer versions', icon: Layers },
    { id: 'renvois', label: 'Renvois', icon: Layers },
    { id: 'themes', label: 'Thèmes', icon: Tag },
    { id: 'commentaire', label: 'Commentaire', icon: ScrollText },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <audio
        ref={audioRef}
        onPlay={() => setAudioEnCours(true)}
        onPause={() => setAudioEnCours(false)}
        onEnded={() => setAudioEnCours(false)}
        onError={() => setAudioEnCours(false)}
      />

      <button
        type="button"
        onClick={() => {
          arreterAudio();
          fermerEtude();
        }}
        aria-label="Fermer le panneau d’étude"
        className="absolute inset-0 bg-encre-950/50 backdrop-blur-sm"
      />

      <aside className="table-travail animate-fade-in relative flex h-full w-full max-w-lg flex-col border-l border-parchemin-400 shadow-2xl overflow-hidden">
        {/* ── En-tête de Table d'Étude ── */}
        <header className="nuit nuit-grain relative shrink-0 px-5 pb-4 pt-5 text-parchemin-100 border-b border-or-400/20">
          <span className="ruban -top-2 left-10 -rotate-1 rounded-[2px]" />
          
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-3xs font-bold uppercase tracking-[0.2em] text-or-400/90 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-or-300" />
                Bible d’étude du disciple
              </span>
              <h2 className="manuscrit mt-1 truncate text-3xl font-bold leading-none text-parchemin-100">
                {passage?.titre ?? formaterReference(reference, true)}
              </h2>
            </div>
            <button
              onClick={() => {
                arreterAudio();
                fermerEtude();
              }}
              className="shrink-0 rounded-full bg-white/10 p-2 text-parchemin-100/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {passage && passage.reference.chapitre > 1 && (
              <button
                onClick={() => changerChapitre(-1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-bold transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-3 w-3" /> Ch. {passage.reference.chapitre - 1}
              </button>
            )}
            {passage && passage.reference.chapitre < passage.nbChapitres && (
              <button
                onClick={() => changerChapitre(1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-bold transition-colors hover:bg-white/20"
              >
                Ch. {passage.reference.chapitre + 1} <ArrowRight className="h-3 w-3" />
              </button>
            )}

            <span className="mx-1 h-4 w-px bg-white/15" />

            <button
              onClick={() => setAfficherStrong((valeur) => !valeur)}
              title="Afficher ou masquer les numéros Strong"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
                afficherStrong
                  ? 'bg-or-400 text-encre-950 font-bold shadow-xs'
                  : 'bg-white/10 text-parchemin-100/70 hover:bg-white/20'
              }`}
            >
              <Languages className="h-3 w-3" /> Strong
            </button>

            {/* Lecture exacte du passage, ou chapitre studio si demandé en entier */}
            {passage && (
              <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
                {passage.chapitreEntier ? (
                  <>
                    <button
                      onClick={() => basculerAudio('semeur')}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold transition-all ${
                        audioVersion === 'semeur' && audioEnCours
                          ? 'bg-or-400 text-encre-950 shadow-xs'
                          : 'text-or-300 hover:bg-white/10'
                      }`}
                      title="Écouter le chapitre en Bible du Semeur"
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>{audioVersion === 'semeur' && audioEnCours ? 'Arrêter' : 'Audio Semeur'}</span>
                    </button>

                    <button
                      onClick={() => basculerAudio('lsg')}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold transition-all ${
                        audioVersion === 'lsg' && audioEnCours
                          ? 'bg-or-400 text-encre-950 shadow-xs'
                          : 'text-or-300 hover:bg-white/10'
                      }`}
                      title="Écouter le chapitre en Louis Segond"
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>{audioVersion === 'lsg' && audioEnCours ? 'Arrêter' : 'LSG'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => basculerAudio('lsg')}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold transition-all ${
                      audioVersion === 'lsg' && audioEnCours
                        ? 'bg-or-400 text-encre-950 shadow-xs'
                        : 'text-or-300 hover:bg-white/10'
                    }`}
                    title="Écouter uniquement les versets affichés"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>{audioVersion === 'lsg' && audioEnCours ? 'Arrêter' : 'Écouter ce passage'}</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={copier}
              className="rounded-full bg-white/10 p-1.5 text-parchemin-100/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Copier le passage"
            >
              {copie ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </header>

        {/* ── Intercalaires de classeur d'étude ── */}
        <nav className="flex shrink-0 items-end gap-1.5 overflow-x-auto px-4 pt-3 bg-parchemin-300/40">
          {onglets.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`intercalaire flex shrink-0 items-center gap-1.5 px-3.5 text-2xs font-bold transition-all ${
                onglet === tab.id
                  ? 'intercalaire-actif pt-2.5 pb-3 text-or-800'
                  : 'pb-2 pt-2 text-encre-600 hover:text-encre-900'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={onglet === tab.id ? 2.25 : 1.75} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Contenu sur la Page d'Étude ── */}
        <div className="page-etude min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {passage === undefined ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-or-600" />
              <p className="text-xs font-serif italic text-encre-500">Déroulement du rouleau des Écritures…</p>
            </div>
          ) : passage === null ? (
            <p className="py-16 text-center text-sm font-serif italic text-encre-400">
              Ce passage n&apos;a pas pu être trouvé.
            </p>
          ) : onglet === 'texte' ? (
            <TexteDuPassage
              passage={passage}
              afficherStrong={afficherStrong}
              versetActif={versetActif}
              onVerset={setVersetActif}
              onStrong={ouvrirStrong}
            />
          ) : onglet === 'comparer' ? (
            <OngletComparer
              key={`comparer:${passage.reference.chapitre}:${versetActif}`}
              passage={passage}
              verset={versetActif}
            />
          ) : onglet === 'renvois' ? (
            <OngletRenvois
              key={`renvois:${passage.reference.chapitre}:${versetActif}`}
              passage={passage}
              verset={versetActif}
              onVerset={setVersetActif}
            />
          ) : onglet === 'themes' ? (
            <OngletThemes
              key={`themes:${passage.reference.chapitre}:${versetActif}`}
              passage={passage}
              verset={versetActif}
            />
          ) : (
            <OngletCommentaire
              key={`commentaire:${passage.reference.livre.code}:${passage.reference.chapitre}`}
              passage={passage}
            />
          )}
        </div>

        {/* ── Fiche Strong sur Bristol ── */}
        {(strongActif || chargementStrong) && (
          <FicheStrong
            entree={strongActif}
            chargement={chargementStrong}
            onFermer={() => setStrongActif(null)}
          />
        )}
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function TexteDuPassage({
  passage,
  afficherStrong,
  versetActif,
  onVerset,
  onStrong,
}: {
  passage: Passage;
  afficherStrong: boolean;
  versetActif: number | null;
  onVerset: (verset: number) => void;
  onStrong: (code: number) => void;
}) {
  return (
    <div className="feuille relative rounded-3xl p-5 sm:p-6 shadow-md border border-parchemin-300">
      <span className="ruban -top-2.5 left-10 -rotate-1 rounded-[2px]" />
      <span className="attache-pince -top-3 right-8" />

      <div className="space-y-1.5">
        {passage.versets.map((verset) => (
          <p
            key={verset.v}
            onClick={() => onVerset(verset.v)}
            className={`cursor-pointer rounded-2xl px-3.5 py-2 font-serif text-base leading-[1.95] transition-all ${
              versetActif === verset.v
                ? 'bg-or-100/70 text-encre-950 ring-1 ring-or-300 shadow-xs'
                : 'text-encre-900 hover:bg-parchemin-100/80'
            }`}
          >
            <sup className="mr-2 select-none font-sans text-2xs font-bold text-or-700">
              {verset.v}
            </sup>
            {afficherStrong ? (
              <VersetAnnote verset={verset} onStrong={onStrong} />
            ) : (
              verset.t
            )}
          </p>
        ))}
      </div>

      <div className="mt-5 border-t border-parchemin-300/80 pt-3 flex items-center justify-between text-3xs text-encre-500 font-serif italic">
        <span>Louis Segond 1910 · Texte authentique</span>
        <span>Cliquez un mot souligné pour ouvrir le lexique Strong</span>
      </div>
    </div>
  );
}

/** Faut-il une espace entre deux fragments ? Le français a ses règles. */
function separateur(avant: string, apres: string): string {
  if (!avant || !apres) return '';
  const finit = avant[avant.length - 1];
  const commence = apres[0];
  // Pas d'espace avant une ponctuation faible, ni après une apostrophe.
  if (/[,.;:!?…»)\]]/.test(commence)) return '';
  // Ni devant un trait d'union : les numéros Strong coupent « regarderais »
  // de « -tu », et une espace ici rendrait « regarderais -tu ».
  if (commence === '-') return '';
  if (/[’'(\[«]/.test(finit)) return '';
  // Le français met une espace avant « ; : ! ? » — l'espace fine insécable.
  if (/[;:!?»]/.test(commence)) return '\u202f';
  return ' ';
}

function VersetAnnote({
  verset,
  onStrong,
}: {
  verset: Verset;
  onStrong: (code: number) => void;
}) {
  // Un verset rétabli après coup peut n'avoir aucune annotation Strong :
  // la supposer présente faisait tomber tout le panneau.
  const fragments = (verset.s ?? []).filter((segment) => segment.t);

  return (
    <>
      {fragments.map((segment, index) => {
        const precedent = fragments[index - 1];
        const espace = precedent ? separateur(precedent.t, segment.t) : '';

        return (
          <span key={index}>
            {espace}
            {segment.s ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onStrong(segment.s!);
                }}
                title={`Strong ${segment.s}`}
                className="rounded underline decoration-or-400/40 decoration-dotted underline-offset-4 transition-colors hover:bg-or-100 hover:decoration-or-600"
              >
                {segment.t}
              </button>
            ) : (
              segment.t
            )}
          </span>
        );
      })}
    </>
  );
}

function FicheStrong({
  entree,
  chargement,
  onFermer,
}: {
  entree: EntreeStrong | null;
  chargement: boolean;
  onFermer: () => void;
}) {
  return (
    <div className="fiche-bristol relative max-h-[55%] shrink-0 overflow-y-auto border-t-2 border-or-400 bg-white px-5 py-5 shadow-[0_-12px_35px_-10px_rgba(11,29,56,0.25)]">
      <span className="attache-pince -top-3 left-10" />

      <div className="flex items-start justify-between gap-3">
        {chargement || !entree ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-or-600" />
            <p className="text-xs font-serif italic text-encre-500">Ouverture du lexique Strong…</p>
          </div>
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${
                  entree.langue === 'hebreu'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {entree.langue === 'hebreu' ? '📜 Hébreu' : '🏛️ Grec'} · Strong{' '}
                {entree.langue === 'hebreu' ? 'H' : 'G'}
                {entree.code}
              </span>
            </div>
            <p
              className="mt-1.5 font-serif text-3xl font-bold text-encre-950 tracking-wide"
              dir={entree.langue === 'hebreu' ? 'rtl' : 'ltr'}
            >
              {entree.original || entree.mot}
            </p>
            <p className="text-xs font-serif italic text-or-800">
              {entree.mot}
              {entree.phonetique && ` · [ ${entree.phonetique} ]`}
            </p>
          </div>
        )}
        <button
          onClick={onFermer}
          className="shrink-0 rounded-full bg-parchemin-200 p-1.5 text-encre-600 transition-colors hover:bg-parchemin-300 hover:text-encre-900"
          aria-label="Fermer le lexique"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {entree && !chargement && (
        <div className="mt-4 space-y-3.5 border-t border-parchemin-300 pt-3">
          {entree.type && (
            <div className="flex items-center gap-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-encre-400">
                Nature grammaticale :
              </span>
              <span className="inline-block rounded-md bg-parchemin-100 px-2 py-0.5 text-2xs font-semibold text-encre-800 border border-parchemin-300">
                {entree.type}
              </span>
            </div>
          )}

          {entree.lsg && (
            <div className="rounded-xl bg-parchemin-50 p-3 border border-parchemin-300/80">
              <p className="text-3xs font-bold uppercase tracking-[0.14em] text-or-800">
                Traduit dans la Segond par :
              </p>
              <p className="mt-0.5 font-serif text-xs font-semibold leading-relaxed text-encre-900">
                « {entree.lsg} »
              </p>
            </div>
          )}

          {entree.definition && (
            <div>
              <p className="text-3xs font-bold uppercase tracking-[0.14em] text-encre-400">
                Définition biblique & sens profond
              </p>
              <p className="mt-1 whitespace-pre-line font-serif text-xs leading-relaxed text-encre-800">
                {entree.definition}
              </p>
            </div>
          )}

          {entree.origine && (
            <p className="border-t border-parchemin-300 pt-2.5 text-3xs italic text-encre-500 font-serif">
              Étymologie / Origine : {entree.origine}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function OngletRenvois({
  passage,
  verset,
  onVerset,
}: {
  passage: Passage;
  verset: number | null;
  onVerset: (verset: number) => void;
}) {
  const [groupes, setGroupes] = useState<GroupeReferences[] | null>(null);

  useEffect(() => {
    if (verset === null) return;
    void chargerReferencesCroisees(passage.reference, verset).then(setGroupes);
  }, [passage.reference, verset]);

  return (
    <div className="space-y-4">
      <SelecteurVerset passage={passage} verset={verset} onVerset={onVerset} />

      {groupes === null ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-or-600" />
          <p className="text-2xs text-encre-400 font-serif italic">Recherche des renvois croisés…</p>
        </div>
      ) : groupes.length === 0 ? (
        <div className="feuille rounded-2xl p-6 text-center border border-parchemin-300">
          <p className="text-xs font-serif italic leading-relaxed text-encre-500">
            Aucun renvoi pour ce verset dans le Treasury of Scripture Knowledge.
          </p>
        </div>
      ) : (
        <div className="feuille relative rounded-3xl p-5 sm:p-6 shadow-md border border-parchemin-300 space-y-5">
          <span className="ruban -top-2.5 left-10 -rotate-1 rounded-[2px]" />
          
          <div className="border-b border-parchemin-300 pb-2">
            <span className="text-3xs font-bold uppercase tracking-[0.16em] text-or-800">
              Renvois Scripturaires Croisés (TSK 1833)
            </span>
            <p className="text-xs text-encre-600 font-serif italic">
              Passages éclairant le verset {verset}
            </p>
          </div>

          <div className="space-y-4">
            {groupes.map((groupe, index) => (
              <div key={index} className="rounded-2xl bg-parchemin-50/80 p-3.5 border border-parchemin-300/80">
                {groupe.titre && (
                  <p className="mb-2 font-serif text-xs font-bold text-encre-900">
                    • {groupe.titre}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {groupe.refs.map((cle) => (
                    <BoutonRenvoi key={cle} cle={cle} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="border-t border-parchemin-300 pt-3 text-3xs leading-relaxed text-encre-400 font-serif italic">
            Renvois du <em>Treasury of Scripture Knowledge</em> (1833). Cliquez sur une référence pour l’ouvrir instantanément sur votre table.
          </p>
        </div>
      )}
    </div>
  );
}

function BoutonRenvoi({ cle }: { cle: string }) {
  return (
    <button
      onClick={() => {
        const reference = analyserClefVerset(cle);
        if (reference) ouvrirEtude(reference);
      }}
      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-2xs font-bold text-encre-800 shadow-2xs border border-parchemin-300 transition-all hover:bg-or-400 hover:text-encre-950 hover:scale-105 active:scale-95"
    >
      <span>📖</span>
      {libelleClef(cle)}
    </button>
  );
}

function OngletThemes({ passage, verset }: { passage: Passage; verset: number | null }) {
  const [cles, setCles] = useState<string[] | null>(null);
  const [ouvert, setOuvert] = useState<Theme | null>(null);

  useEffect(() => {
    if (verset === null) return;
    void chargerThemesDuVerset(passage.reference, verset).then(setCles);
  }, [passage.reference, verset]);

  const stylesPostIt = [
    'postit-etude-jaune rotate-1',
    'postit-etude-vert -rotate-1',
    'postit-etude-rose rotate-2',
    'postit-etude-bleu -rotate-2',
  ];

  return (
    <div className="space-y-4">
      {cles === null ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-or-600" />
          <p className="text-2xs text-encre-400 font-serif italic">Indexation thématique de Nave…</p>
        </div>
      ) : cles.length === 0 ? (
        <div className="feuille rounded-2xl p-6 text-center border border-parchemin-300">
          <p className="text-xs font-serif italic leading-relaxed text-encre-500">
            Ce verset n&apos;est rattaché à aucun thème de la bible thématique de Nave.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-3xs font-bold uppercase tracking-[0.16em] text-or-800 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-or-600" />
              Post-its Thématiques du verset {verset}
            </p>
            <span className="text-3xs font-serif italic text-encre-500">
              {cles.length} thème{cles.length > 1 ? 's' : ''} indexé{cles.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Grille de Post-its */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {cles.map((cle, idx) => {
              const style = stylesPostIt[idx % stylesPostIt.length];
              const estOuvert = ouvert?.nom.toLowerCase() === cle.toLowerCase();
              return (
                <button
                  key={cle}
                  onClick={() => void chargerTheme(cle).then(setOuvert)}
                  className={`relative rounded-2xl p-3.5 text-left transition-all duration-200 hover:rotate-0 hover:scale-105 active:scale-95 ${style} ${
                    estOuvert ? 'ring-2 ring-or-500 shadow-md rotate-0 scale-102' : ''
                  }`}
                >
                  <span className="punaise -top-2 left-1/2 -translate-x-1/2" />
                  <p className="font-serif text-xs font-bold text-encre-950 capitalize leading-snug">
                    {cle}
                  </p>
                  <span className="mt-1 block text-3xs font-semibold text-encre-600/70">
                    Déplier la fiche →
                  </span>
                </button>
              );
            })}
          </div>

          {ouvert && (
            <article className="feuille relative rounded-3xl border border-parchemin-400 bg-white p-5 sm:p-6 shadow-md animate-fadeIn mt-4">
              <span className="ruban -top-2.5 left-10 -rotate-1 rounded-[2px]" />
              <div className="flex items-center justify-between border-b border-parchemin-300 pb-2">
                <h3 className="font-serif text-lg font-bold text-encre-950 capitalize">
                  {ouvert.nom}
                </h3>
                <span className="text-3xs font-bold uppercase tracking-wider text-or-700">
                  Bible de Nave (1897)
                </span>
              </div>
              <div className="mt-3 whitespace-pre-line font-serif text-xs leading-relaxed text-encre-800">
                <TexteAvecRenvois texte={ouvert.description} />
              </div>
            </article>
          )}

          <p className="border-t border-parchemin-300 pt-3 text-3xs leading-relaxed text-encre-400 font-serif italic">
            Bible thématique de Nave (1897). Cliquez sur un Post-it pour ouvrir son développement théologique complet.
          </p>
        </>
      )}
    </div>
  );
}

/** Les descriptions de Nave citent des passages : on les rend cliquables. */
function TexteAvecRenvois({ texte }: { texte: string }) {
  const morceaux = useMemo(() => texte.split(/(\bv=[\d,\-]+\b)/g), [texte]);
  return (
    <>
      {morceaux.map((morceau, index) =>
        morceau.startsWith('v=') ? (
          <span key={index} className="text-encre-300">
            {' '}
          </span>
        ) : (
          <span key={index}>{morceau}</span>
        )
      )}
    </>
  );
}

function OngletCommentaire({ passage }: { passage: Passage }) {
  const [textes, setTextes] = useState<string[] | null>(null);

  useEffect(() => {
    void chargerCommentaire(passage.reference.livre.code, passage.reference.chapitre).then(
      setTextes
    );
  }, [passage.reference]);

  if (textes === null) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Loader2 className="h-5 w-5 animate-spin text-or-600" />
        <p className="text-2xs text-encre-400 font-serif italic">Chargement du commentaire classique…</p>
      </div>
    );
  }
  if (!textes.length) {
    return (
      <div className="feuille rounded-2xl p-6 text-center border border-parchemin-300">
        <p className="text-xs font-serif italic leading-relaxed text-encre-500">
          Pas de commentaire pour ce chapitre.
        </p>
      </div>
    );
  }

  return (
    <div className="feuille reliure-commentaire relative rounded-3xl p-6 sm:p-7 shadow-md border border-parchemin-300 space-y-4">
      <span className="ruban -top-2.5 left-10 -rotate-1 rounded-[2px]" />

      <div className="border-b border-parchemin-300 pb-3">
        <p className="flex items-center gap-1.5 text-3xs font-bold uppercase tracking-[0.16em] text-or-800">
          <Sparkles className="h-3.5 w-3.5 text-or-600" />
          Commentaire Exégétique · Matthew Henry (1710)
        </p>
        <h3 className="manuscrit text-2xl font-bold text-encre-950 mt-1">
          {passage.reference.livre.nom} {passage.reference.chapitre}
        </h3>
      </div>

      <div className="space-y-4 font-serif text-xs leading-[1.9] text-encre-900">
        {textes.map((texte, index) => (
          <p key={index} className="whitespace-pre-line">
            {index === 0 ? (
              <>
                <span className="float-left mr-2.5 font-serif text-3xl font-bold text-or-800 leading-none">
                  {texte.charAt(0)}
                </span>
                {texte.slice(1)}
              </>
            ) : (
              texte
            )}
          </p>
        ))}
      </div>

      <p className="border-t border-parchemin-300 pt-3 text-3xs leading-relaxed text-encre-400 font-serif italic">
        Commentaire de Matthew Henry (1710), traduction française classique du domaine public.
      </p>
    </div>
  );
}

function SelecteurVerset({
  passage,
  verset,
  onVerset,
}: {
  passage: Passage;
  verset: number | null;
  onVerset: (verset: number) => void;
}) {
  if (passage.versets.length <= 1) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <span className="text-3xs font-bold uppercase tracking-wider text-encre-400 shrink-0 mr-1">
        Verset :
      </span>
      {passage.versets.map((v) => (
        <button
          key={v.v}
          onClick={() => onVerset(v.v)}
          className={`h-7 w-7 shrink-0 rounded-lg text-2xs font-bold transition-all ${
            verset === v.v
              ? 'bg-or-400 text-encre-950 font-bold shadow-xs scale-105'
              : 'bg-white text-encre-600 hover:bg-parchemin-200 border border-parchemin-300'
          }`}
        >
          {v.v}
        </button>
      ))}
    </div>
  );
}

function OngletComparer({ passage, verset }: { passage: Passage; verset: number | null }) {
  const [versetSelectionne, setVersetSelectionne] = useState<number>(verset ?? 1);
  const [traductionsLive, setTraductionsLive] = useState<Record<string, string>>({});
  const [enChargement, setEnChargement] = useState(false);

  const numVerset = versetSelectionne;
  const livreNum = passage.reference.livre.numero;
  const chapNum = passage.reference.chapitre;

  const refComplete = `${passage.reference.livre.nom} ${chapNum}:${numVerset}`;
  const refAbregee = `${passage.reference.livre.code} ${chapNum}:${numVerset}`;
  const comparaisonPrechargee = getComparaisonVerset(refComplete) || getComparaisonVerset(refAbregee);

  const versetActuel = passage.versets.find((v) => v.v === numVerset);
  const texteLsg = versetActuel ? versetActuel.t : comparaisonPrechargee?.lsg || '';

  // Chargement des véritables traductions en direct (BDS, Darby, PDV, NBS)
  useEffect(() => {
    let actif = true;
    async function chargerTraductions() {
      setEnChargement(true);
      try {
        const [bds, darby, pdv, nbs] = await Promise.all([
          comparaisonPrechargee?.bds
            ? Promise.resolve(comparaisonPrechargee.bds)
            : chargerTraductionEnLigne('BDS', livreNum, chapNum, numVerset),
          chargerTraductionEnLigne('FRDBY', livreNum, chapNum, numVerset),
          comparaisonPrechargee?.s21
            ? Promise.resolve(comparaisonPrechargee.s21)
            : chargerTraductionEnLigne('FRPDV17', livreNum, chapNum, numVerset),
          chargerTraductionEnLigne('NBS', livreNum, chapNum, numVerset),
        ]);

        if (actif) {
          const dict: Record<string, string> = {};
          if (bds) dict['BDS'] = bds;
          if (darby) dict['FRDBY'] = darby;
          if (pdv) dict['FRPDV17'] = pdv;
          if (nbs) dict['NBS'] = nbs;
          setTraductionsLive(dict);
        }
      } finally {
        if (actif) setEnChargement(false);
      }
    }

    void chargerTraductions();
    return () => {
      actif = false;
    };
  }, [livreNum, chapNum, numVerset, comparaisonPrechargee?.bds, comparaisonPrechargee?.s21]);

  const texteBds = traductionsLive['BDS'] || comparaisonPrechargee?.bds;
  const texteDarby = traductionsLive['FRDBY'] || comparaisonPrechargee?.nfc;
  const textePdv = traductionsLive['FRPDV17'] || comparaisonPrechargee?.s21;
  const texteNbs = traductionsLive['NBS'];

  return (
    <div className="space-y-4">
      {/* En-tête avec sélecteur de verset */}
      <div className="feuille rounded-2xl border border-or-300/80 bg-or-50/80 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="font-serif text-xs font-bold text-or-950">
            Comparatif parallèle : {passage.reference.livre.nom} {chapNum}:{numVerset}
          </p>
          <span className="text-3xs font-bold uppercase tracking-wider text-or-800">
            Écritures en vis-à-vis
          </span>
        </div>
        <p className="mt-1 text-2xs text-encre-700 leading-relaxed font-serif italic">
          Comparez les véritables traductions françaises en temps réel (Segond 1910, Semeur 2015, Darby, Parole de Vie, NBS).
        </p>

        {/* Sélecteur rapide de verset du chapitre */}
        {passage.versets.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-3xs font-bold text-or-900 shrink-0">Verset :</span>
            {passage.versets.map((v) => (
              <button
                key={v.v}
                type="button"
                onClick={() => setVersetSelectionne(v.v)}
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-3xs font-bold transition-all shrink-0 ${
                  v.v === numVerset
                    ? 'bg-or-600 text-white shadow-xs scale-105'
                    : 'bg-white/80 text-encre-800 hover:bg-white'
                }`}
              >
                {v.v}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3.5">
        {/* 1. Louis Segond 1910 (Référence) */}
        <div className="feuille rounded-2xl border border-parchemin-400 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-parchemin-200 pb-2">
            <span className="font-serif text-xs font-bold text-encre-950 flex items-center gap-1.5">
              <span>📜</span> Louis Segond 1910 (LSG)
            </span>
            <span className="timbre px-2 py-0.5 text-3xs font-bold text-or-800">
              Littérale historique
            </span>
          </div>
          <p className="mt-3 font-serif text-sm leading-relaxed text-encre-900">
            « {texteLsg} »
          </p>
        </div>

        {/* 2. La Bible du Semeur 2015 */}
        <div className="feuille rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="font-serif text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <span>📖</span> La Bible du Semeur (BDS 2015)
            </span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-3xs font-bold text-indigo-800">
              Équivalence dynamique
            </span>
          </div>
          {texteBds ? (
            <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
              « {texteBds} »
            </p>
          ) : enChargement ? (
            <div className="mt-3 flex items-center gap-2 text-2xs text-indigo-700 italic">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Récupération de la traduction BDS authentique...
            </div>
          ) : (
            <p className="mt-3 font-serif text-xs italic text-indigo-800/80">
              (Traduction BDS indisponible pour ce passage)
            </p>
          )}
        </div>

        {/* 3. La Bible de Darby (1890) */}
        <div className="feuille rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <span className="font-serif text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>🏛️</span> Bible de J.N. Darby (1890)
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-3xs font-bold text-amber-800">
              Littérale d&apos;érudit
            </span>
          </div>
          {texteDarby ? (
            <p className="mt-3 font-serif text-sm leading-relaxed text-encre-950">
              « {texteDarby} »
            </p>
          ) : enChargement ? (
            <div className="mt-3 flex items-center gap-2 text-2xs text-amber-700 italic">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement de la version Darby...
            </div>
          ) : null}
        </div>

        {/* 4. Parole de Vie (2017) / Segond 21 */}
        {(textePdv || enChargement) && (
          <div className="feuille rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="font-serif text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>✨</span> Parole de Vie (PDV 2017)
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-bold text-emerald-800">
                Français accessible
              </span>
            </div>
            {textePdv ? (
              <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
                « {textePdv} »
              </p>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-2xs text-emerald-700 italic">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement Parole de Vie...
              </div>
            )}
          </div>
        )}

        {/* 5. Nouvelle Bible Segond (NBS 2002) */}
        {(texteNbs || enChargement) && (
          <div className="feuille rounded-2xl border border-slate-300 bg-slate-50/80 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-serif text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>🕊️</span> Nouvelle Bible Segond (NBS 2002)
              </span>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-3xs font-bold text-slate-700">
                Étude approfondie
              </span>
            </div>
            {texteNbs ? (
              <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
                « {texteNbs} »
              </p>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-2xs text-slate-600 italic">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement NBS...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

