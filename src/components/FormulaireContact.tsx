'use client';

import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { hasRemoteBackend } from '@/lib/parcoursStore';
import { getFirebaseDb } from '@/lib/firebase';

/** Les retours et besoins : écrire à l'équipe du parcours. */
export default function FormulaireContact() {
  const { user } = useAuth();

  const [categorie, setCategorie] = useState<'suggestion' | 'temoignage' | 'aide' | 'theologie'>('suggestion');
  const [nom, setNom] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageEnvoye, setMessageEnvoye] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');

  const nomAffiche = nom || user?.displayName || '';
  const emailAffiche = email || user?.email || '';

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
    </div>
  );
}
