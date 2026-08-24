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

      <aside className="animate-fade-in relative flex h-full w-full max-w-lg flex-col border-l border-parchemin-400 bg-parchemin-50 shadow-2xl">
        {/* ── En-tête ── */}
        <header className="nuit shrink-0 px-5 pb-4 pt-5 text-parchemin-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-2xs font-bold uppercase tracking-[0.18em] text-or-300/70">
                Bible d’étude interactive
              </span>
              <h2 className="mt-1 truncate font-serif text-xl font-bold">
                {passage?.titre ?? formaterReference(reference, true)}
              </h2>
            </div>
            <button
              onClick={() => {
                arreterAudio();
                fermerEtude();
              }}
              className="shrink-0 rounded-full bg-white/10 p-2 text-parchemin-100/70 transition-colors hover:bg-white/20 hover:text-parchemin-100"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {passage && passage.reference.chapitre > 1 && (
              <button
                onClick={() => changerChapitre(-1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-bold transition-colors hover:bg-white/18"
              >
                <ArrowLeft className="h-3 w-3" /> Ch. {passage.reference.chapitre - 1}
              </button>
            )}
            {passage && passage.reference.chapitre < passage.nbChapitres && (
              <button
                onClick={() => changerChapitre(1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-bold transition-colors hover:bg-white/18"
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
                  ? 'bg-or-400 text-encre-950'
                  : 'bg-white/10 text-parchemin-100/70 hover:bg-white/18'
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
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-amber-200/90 hover:bg-white/10'
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
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-amber-200/90 hover:bg-white/10'
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
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-amber-200/90 hover:bg-white/10'
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
              className="rounded-full bg-white/10 p-1.5 text-parchemin-100/70 transition-colors hover:bg-white/18"
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

        {/* ── Onglets ── */}
        <nav className="flex shrink-0 gap-1 border-b border-parchemin-300 bg-white px-3 overflow-x-auto">
          {onglets.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-2xs font-bold transition-colors ${
                onglet === tab.id
                  ? 'border-or-500 text-or-700'
                  : 'border-transparent text-encre-400 hover:text-encre-700'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Contenu ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {passage === undefined ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Loader2 className="h-5 w-5 animate-spin text-or-600" />
              <p className="text-2xs text-encre-400">Ouverture du passage…</p>
            </div>
          ) : passage === null ? (
            <p className="py-16 text-center text-sm text-encre-400">
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
            <OngletComparer passage={passage} verset={versetActif} />
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

        {/* ── Fiche Strong ── */}
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
    <div className="space-y-1">
      {passage.versets.map((verset) => (
        <p
          key={verset.v}
          onClick={() => onVerset(verset.v)}
          className={`cursor-pointer rounded-2xl px-3 py-2.5 font-serif text-base leading-[1.9] transition-colors ${
            versetActif === verset.v
              ? 'bg-or-50 text-encre-900 ring-1 ring-or-200'
              : 'text-encre-800 hover:bg-white'
          }`}
        >
          <sup className="mr-1.5 select-none font-sans text-2xs font-bold text-or-600">
            {verset.v}
          </sup>
          {afficherStrong ? (
            <VersetAnnote verset={verset} onStrong={onStrong} />
          ) : (
            verset.t
          )}
        </p>
      ))}

      <p className="pt-4 text-2xs leading-relaxed text-encre-400">
        Cliquez un mot souligné pour ouvrir son entrée dans le lexique hébreu ou grec.
      </p>
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
    <div className="max-h-[55%] shrink-0 overflow-y-auto border-t border-parchemin-400 bg-white px-5 py-4 shadow-[0_-12px_30px_-12px_rgba(11,29,56,0.2)]">
      <div className="flex items-start justify-between gap-3">
        {chargement || !entree ? (
          <p className="text-2xs text-encre-400">Ouverture du lexique…</p>
        ) : (
          <div className="min-w-0">
            <span className="text-2xs font-bold uppercase tracking-[0.16em] text-or-600">
              {entree.langue === 'hebreu' ? 'Hébreu' : 'Grec'} · Strong{' '}
              {entree.langue === 'hebreu' ? 'H' : 'G'}
              {entree.code}
            </span>
            <p
              className="mt-1 font-serif text-2xl font-bold text-encre-950"
              dir={entree.langue === 'hebreu' ? 'rtl' : 'ltr'}
            >
              {entree.original || entree.mot}
            </p>
            <p className="text-xs italic text-encre-500">
              {entree.mot}
              {entree.phonetique && ` · ${entree.phonetique}`}
            </p>
          </div>
        )}
        <button
          onClick={onFermer}
          className="shrink-0 rounded-full p-1.5 text-encre-300 transition-colors hover:text-encre-700"
          aria-label="Fermer le lexique"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {entree && !chargement && (
        <div className="mt-3 space-y-3">
          {entree.type && (
            <p className="inline-block rounded-full bg-parchemin-100 px-2.5 py-1 text-2xs font-semibold text-encre-600">
              {entree.type}
            </p>
          )}

          {entree.lsg && (
            <div>
              <p className="text-2xs font-bold uppercase tracking-[0.14em] text-encre-400">
                Traduit dans la Segond par
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-encre-700">{entree.lsg}</p>
            </div>
          )}

          {entree.definition && (
            <div>
              <p className="text-2xs font-bold uppercase tracking-[0.14em] text-encre-400">
                Définition
              </p>
              <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-encre-700">
                {entree.definition}
              </p>
            </div>
          )}

          {entree.origine && (
            <p className="border-t border-parchemin-300 pt-2.5 text-2xs leading-relaxed text-encre-400">
              Origine : {entree.origine}
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
    <div>
      <SelecteurVerset passage={passage} verset={verset} onVerset={onVerset} />

      {groupes === null ? (
        <p className="py-10 text-center text-2xs text-encre-400">Chargement…</p>
      ) : groupes.length === 0 ? (
        <p className="py-10 text-center text-xs leading-relaxed text-encre-400">
          Aucun renvoi pour ce verset dans le Treasury of Scripture Knowledge.
        </p>
      ) : (
        <div className="space-y-4">
          {groupes.map((groupe, index) => (
            <div key={index}>
              {groupe.titre && (
                <p className="mb-1.5 font-serif text-xs italic text-encre-500">
                  {groupe.titre}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {groupe.refs.map((cle) => (
                  <BoutonRenvoi key={cle} cle={cle} />
                ))}
              </div>
            </div>
          ))}
          <p className="border-t border-parchemin-300 pt-3 text-2xs leading-relaxed text-encre-400">
            Renvois du <em>Treasury of Scripture Knowledge</em> (1833). Les intitulés sont ceux de
            l&apos;original anglais.
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
      className="rounded-full bg-white px-2.5 py-1 text-2xs font-semibold text-encre-700 shadow-2xs transition-colors hover:bg-or-100 hover:text-or-700"
    >
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

  return (
    <div>
      {cles === null ? (
        <p className="py-10 text-center text-2xs text-encre-400">Chargement…</p>
      ) : cles.length === 0 ? (
        <p className="py-10 text-center text-xs leading-relaxed text-encre-400">
          Ce verset n&apos;est rattaché à aucun thème de la bible thématique de Nave.
        </p>
      ) : (
        <>
          <p className="mb-3 text-2xs font-bold uppercase tracking-[0.14em] text-encre-400">
            Thèmes du verset {verset}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cles.map((cle) => (
              <button
                key={cle}
                onClick={() => void chargerTheme(cle).then(setOuvert)}
                className="rounded-full bg-white px-3 py-1.5 text-2xs font-semibold capitalize text-encre-700 shadow-2xs transition-colors hover:bg-or-100 hover:text-or-700"
              >
                {cle}
              </button>
            ))}
          </div>

          {ouvert && (
            <article className="mt-5 rounded-3xl border border-parchemin-400 bg-white p-4">
              <h3 className="font-serif text-lg font-bold text-encre-950">{ouvert.nom}</h3>
              <div className="mt-2 whitespace-pre-line text-xs leading-relaxed text-encre-700">
                <TexteAvecRenvois texte={ouvert.description} />
              </div>
            </article>
          )}

          <p className="mt-5 border-t border-parchemin-300 pt-3 text-2xs leading-relaxed text-encre-400">
            Bible thématique de Nave (1897). Les intitulés de thèmes sont restés dans la langue
            de l&apos;original ; les développements, eux, sont en français.
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
    return <p className="py-10 text-center text-2xs text-encre-400">Chargement…</p>;
  }
  if (!textes.length) {
    return (
      <p className="py-10 text-center text-xs leading-relaxed text-encre-400">
        Pas de commentaire pour ce chapitre.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-encre-400">
        <Sparkles className="h-3 w-3 text-or-500" />
        Matthew Henry · {passage.reference.livre.nom} {passage.reference.chapitre}
      </p>
      <div className="space-y-4">
        {textes.map((texte, index) => (
          <p key={index} className="whitespace-pre-line text-xs leading-relaxed text-encre-700">
            {texte}
          </p>
        ))}
      </div>
      <p className="mt-5 border-t border-parchemin-300 pt-3 text-2xs leading-relaxed text-encre-400">
        Commentaire de Matthew Henry (1710), traduction française.
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
    <div className="mb-4 flex flex-wrap gap-1">
      {passage.versets.map((v) => (
        <button
          key={v.v}
          onClick={() => onVerset(v.v)}
          className={`h-7 w-7 rounded-lg text-2xs font-bold transition-colors ${
            verset === v.v
              ? 'bg-or-400 text-encre-950'
              : 'bg-white text-encre-500 hover:bg-parchemin-200'
          }`}
        >
          {v.v}
        </button>
      ))}
    </div>
  );
}

function OngletComparer({ passage, verset }: { passage: Passage; verset: number | null }) {
  const numVerset = verset ?? 1;
  const refComplete = `${passage.reference.livre.nom} ${passage.reference.chapitre}:${numVerset}`;
  const refAbregee = `${passage.reference.livre.code} ${passage.reference.chapitre}:${numVerset}`;
  const comparaison = getComparaisonVerset(refComplete) || getComparaisonVerset(refAbregee);

  const versetActuel = passage.versets.find((v) => v.v === numVerset);
  const texteLsg = versetActuel ? versetActuel.t : comparaison?.lsg || '';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-center justify-between">
          <p className="font-serif text-xs font-bold text-amber-900">
            Comparatif : {passage.reference.livre.nom} {passage.reference.chapitre}:{numVerset}
          </p>
          <span className="text-2xs font-serif italic text-amber-800">
            Traductions parallèles
          </span>
        </div>
        <p className="mt-1 text-2xs text-amber-800/80 leading-relaxed">
          Comparez la précision du texte original (Segond 1910) avec la fluidité contemporaine (Bible du Semeur).
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Louis Segond 1910 */}
        <div className="rounded-2xl border border-amber-300/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-parchemin-200 pb-2">
            <span className="font-serif text-xs font-bold text-amber-900">
              Louis Segond 1910 (LSG)
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-semibold text-amber-800">
              Littérale historique
            </span>
          </div>
          <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
            « {texteLsg} »
          </p>
        </div>

        {/* 2. La Bible du Semeur */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="font-serif text-xs font-bold text-indigo-950">
              La Bible du Semeur (BDS)
            </span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-2xs font-semibold text-indigo-800">
              Équivalence dynamique
            </span>
          </div>
          <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
            « {comparaison?.bds || texteLsg} »
          </p>
        </div>

        {/* 3. Segond 21 */}
        {comparaison?.s21 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="font-serif text-xs font-bold text-emerald-950">
                Segond 21 (S21)
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-semibold text-emerald-800">
                Moderne
              </span>
            </div>
            <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
              « {comparaison.s21} »
            </p>
          </div>
        )}

        {/* 4. Nouvelle Français Courant */}
        {comparaison?.nfc && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-serif text-xs font-bold text-slate-800">
                Nouvelle Français Courant (NFC)
              </span>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-2xs font-semibold text-slate-700">
                Courante
              </span>
            </div>
            <p className="mt-3 font-serif text-sm leading-relaxed text-slate-900">
              « {comparaison.nfc} »
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
