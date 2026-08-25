'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Loader2, Mic, PenLine, RotateCcw, Square } from 'lucide-react';
import { comparer, type Resultat } from '@/lib/recitation';
import { jetonFirebase } from '@/lib/firebase';

/**
 * L'épreuve de mémoire, en quatre temps.
 *
 * Le mode précédent affichait le verset pendant qu'on le récitait, et
 * surlignait même le mot suivant : c'était un prompteur, et il annonçait
 * « proclamé de mémoire » ce qui n'était que lu. Or reconnaître un texte
 * qu'on a sous les yeux donne l'impression de le savoir sans qu'on le
 * sache : la fausse assurance était le vrai défaut.
 *
 * Ici le verset disparaît avant qu'on parle. On lit, on recopie, l'écran se
 * retourne, on récite dans le vide, puis le texte revient avec les écarts.
 */

type Etape = 'lire' | 'ecrire' | 'reciter' | 'verdict';

export default function EpreuveMemoire({
  reference,
  texte,
  onScore,
}: {
  reference: string;
  texte: string;
  onScore?: (score: number) => void;
}) {
  const [etape, setEtape] = useState<Etape>('lire');
  const [copie, setCopie] = useState('');
  const [enEcoute, setEnEcoute] = useState(false);
  const [enAnalyse, setEnAnalyse] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [souci, setSouci] = useState<string | null>(null);

  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);

  const recommencer = () => {
    setEtape('lire');
    setCopie('');
    setResultat(null);
    setSouci(null);
  };

  // ── Écouter la récitation ───────────────────────────────────
  const analyser = useCallback(
    async (audio: Blob) => {
      setEnAnalyse(true);
      setSouci(null);
      try {
        const jeton = await jetonFirebase();
        const corps = new FormData();
        corps.append('audio', audio, 'recitation.webm');
        const reponse = await fetch('/api/memorisation/recitation', {
          method: 'POST',
          headers: jeton ? { Authorization: `Bearer ${jeton}` } : {},
          body: corps,
        });
        if (!reponse.ok) {
          const detail = (await reponse.json().catch(() => null)) as { error?: string } | null;
          setSouci(
            detail?.error ??
              'Votre récitation n’a pas pu être écoutée. Réessayez, ou jugez-en vous-même.'
          );
          setEtape('verdict');
          return;
        }
        const { dit } = (await reponse.json()) as { dit: string };
        const issue = comparer(texte, dit);
        setResultat(issue);
        onScore?.(issue.score);
        setEtape('verdict');
      } catch {
        setSouci('La connexion a manqué. Votre récitation n’a pas pu être écoutée.');
        setEtape('verdict');
      } finally {
        setEnAnalyse(false);
      }
    },
    [texte, onScore]
  );

  const demarrer = async () => {
    setSouci(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined;
      const enr = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      morceaux.current = [];
      enr.ondataavailable = (e) => e.data.size > 0 && morceaux.current.push(e.data);
      enr.onstop = () => {
        flux.getTracks().forEach((p) => p.stop());
        void analyser(new Blob(morceaux.current, { type: type ?? 'audio/webm' }));
      };
      enregistreur.current = enr;
      enr.start();
      setEnEcoute(true);
    } catch {
      setSouci('Le micro n’est pas accessible. Autorisez-le dans votre navigateur.');
    }
  };

  const arreter = () => {
    enregistreur.current?.stop();
    enregistreur.current = null;
    setEnEcoute(false);
  };

  useEffect(() => () => enregistreur.current?.stop(), []);

  const assezRecopie = copie.trim().split(/\s+/).filter(Boolean).length >= 4;

  return (
    <div className="feuille pose-2 relative rounded-3xl border border-parchemin-300 p-5 shadow-md sm:p-6">
      <span className="ruban -top-3 left-9 -rotate-2 rounded-[2px]" />

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="manuscrit text-2xl font-bold text-or-700">{reference}</p>
        <span className="text-3xs font-bold uppercase tracking-[0.16em] text-encre-400">
          {etape === 'lire'
            ? '1 · Lire'
            : etape === 'ecrire'
              ? '2 · Recopier'
              : etape === 'reciter'
                ? '3 · Réciter'
                : '4 · Vérifier'}
        </span>
      </div>

      {/* ── 1. Lire ── */}
      {etape === 'lire' && (
        <>
          <p className="mt-4 font-serif text-lg leading-relaxed text-encre-900">{texte}</p>
          <button
            onClick={() => setEtape('ecrire')}
            className="bouton-or mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
          >
            <PenLine className="h-3.5 w-3.5" /> Je l’ai lu, je le recopie
          </button>
        </>
      )}

      {/* ── 2. Recopier ── */}
      {etape === 'ecrire' && (
        <>
          <p className="mt-4 font-serif text-sm leading-relaxed text-encre-500">{texte}</p>
          <textarea
            autoFocus
            rows={3}
            value={copie}
            onChange={(e) => setCopie(e.target.value)}
            placeholder="Recopiez-le de votre main — c’est ce geste qui grave."
            className="mt-3 w-full resize-none rounded-2xl border border-parchemin-400 bg-parchemin-50 px-4 py-3 font-serif text-sm leading-relaxed text-encre-800 outline-none focus:border-or-400"
          />
          <button
            onClick={() => setEtape('reciter')}
            disabled={!assezRecopie}
            className="bouton-or mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold disabled:opacity-30"
          >
            Je suis prêt à réciter
          </button>
        </>
      )}

      {/* ── 3. Réciter, le verset masqué ── */}
      {etape === 'reciter' && (
        <>
          <div className="mt-4 rounded-2xl border border-dashed border-parchemin-500 bg-parchemin-100/60 px-4 py-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-encre-300" strokeWidth={1.5} />
            <p className="manuscrit mt-2 text-xl font-bold text-encre-500">
              Le verset est retourné
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-encre-400">
              Dites-le comme il vous vient. Rien ne s’affichera avant la fin.
            </p>
          </div>

          {enAnalyse ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-encre-500">
              <Loader2 className="h-4 w-4 animate-spin" /> On vous écoute…
            </p>
          ) : (
            <button
              onClick={enEcoute ? arreter : demarrer}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-colors ${
                enEcoute
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bouton-or'
              }`}
            >
              {enEcoute ? (
                <>
                  <Square className="h-4 w-4 fill-current" /> J’ai fini
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Réciter
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* ── 4. Le verset revient, avec les écarts ── */}
      {etape === 'verdict' && (
        <>
          {resultat && (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-4xl font-bold text-encre-950">
                  {resultat.score}%
                </span>
                <span className="text-2xs text-encre-500">
                  {resultat.score >= 90
                    ? 'Vous le savez.'
                    : resultat.score >= 60
                      ? 'C’est en chemin.'
                      : 'À reprendre — c’est ainsi qu’on apprend.'}
                </span>
              </div>

              <p className="mt-3 font-serif text-base leading-relaxed">
                {resultat.mots.map((m, i) => (
                  <span
                    key={i}
                    className={
                      m.etat === 'juste'
                        ? 'text-encre-900'
                        : m.etat === 'approche'
                          ? 'rounded bg-or-100 px-0.5 text-or-800'
                          : 'rounded bg-rose-100 px-0.5 text-rose-800 line-through decoration-rose-400/60'
                    }
                  >
                    {m.mot}{' '}
                  </span>
                ))}
              </p>

              {resultat.entendu && (
                <p className="mt-3 rounded-2xl bg-parchemin-100 px-4 py-2.5 text-2xs leading-relaxed text-encre-500">
                  <span className="font-bold">Entendu :</span> « {resultat.entendu} »
                </p>
              )}
            </>
          )}

          {souci && (
            <p className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-2xs leading-relaxed text-amber-900">
              {souci}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={recommencer}
              className="inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-800"
            >
              <RotateCcw className="h-3 w-3" /> Reprendre
            </button>
            {/* Une machine n'a pas le dernier mot sur un verset appris pour
                la vie intérieure : la personne peut la corriger. */}
            {resultat && resultat.score < 100 && (
              <button
                onClick={() => {
                  setResultat({ ...resultat, score: 100, mots: resultat.mots.map((m) => ({ ...m, etat: 'juste' })) });
                  onScore?.(100);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-parchemin-400 px-4 py-2 text-2xs font-bold text-encre-600 transition-colors hover:bg-parchemin-100"
              >
                <Check className="h-3 w-3" /> Je l’avais bien dit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
