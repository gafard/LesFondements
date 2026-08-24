'use client';

import { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Edit3, Check, X, Palette } from 'lucide-react';

export type CouleurPostIt = 'jaune' | 'rose' | 'bleu' | 'vert';

export interface NotePostIt {
  id: string;
  ficheId: number;
  texte: string;
  couleur: CouleurPostIt;
  createdAt: number;
}

interface AnnotationsFicheProps {
  ficheId: number;
}

const STYLES_COULEURS: Record<CouleurPostIt, { bg: string; border: string; punaise: string; label: string }> = {
  jaune: {
    bg: 'bg-amber-100/90 text-amber-950',
    border: 'border-amber-300',
    punaise: 'punaise',
    label: 'Jaune doux',
  },
  rose: {
    bg: 'bg-rose-100/90 text-rose-950',
    border: 'border-rose-300',
    punaise: 'punaise punaise-rouge',
    label: 'Rose poudré',
  },
  bleu: {
    bg: 'bg-sky-100/90 text-sky-950',
    border: 'border-sky-300',
    punaise: 'punaise punaise-bleue',
    label: 'Bleu ciel',
  },
  vert: {
    bg: 'bg-emerald-100/90 text-emerald-950',
    border: 'border-emerald-300',
    punaise: 'punaise',
    label: 'Vert sauge',
  },
};

export default function AnnotationsFiche({ ficheId }: AnnotationsFicheProps) {
  const cleStockage = `lf.postits.fiche_${ficheId}`;
  const [notes, setNotes] = useState<NotePostIt[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const brut = localStorage.getItem(`lf.postits.fiche_${ficheId}`);
      return brut ? JSON.parse(brut) : [];
    } catch {
      return [];
    }
  });

  const [modeAjout, setModeAjout] = useState(false);
  const [nouveauTexte, setNouveauTexte] = useState('');
  const [couleurChoisie, setCouleurChoisie] = useState<CouleurPostIt>('jaune');
  const [noteEnEdition, setNoteEnEdition] = useState<string | null>(null);
  const [texteEdite, setTexteEdite] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(cleStockage, JSON.stringify(notes));
    } catch {
      /* ignorer */
    }
  }, [notes, cleStockage]);

  const ajouterNote = () => {
    if (!nouveauTexte.trim()) return;
    const nouvelle: NotePostIt = {
      id: 'note_' + Date.now(),
      ficheId,
      texte: nouveauTexte.trim(),
      couleur: couleurChoisie,
      createdAt: Date.now(),
    };
    setNotes((prev) => [nouvelle, ...prev]);
    setNouveauTexte('');
    setModeAjout(false);
  };

  const supprimerNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const sauvegarderEdition = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, texte: texteEdite.trim() } : n))
    );
    setNoteEnEdition(null);
  };

  return (
    <div className="space-y-4 my-8">
      {/* En-tête de section Post-its */}
      <div className="flex items-center justify-between border-b border-parchemin-300 pb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-or-700" />
          <h3 className="font-serif text-sm font-bold text-encre-950">
            Notes & Post-its personnels sur cette fiche ({notes.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setModeAjout((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-or-100 px-3.5 py-1.5 text-2xs font-bold text-or-800 transition-colors hover:bg-or-200"
        >
          <Plus className="h-3.5 w-3.5" />
          {modeAjout ? 'Annuler' : 'Coller un post-it'}
        </button>
      </div>

      {/* Formulaire d'ajout de post-it */}
      {modeAjout && (
        <div className={`relative rounded-3xl p-5 shadow-md border ${STYLES_COULEURS[couleurChoisie].bg} ${STYLES_COULEURS[couleurChoisie].border}`}>
          <span className={STYLES_COULEURS[couleurChoisie].punaise} style={{ top: '-8px', left: '20px' }} />

          <textarea
            value={nouveauTexte}
            onChange={(e) => setNouveauTexte(e.target.value)}
            placeholder="Écrivez une réflexion, une question personnelle, une parole reçue..."
            rows={3}
            className="manuscrit w-full resize-none bg-transparent text-lg text-encre-950 placeholder-encre-400 focus:outline-none"
            autoFocus
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-encre-950/10 pt-3">
            {/* Sélecteur de couleur */}
            <div className="flex items-center gap-1.5">
              {(['jaune', 'rose', 'bleu', 'vert'] as CouleurPostIt[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleurChoisie(c)}
                  className={`h-6 w-6 rounded-full border transition-transform ${
                    c === 'jaune'
                      ? 'bg-amber-200 border-amber-400'
                      : c === 'rose'
                      ? 'bg-rose-200 border-rose-400'
                      : c === 'bleu'
                      ? 'bg-sky-200 border-sky-400'
                      : 'bg-emerald-200 border-emerald-400'
                  } ${couleurChoisie === c ? 'scale-125 ring-2 ring-encre-900' : 'hover:scale-110'}`}
                  title={STYLES_COULEURS[c].label}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModeAjout(false)}
                className="rounded-full px-3 py-1.5 text-2xs font-bold text-encre-600 hover:bg-black/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={ajouterNote}
                disabled={!nouveauTexte.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-4 py-1.5 text-2xs font-bold text-parchemin-100 shadow-xs transition-colors hover:bg-encre-900 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Coller sur la fiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grille des post-its existants */}
      {notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const style = STYLES_COULEURS[note.couleur] || STYLES_COULEURS.jaune;
            const enEdition = noteEnEdition === note.id;

            return (
              <div
                key={note.id}
                className={`relative rounded-3xl p-5 shadow-md border transition-transform hover:-translate-y-0.5 ${style.bg} ${style.border}`}
              >
                <span className={style.punaise} style={{ top: '-8px', left: '20px' }} />

                {enEdition ? (
                  <div className="space-y-3">
                    <textarea
                      value={texteEdite}
                      onChange={(e) => setTexteEdite(e.target.value)}
                      rows={3}
                      className="manuscrit w-full resize-none bg-transparent text-lg text-encre-950 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 border-t border-encre-950/10 pt-2">
                      <button
                        onClick={() => setNoteEnEdition(null)}
                        className="text-2xs font-bold text-encre-600"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => sauvegarderEdition(note.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-encre-950 px-3 py-1 text-2xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" /> Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="manuscrit text-xl leading-relaxed text-encre-950 whitespace-pre-wrap">
                      {note.texte}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-encre-950/10 pt-2 text-3xs text-encre-500 font-sans">
                      <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setNoteEnEdition(note.id);
                            setTexteEdite(note.texte);
                          }}
                          className="p-1 text-encre-500 hover:text-encre-950 transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => supprimerNote(note.id)}
                          className="p-1 text-encre-500 hover:text-rose-700 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !modeAjout && (
          <div className="rounded-2xl border border-dashed border-parchemin-400 p-4 text-center text-xs text-encre-400 font-serif">
            Aucun post-it collé sur cette fiche. Cliquez sur « Coller un post-it » pour épingler vos notes.
          </div>
        )
      )}
    </div>
  );
}
