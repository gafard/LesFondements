'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, Grip, Highlighter, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { CouleurPostIt, DocumentAnnotations, NotePostIt } from '@/lib/annotations';

interface AnnotationsFicheProps {
  document: DocumentAnnotations;
  onChanger: (document: DocumentAnnotations) => void;
}

const COULEURS: Record<
  CouleurPostIt,
  { classe: string; pastille: string; label: string }
> = {
  jaune: {
    classe: 'post-it-jaune',
    pastille: 'bg-[#f7df6f] border-[#c9a92b]',
    label: 'Jaune pâle',
  },
  rose: {
    classe: 'post-it-rose',
    pastille: 'bg-[#efb8c2] border-[#c67c8b]',
    label: 'Rose poudré',
  },
  bleu: {
    classe: 'post-it-bleu',
    pastille: 'bg-[#afd2ef] border-[#699bc5]',
    label: 'Bleu ciel',
  },
};

interface Glissement {
  id: string;
  pointerId: number;
  decalageX: number;
  decalageY: number;
}

const BORNE_NOTE = 184;

export default function AnnotationsFiche({ document, onChanger }: AnnotationsFicheProps) {
  const planRef = useRef<HTMLDivElement>(null);
  const glissementRef = useRef<Glissement | null>(null);
  const [texte, setTexte] = useState('');
  const [couleur, setCouleur] = useState<CouleurPostIt>('jaune');
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const mettreAJourNote = (id: string, modification: Partial<NotePostIt>) => {
    onChanger({
      ...document,
      notes: document.notes.map((note) =>
        note.id === id ? { ...note, ...modification, updatedAt: Date.now() } : note
      ),
    });
  };

  const ajouter = () => {
    if (!texte.trim()) return;
    const index = document.notes.length;
    const maintenant = Date.now();
    const note: NotePostIt = {
      id: `note_${maintenant}`,
      texte: texte.trim(),
      couleur,
      x: 14 + (index % 2) * 36,
      y: 74 + (index % 4) * 128,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    onChanger({ ...document, notes: [...document.notes, note] });
    setTexte('');
    setAjoutOuvert(false);
  };

  const supprimer = (id: string) => {
    onChanger({ ...document, notes: document.notes.filter((note) => note.id !== id) });
  };

  const commencerGlissement = (note: NotePostIt, event: ReactPointerEvent<HTMLButtonElement>) => {
    const plan = planRef.current;
    if (!plan) return;
    const rectangle = plan.getBoundingClientRect();
    glissementRef.current = {
      id: note.id,
      pointerId: event.pointerId,
      decalageX: event.clientX - rectangle.left - note.x,
      decalageY: event.clientY - rectangle.top - note.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onChanger({
      ...document,
      notes: [...document.notes.filter((candidate) => candidate.id !== note.id), note],
    });
  };

  const glisser = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const glissement = glissementRef.current;
    const plan = planRef.current;
    if (!glissement || glissement.pointerId !== event.pointerId || !plan) return;
    const rectangle = plan.getBoundingClientRect();
    const x = Math.max(
      4,
      Math.min(rectangle.width - BORNE_NOTE, event.clientX - rectangle.left - glissement.decalageX)
    );
    const y = Math.max(
      46,
      Math.min(rectangle.height - 150, event.clientY - rectangle.top - glissement.decalageY)
    );
    mettreAJourNote(glissement.id, { x, y });
  };

  const terminerGlissement = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (glissementRef.current?.pointerId === event.pointerId) {
      glissementRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <aside className="lg:sticky lg:top-6" aria-label="Marge d’annotations personnelle">
      <div className="bureau-annotations overflow-hidden rounded-[1.6rem] border border-[#755538]/35 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#5e432e]/20 bg-[#0b1d38] px-4 py-3 text-parchemin-100">
          <div>
            <p className="text-3xs font-black uppercase tracking-[0.2em] text-or-300">Marge personnelle</p>
            <p className="mt-0.5 font-serif text-sm font-bold">Post-it & griffonnages</p>
          </div>
          <button
            type="button"
            onClick={() => setAjoutOuvert((ouvert) => !ouvert)}
            className="grid h-9 w-9 place-items-center rounded-full bg-or-400 text-encre-950 shadow-md transition-transform hover:scale-105"
            aria-label={ajoutOuvert ? 'Fermer le nouveau post-it' : 'Coller un nouveau post-it'}
          >
            {ajoutOuvert ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {ajoutOuvert && (
          <div className="border-b border-[#755538]/20 bg-[#f8f1e4] p-3">
            <textarea
              value={texte}
              onChange={(event) => setTexte(event.target.value)}
              rows={3}
              placeholder="Une pensée, une question, une parole reçue…"
              className="manuscrit w-full resize-none rounded-xl border border-parchemin-400 bg-white/85 px-3 py-2 text-base text-encre-950 outline-none focus:border-or-500"
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-2" aria-label="Couleur du post-it">
                {(Object.keys(COULEURS) as CouleurPostIt[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCouleur(option)}
                    className={`h-7 w-7 rounded-full border ${COULEURS[option].pastille} ${
                      couleur === option ? 'ring-2 ring-encre-950 ring-offset-2' : ''
                    }`}
                    aria-label={COULEURS[option].label}
                    aria-pressed={couleur === option}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={ajouter}
                disabled={!texte.trim()}
                className="rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-white disabled:opacity-40"
              >
                Coller
              </button>
            </div>
          </div>
        )}

        <div
          ref={planRef}
          data-testid="annotation-board"
          className="plan-annotations relative h-[620px] overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-4 top-3 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-[#73583f]/65">
            <span>Fiche de travail</span>
            <span>{document.notes.length} note{document.notes.length > 1 ? 's' : ''}</span>
          </div>

          {document.notes.map((note) => {
            const style = COULEURS[note.couleur] ?? COULEURS.jaune;
            return (
              <article
                key={note.id}
                className={`${style.classe} !absolute w-[180px] rounded-[3px] p-3 shadow-lg`}
                style={{ left: note.x, top: note.y }}
              >
                <div className="flex items-center justify-between border-b border-encre-950/10 pb-1.5">
                  <button
                    type="button"
                    onPointerDown={(event) => commencerGlissement(note, event)}
                    onPointerMove={glisser}
                    onPointerUp={terminerGlissement}
                    onPointerCancel={terminerGlissement}
                    className="-ml-1 inline-flex touch-none items-center gap-1 rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-encre-700/70 hover:bg-white/30"
                    aria-label={`Déplacer le post-it : ${note.texte.slice(0, 40)}`}
                    title="Maintenez et déplacez le post-it"
                  >
                    <Grip className="h-3 w-3" /> Déplacer
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimer(note.id)}
                    className="rounded p-1 text-encre-600/60 hover:bg-white/40 hover:text-rose-800"
                    aria-label="Supprimer ce post-it"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={note.texte}
                  onChange={(event) => mettreAJourNote(note.id, { texte: event.target.value })}
                  className="manuscrit mt-2 h-24 w-full resize-none bg-transparent text-base leading-snug text-encre-950 outline-none"
                  aria-label="Texte du post-it"
                />
              </article>
            );
          })}

          {document.notes.length === 0 && (
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[#73583f]/60">
              <StickyNote className="mx-auto h-7 w-7" strokeWidth={1.4} />
              <p className="mt-2 font-serif text-sm font-bold">Votre marge est encore libre.</p>
              <p className="mt-1 text-2xs leading-relaxed">Collez une note, puis déplacez-la comme sur un vrai bureau.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[#755538]/20 bg-[#efe3d0] px-4 py-3 text-2xs text-encre-600">
          <Highlighter className="h-3.5 w-3.5 text-or-700" />
          <span>{document.surlignages.length} passage{document.surlignages.length > 1 ? 's' : ''} surligné{document.surlignages.length > 1 ? 's' : ''}</span>
          <span className="ml-auto inline-flex items-center gap-1 font-bold text-emerald-900"><Check className="h-3 w-3" /> Sauvegarde auto</span>
        </div>
      </div>
    </aside>
  );
}
