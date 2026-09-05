'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, LockKeyhole, PenLine, RotateCcw, Sprout } from 'lucide-react';
import { FICHES_META } from '@/data/fichesMeta';
import { useAuth } from '@/lib/AuthContext';
import { usePasDeVie } from '@/lib/usePasDeVie';
import { actionActuelle, ISSUES_PAS, lienVersPas, pasARelire, type IssuePas, type PasDeVie, type RelecturePas } from '@/lib/pasDeVie';

type Enregistrer = (pas: PasDeVie, relecture: RelecturePas) => Promise<void>;

export function CartePasDeVie({ pas, onEnregistrer, compact = false }: {
  pas: PasDeVie; onEnregistrer: Enregistrer; compact?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState('');
  const bouton = useRef<HTMLButtonElement>(null);
  const formulaireId = useId();
  const derniere = pas.relectures.at(-1);
  const action = actionActuelle(pas);
  const titre = FICHES_META.find((fiche) => fiche.id === pas.ficheId)?.titre;
  return (
    <article className="pas-carte" aria-label={`Mon pas de vie · ${titre}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-encre-600">Fiche {String(pas.ficheId).padStart(2, '0')} · {titre}</p>
        <span className="pas-repere"><Sprout className="h-4 w-4" aria-hidden="true" /> {pasARelire(pas) ? 'À faire grandir' : 'Relu'}</span>
      </div>
      {pas.reference && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-or-700"><BookOpen className="h-4 w-4" aria-hidden="true" /> {pas.reference}</p>}
      {pas.moment && <p className="mt-5 whitespace-pre-wrap break-words text-base text-encre-600"><span className="font-semibold text-encre-950">Mon repère dans la journée · </span>{pas.moment}</p>}
      <p className="mt-4 text-sm font-semibold text-encre-600">{action !== pas.action ? 'Le petit pas que j’ai ajusté' : 'Le geste que j’ai choisi'}</p>
      <p className="mt-2 whitespace-pre-wrap break-words font-serif text-2xl leading-relaxed text-encre-950 sm:text-3xl">{action}</p>
      {!ouvert && derniere && (
        <div className="mt-5 border-l-2 border-or-400 pl-4 text-base leading-relaxed text-encre-700">
          <p className="text-sm font-semibold">{ISSUES_PAS[derniere.issue]} · {new Date(derniere.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
          {derniere.observation && <p className="mt-2 whitespace-pre-wrap break-words">{derniere.observation}</p>}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button ref={bouton} type="button" className="pas-bouton" aria-expanded={ouvert} aria-controls={formulaireId}
          onClick={() => { setOuvert(!ouvert); setMessage(''); }}>
          <PenLine className="h-4 w-4" aria-hidden="true" /> {ouvert ? 'Fermer la relecture' : derniere ? 'Revenir sur ce pas' : 'Qu’est-ce qui s’est passé ?'}
        </button>
        <Link href={lienVersPas(pas)} className="pas-lien"><BookOpen className="h-4 w-4" aria-hidden="true" /> Retrouver la Parole</Link>
      </div>
      <div id={formulaireId}>
        {ouvert && <RelectureForm pas={pas} onEnregistrer={onEnregistrer} onTerminer={() => {
          setOuvert(false); setMessage('Votre relecture est conservée dans votre carnet personnel.'); bouton.current?.focus();
        }} />}
      </div>
      <p role="status" className="mt-3 text-sm text-encre-600">{message}</p>
      {!compact && pas.relectures.length > 1 && (
        <details className="mt-4 border-t border-parchemin-300 pt-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-encre-700">Relire l’histoire de ce pas ({pas.relectures.length} relectures)</summary>
          <ol className="mt-4 space-y-5 border-l border-parchemin-400 pl-5">
            {pas.relectures.map((r, index) => <li key={`${r.date}-${index}`} className="text-base leading-relaxed text-encre-700">
              <p className="text-sm font-semibold">{new Date(r.date).toLocaleDateString('fr-FR')} · {ISSUES_PAS[r.issue]}</p>
              <p className="mt-1 whitespace-pre-wrap break-words font-serif italic">{r.action}</p>
              {r.observation && <p className="mt-2 whitespace-pre-wrap break-words">{r.observation}</p>}
              {r.prochainPas && <p className="mt-2 whitespace-pre-wrap break-words"><strong>Pour la suite : </strong>{r.prochainPas}</p>}
            </li>)}
          </ol>
        </details>
      )}
    </article>
  );
}

function RelectureForm({ pas, onEnregistrer, onTerminer }: {
  pas: PasDeVie; onEnregistrer: Enregistrer; onTerminer: () => void;
}) {
  const id = useId();
  const [issue, setIssue] = useState<IssuePas | ''>('');
  const [observation, setObservation] = useState('');
  const [prochainPas, setProchainPas] = useState('');
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const verrou = useRef(false);
  return (
    <form className="mt-6 border-t border-parchemin-300 pt-6" onSubmit={async (event) => {
      event.preventDefault();
      if (!issue || verrou.current) return;
      verrou.current = true; setSauvegarde(true); setErreur('');
      try {
        await onEnregistrer(pas, {
          version: 1, pasId: pas.id, date: Date.now(), issue,
          observation: observation.trim(), prochainPas: prochainPas.trim(),
          action: actionActuelle(pas), intention: pas.action, moment: pas.moment,
        });
        onTerminer();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : 'La relecture n’a pas été enregistrée. Réessayez.');
      } finally { verrou.current = false; setSauvegarde(false); }
    }}>
      <fieldset disabled={sauvegarde}>
        <legend className="font-serif text-xl font-bold text-encre-950">Accueillir ce qui a été vécu</legend>
        <p className="mt-2 text-base leading-relaxed text-encre-600">Un essai, une difficulté, une occasion à venir : vous pouvez partir de là.</p>
        <div className="mt-4 grid gap-2">
          {(Object.entries(ISSUES_PAS) as [IssuePas, string][]).map(([valeur, label]) => (
            <label key={valeur} className={`pas-choix ${issue === valeur ? 'pas-choix-actif' : ''}`}>
              <input type="radio" name={`${id}-issue`} value={valeur} required checked={issue === valeur}
                onChange={() => setIssue(valeur)} className="h-4 w-4 accent-[#112340]" />{label}
            </label>
          ))}
        </div>
        {issue && <p className="mt-4 text-base leading-relaxed text-encre-700" role="status">
          {issue === 'vecu' ? 'Prenez le temps de reconnaître ce que ce geste a rendu possible.'
            : issue === 'essaye' ? 'Qu’est-ce qui vous a freiné ? Vous pouvez choisir un geste plus petit ou en parler à une personne de confiance.'
            : issue === 'reprendre' ? 'Vous pouvez reprendre avec un geste plus petit, demander du soutien ou vous laisser du temps.'
              : 'Vous pouvez attendre une occasion réelle ou préciser un autre moment. Rien n’est à rattraper.'}
        </p>}
        <label htmlFor={`${id}-observation`} className="mt-6 block text-base font-semibold text-encre-950">Ce que j’ai remarqué <span className="font-normal text-encre-600">· facultatif</span></label>
        <textarea id={`${id}-observation`} className="pas-champ" rows={3} maxLength={3000} value={observation}
          onChange={(e) => setObservation(e.target.value)} placeholder="Une réaction différente, ce qui m’a aidé, une difficulté…" />
        <label htmlFor={`${id}-prochain`} className="mt-5 block text-base font-semibold text-encre-950">Mon prochain petit pas <span className="font-normal text-encre-600">· facultatif</span></label>
        <textarea id={`${id}-prochain`} className="pas-champ" rows={2} maxLength={1200} value={prochainPas}
          onChange={(e) => setProchainPas(e.target.value)} placeholder="Un geste assez simple pour l’essayer dans la même situation." />
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-encre-600"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Ces mots restent dans votre espace personnel. Vous choisissez ce que vous souhaitez raconter à votre cellule.</p>
        <button type="submit" disabled={!issue || sauvegarde} className="pas-bouton mt-5"><Check className="h-4 w-4" aria-hidden="true" />{sauvegarde ? 'Enregistrement…' : 'Garder cette relecture'}</button>
      </fieldset>
      {erreur && <p role="alert" className="mt-3 text-base text-bordeaux-800">{erreur}</p>}
    </form>
  );
}

export function PasDuJour({ ficheId }: { ficheId: number }) {
  const { user } = useAuth();
  const { pas, chargement, enregistrer } = usePasDeVie(user?.uid, ficheId);
  const aRevoir = pas.find(pasARelire) ?? pas[0];
  return (
    <section aria-labelledby="pas-du-jour" className="pas-du-jour">
      <div className="pas-du-jour-entete">
        <div className="flex items-center gap-3"><Sprout className="h-5 w-5 text-or-300" aria-hidden="true" /><h2 id="pas-du-jour" className="font-serif text-2xl">La Parole prend corps</h2></div>
        <Link href="/transformation" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-or-200">Mon chemin intérieur <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      {chargement ? <p className="p-6 text-base text-encre-600" role="status">Ouverture de votre carnet…</p>
        : aRevoir ? <CartePasDeVie key={`${aRevoir.ficheId}-${aRevoir.id}`} pas={aRevoir} onEnregistrer={enregistrer} compact />
          : <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div><p className="font-serif text-2xl font-bold text-encre-950">Une vérité. Un moment. Un petit pas.</p><p className="mt-2 max-w-xl text-base leading-relaxed text-encre-600">À la fin de votre temps à part, choisissez un geste à essayer dans votre journée. Vous pourrez revenir ici raconter ce qu’il a changé.</p></div>
            <Link href={`/aujourdhui?fiche=${ficheId}`} className="pas-bouton"><ArrowRight className="h-4 w-4" aria-hidden="true" />Ouvrir mon temps à part</Link>
          </div>}
      <p className="flex items-center gap-2 border-t border-parchemin-300 px-6 py-4 text-sm text-encre-600"><RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />Vous pouvez reprendre là où vous en êtes.</p>
    </section>
  );
}
