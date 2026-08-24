'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Link2,
  Mail,
  Plus,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { getInvites, inviteByEmail, revokeInvite, subscribe } from '@/lib/parcoursStore';
import type { GroupInvite, ParcoursGroup } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface InvitePanelProps {
  group: ParcoursGroup;
  inviter: { uid: string; displayName: string };
  tone?: 'nuit' | 'clair';
}

/**
 * Deux façons d'inviter, comme demandé : par adresse e-mail, ou en partageant
 * le code / le lien du groupe.
 *
 * Sans service d'envoi branché, l'invitation par e-mail est enregistrée côté
 * groupe (la personne la retrouve à son inscription) et le bouton ouvre le
 * logiciel de messagerie de l'utilisateur avec un message déjà rédigé. Rien
 * n'est envoyé à sa place sans qu'il ne le voie.
 */
export default function InvitePanel({ group, inviter, tone = 'nuit' }: InvitePanelProps) {
  const nuit = tone === 'nuit';
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [copied, setCopied] = useState<'code' | 'lien' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/rejoindre/${group.inviteCode}`;
    return `${window.location.origin}/rejoindre/${group.inviteCode}`;
  }, [group.inviteCode]);

  useEffect(() => {
    const load = () => void getInvites(group.id).then(setInvites);
    load();
    return subscribe(`invites:${group.id}`, load);
  }, [group.id]);

  const addDraft = () => {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setError(`« ${value} » ne ressemble pas à une adresse e-mail.`);
      return;
    }
    if (emails.includes(value)) {
      setDraft('');
      return;
    }
    setEmails([...emails, value]);
    setDraft('');
    setError(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      addDraft();
    } else if (event.key === 'Backspace' && !draft && emails.length) {
      setEmails(emails.slice(0, -1));
    }
  };

  const mailtoHref = useMemo(() => {
    const subject = `Rejoins-moi sur le parcours « Les Fondements »`;
    const body = [
      `Bonjour,`,
      ``,
      `Je démarre « Les Fondements », un parcours de 20 fiches à vivre en petit groupe,`,
      `et j'aimerais beaucoup que tu en fasses partie.`,
      ``,
      `Le groupe : ${group.name}`,
      `Le lieu : ${group.place.city}`,
      ``,
      `Pour nous rejoindre : ${joinUrl}`,
      `Ou entre le code ${group.inviteCode} dans l'application.`,
      ``,
      `À très vite,`,
      inviter.displayName,
    ].join('\n');
    return `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [emails, group, joinUrl, inviter.displayName]);

  const handleRegister = async () => {
    if (!emails.length) return;
    await inviteByEmail(group.id, emails, inviter);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copy = async (value: string, what: 'code' | 'lien') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Copie impossible depuis ce navigateur. Sélectionnez le texte à la main.');
    }
  };

  const share = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      await copy(joinUrl, 'lien');
      return;
    }
    try {
      await navigator.share({
        title: `Rejoins « ${group.name} »`,
        text: `Le parcours Les Fondements, en petit groupe. Code : ${group.inviteCode}`,
        url: joinUrl,
      });
    } catch {
      /* partage annulé par l'utilisateur */
    }
  };

  const pending = invites.filter((invite) => invite.status === 'envoye');

  const cardClass = nuit
    ? 'rounded-3xl border border-white/12 bg-white/[0.05] p-5'
    : 'rounded-3xl border border-parchemin-400 bg-white p-5';
  const titleClass = nuit
    ? 'font-serif text-base font-bold text-parchemin-100'
    : 'font-serif text-base font-bold text-encre-900';
  const hintClass = nuit ? 'text-2xs text-parchemin-100/55' : 'text-2xs text-encre-400';

  return (
    <div className="space-y-4">
      {/* ── Par e-mail ─────────────────────────────────────── */}
      <div className={cardClass}>
        <div className="flex items-center gap-2">
          <Mail className={`h-4 w-4 ${nuit ? 'text-or-300' : 'text-or-600'}`} strokeWidth={2} />
          <h3 className={titleClass}>Inviter par e-mail</h3>
        </div>
        <p className={`mt-1 ${hintClass}`}>
          Ajoutez les adresses, puis ouvrez votre messagerie : le message est déjà écrit, vous
          n&apos;avez qu&apos;à l&apos;envoyer.
        </p>

        <div
          className={`mt-3.5 flex flex-wrap items-center gap-1.5 rounded-2xl px-3 py-2.5 ${
            nuit ? 'verre' : 'border border-parchemin-400 bg-parchemin-50'
          }`}
        >
          {emails.map((email) => (
            <span
              key={email}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold ${
                nuit ? 'bg-or-400/18 text-or-100' : 'bg-or-100 text-or-700'
              }`}
            >
              {email}
              <button
                type="button"
                onClick={() => setEmails(emails.filter((e) => e !== email))}
                className="opacity-60 transition-opacity hover:opacity-100"
                aria-label={`Retirer ${email}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addDraft}
            placeholder={emails.length ? 'Ajouter…' : 'sarah@exemple.com'}
            className={`min-w-[9rem] flex-1 bg-transparent py-1 text-sm outline-none ${
              nuit
                ? 'text-parchemin-100 placeholder:text-parchemin-100/35'
                : 'text-encre-900 placeholder:text-encre-300'
            }`}
          />
          {draft && (
            <button
              type="button"
              onClick={addDraft}
              className={`rounded-full p-1 ${nuit ? 'text-or-300' : 'text-or-600'}`}
              aria-label="Ajouter cette adresse"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={emails.length ? mailtoHref : undefined}
            onClick={() => emails.length && void handleRegister()}
            aria-disabled={!emails.length}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-2xs font-bold transition-all ${
              emails.length
                ? 'bouton-or'
                : nuit
                  ? 'cursor-not-allowed bg-white/8 text-parchemin-100/40'
                  : 'cursor-not-allowed bg-parchemin-200 text-encre-300'
            }`}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
            Ouvrir ma messagerie {emails.length > 0 && `(${emails.length})`}
          </a>
          {emails.length > 0 && (
            <button
              type="button"
              onClick={handleRegister}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-2xs font-bold transition-colors ${
                nuit
                  ? 'bg-white/10 text-parchemin-100 hover:bg-white/18'
                  : 'bg-parchemin-100 text-encre-700 hover:bg-parchemin-200'
              }`}
            >
              {saved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
              {saved ? 'Invitations enregistrées' : 'Enregistrer sans envoyer'}
            </button>
          )}
        </div>

        {pending.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3.5">
            <p className={`mb-2 ${hintClass}`}>Invitations en attente</p>
            <ul className="space-y-1.5">
              {pending.map((invite) => (
                <li
                  key={invite.id}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-2xs ${
                    nuit ? 'bg-white/[0.05] text-parchemin-100/75' : 'bg-parchemin-50 text-encre-600'
                  }`}
                >
                  <span className="truncate">{invite.email}</span>
                  <button
                    type="button"
                    onClick={() => void revokeInvite(group.id, invite.id)}
                    className="shrink-0 opacity-50 transition-opacity hover:opacity-100"
                    aria-label={`Annuler l'invitation de ${invite.email}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Par code / lien ────────────────────────────────── */}
      <div className={cardClass}>
        <div className="flex items-center gap-2">
          <Link2 className={`h-4 w-4 ${nuit ? 'text-or-300' : 'text-or-600'}`} strokeWidth={2} />
          <h3 className={titleClass}>Partager le code du groupe</h3>
        </div>
        <p className={`mt-1 ${hintClass}`}>
          À dire de vive voix, à écrire sur un message, à afficher au fond de la salle.
        </p>

        <div
          className={`mt-3.5 flex items-center justify-between gap-3 rounded-2xl px-4 py-4 ${
            nuit ? 'bg-or-400/10 ring-1 ring-or-400/25' : 'bg-or-50 ring-1 ring-or-200'
          }`}
        >
          <span
            className={`font-mono text-xl font-bold tracking-[0.22em] ${
              nuit ? 'text-or-200' : 'text-or-700'
            }`}
          >
            {group.inviteCode}
          </span>
          <button
            type="button"
            onClick={() => copy(group.inviteCode, 'code')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
              nuit
                ? 'bg-white/12 text-parchemin-100 hover:bg-white/20'
                : 'bg-white text-encre-700 hover:bg-parchemin-100'
            }`}
          >
            {copied === 'code' ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied === 'code' ? 'Copié' : 'Copier'}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy(joinUrl, 'lien')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-2xs font-bold transition-colors ${
              nuit
                ? 'bg-white/10 text-parchemin-100 hover:bg-white/18'
                : 'bg-parchemin-100 text-encre-700 hover:bg-parchemin-200'
            }`}
          >
            {copied === 'lien' ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {copied === 'lien' ? 'Lien copié' : "Copier le lien d'invitation"}
          </button>
          <button
            type="button"
            onClick={share}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-2xs font-bold transition-colors ${
              nuit
                ? 'bg-white/10 text-parchemin-100 hover:bg-white/18'
                : 'bg-parchemin-100 text-encre-700 hover:bg-parchemin-200'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
          </button>
        </div>
      </div>

      {error && (
        <p
          className={`rounded-xl px-3.5 py-2.5 text-2xs ${
            nuit ? 'bg-rose-500/12 text-rose-200' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
