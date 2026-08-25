'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Sparkles,
  BookOpen,
  Users,
  Check,
  Send,
  X,
  Clock,
  Smartphone,
  Calendar,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  verifierSupportNotifications,
  obtenirEtatPermission,
  chargerPreferencesLocales,
  sauvegarderPreferencesLocales,
  activerNotifications,
  desactiverNotifications,
  envoyerNotificationTest,
  diagnostiquerEnvironnement,
  NotificationPreferences,
  PREFERENCES_DEFAUT,
  DiagnosticPWA,
} from '@/lib/notifications';
import { useAuth } from '@/lib/AuthContext';

interface NotificationCenterProps {
  ouvert: boolean;
  onFermer: () => void;
}

export default function NotificationCenter({ ouvert, onFermer }: NotificationCenterProps) {
  const { user } = useAuth();
  const [supporte, setSupporte] = useState(true);
  const [active, setActive] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [messageSucces, setMessageSucces] = useState<string | null>(null);
  const [messageErreur, setMessageErreur] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticPWA | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>(PREFERENCES_DEFAUT);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const sup = verifierSupportNotifications();
      setSupporte(sup);
      setDiagnostic(diagnostiquerEnvironnement());
      if (sup) {
        const perm = obtenirEtatPermission();
        setActive(perm === 'granted');
        setPrefs(chargerPreferencesLocales());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ouvert]);

  if (!ouvert) return null;

  const basculerActivation = async () => {
    setChargement(true);
    setMessageSucces(null);
    setMessageErreur(null);

    if (active) {
      await desactiverNotifications();
      setActive(false);
      setMessageSucces('Les notifications ont été désactivées sur cet appareil.');
    } else {
      const res = await activerNotifications(user?.uid, prefs);
      if (res.success) {
        setActive(true);
        setMessageSucces('✨ Cet appareil est connecté et prêt à recevoir vos rappels spirituels.');
      } else {
        setMessageErreur(res.error || 'Impossible d’activer les notifications.');
      }
    }
    setChargement(false);
  };

  const majPreference = (cle: keyof NotificationPreferences, valeur: boolean | string) => {
    const nouvelles = { ...prefs, [cle]: valeur };
    setPrefs(nouvelles);
    sauvegarderPreferencesLocales(nouvelles);
  };

  const tester = async () => {
    setChargement(true);
    setMessageSucces(null);
    setMessageErreur(null);
    const res = await envoyerNotificationTest({
      title: 'Les Fondements · Rappel du Disciple',
      body: '« Tu es mon refuge et mon bouclier ; j’espère en ta promesse. » (Ps 119:114)',
      url: '/dashboard',
    });
    if (res.success) {
      setMessageSucces('🔔 Notification de test envoyée avec succès ! Regardez le haut de votre écran.');
    } else {
      setMessageErreur(res.error || 'Erreur lors de l’envoi du test.');
    }
    setChargement(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Arrière-plan flouté */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onFermer}
        className="fixed inset-0 bg-encre-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Carte style Carnet / Feuille de travail */}
      <div className="feuille relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-4xl border-2 border-parchemin-400 p-6 shadow-2xl sm:p-8">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
        <span className="attache-pince -top-3 right-10" />

        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-parchemin-300 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-or-100 text-or-800 shadow-2xs border border-or-300">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <span className="text-3xs font-bold uppercase tracking-[0.22em] text-or-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Table de Veille & Rappels
              </span>
              <h2 className="manuscrit text-2xl font-bold text-encre-950 leading-tight">
                Notifications Professionnelles
              </h2>
            </div>
          </div>
          <button
            onClick={onFermer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-encre-400 transition-colors hover:bg-parchemin-200 hover:text-encre-800"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diagnostic Appareil / PWA */}
        {diagnostic && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-3xs font-semibold text-encre-600 bg-parchemin-100/80 p-2.5 rounded-2xl border border-parchemin-300">
            <span className="flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-or-700" />
              {diagnostic.estIOS ? 'iOS (Apple)' : diagnostic.estAndroid ? 'Android' : 'Bureau / Ordinateur'}
            </span>
            <span>•</span>
            <span className={diagnostic.estPWA ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
              {diagnostic.estPWA ? '📱 Mode App (PWA installée)' : '🌐 Navigateur Web'}
            </span>
            <span>•</span>
            <span className={active ? 'text-emerald-700 font-bold' : 'text-encre-500'}>
              {active ? '🟢 Service Push Actif' : '⚪ En attente d’activation'}
            </span>
          </div>
        )}

        {/* Conseil iOS si non PWA */}
        {diagnostic?.estIOS && !diagnostic.estPWA && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-2xs text-amber-900 border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Note pour iPhone :</strong> Pour recevoir les notifications sur iOS, appuyez sur le bouton de partage de Safari ➔ <strong>« Sur l’écran d’accueil »</strong>, puis ouvrez l’application depuis votre écran.
            </p>
          </div>
        )}

        {/* Corps */}
        <div className="mt-5 space-y-5">
          {!supporte ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-center text-xs text-rose-900 border border-rose-200">
              Votre navigateur ne prend pas en charge les notifications Web Push.
            </div>
          ) : (
            <>
              {/* Interrupteur Principal */}
              <div className="flex items-center justify-between rounded-3xl bg-white p-4.5 border border-parchemin-300 shadow-xs">
                <div>
                  <p className="font-serif text-sm font-bold text-encre-950">
                    {active ? 'Rappels activés sur cet appareil' : 'Recevoir les rappels spirituels'}
                  </p>
                  <p className="text-3xs text-encre-500 font-serif italic">
                    Service Worker réactif · Synchronisation Cloudflare & Firebase
                  </p>
                </div>
                <button
                  type="button"
                  onClick={basculerActivation}
                  disabled={chargement}
                  className={`inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-2xs font-bold transition-all shadow-xs ${
                    active
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-encre-900 text-white hover:bg-encre-800'
                  }`}
                >
                  {active ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Actif
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5" /> M&apos;inscrire
                    </>
                  )}
                </button>
              </div>

              {/* 4 Canaux Spécialisés */}
              <div className="space-y-2.5">
                <p className="text-3xs font-bold uppercase tracking-wider text-encre-500">
                  Canaux de rappels personnalisés
                </p>

                {/* 1. Goutte de Rosée */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer border border-parchemin-300/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-or-100 text-or-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-encre-900">Goutte de Rosée matinale</p>
                      <p className="text-3xs text-encre-500 font-serif italic">Le verset inspirant de la semaine avec méditation audio</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.goutteDeRosee}
                    onChange={(e) => majPreference('goutteDeRosee', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-or-600 focus:ring-or-500"
                  />
                </label>

                {/* Heure de la méditation matinale */}
                {prefs.goutteDeRosee && (
                  <div className="ml-4 flex items-center justify-between rounded-2xl border border-or-200 bg-or-50/60 px-3.5 py-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-or-700" />
                      <span className="text-3xs font-semibold text-encre-800">Heure de la Goutte de Rosée</span>
                    </div>
                    <input
                      type="time"
                      value={prefs.heureMatin}
                      onChange={(e) => majPreference('heureMatin', e.target.value)}
                      className="rounded-lg border border-or-300 bg-white px-2 py-0.5 text-2xs font-bold text-encre-900"
                    />
                  </div>
                )}

                {/* 2. Rappel 48h de Préparation */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer border border-parchemin-300/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-encre-900">Rappel Préparation (48h avant)</p>
                      <p className="text-3xs text-encre-500 font-serif italic">Invitation douce 2 jours avant la rencontre de cellule pour vos réponses</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.rappel48h}
                    onChange={(e) => majPreference('rappel48h', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* 3. Rappel Jour J */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer border border-parchemin-300/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-encre-900">Rappel Jour J de Rencontre</p>
                      <p className="text-3xs text-encre-500 font-serif italic">Rappel le matin même pour le rassemblement en petit groupe</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.jourDeRencontre}
                    onChange={(e) => majPreference('jourDeRencontre', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                {/* 4. Vie de Groupe & Progrès */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer border border-parchemin-300/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-encre-900">Étape Débloquée & Pépites</p>
                      <p className="text-3xs text-encre-500 font-serif italic">Dès que l’animateur valide une fiche ou qu’un témoignage est partagé</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.vieDeGroupe}
                    onChange={(e) => majPreference('vieDeGroupe', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              {/* Messages de confirmation */}
              {messageSucces && (
                <div className="rounded-2xl bg-emerald-50 p-3.5 text-2xs font-semibold text-emerald-800 border border-emerald-200 animate-fadeIn">
                  {messageSucces}
                </div>
              )}
              {messageErreur && (
                <div className="rounded-2xl bg-rose-50 p-3.5 text-2xs font-semibold text-rose-800 border border-rose-200 animate-fadeIn">
                  {messageErreur}
                </div>
              )}

              {/* Bouton de test immédiat & suppression d'appareil */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={tester}
                  disabled={chargement || !active}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-or-400 bg-or-100/80 px-4 py-3 text-xs font-bold text-or-950 transition-all hover:bg-or-200 hover:scale-101 active:scale-99 disabled:opacity-50 shadow-xs"
                >
                  <Send className="h-4 w-4 text-or-700" />
                  M&apos;envoyer une notification test maintenant
                </button>

                {active && (
                  <button
                    type="button"
                    onClick={basculerActivation}
                    disabled={chargement}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-2xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-900 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Effacer et désinscrire cet appareil
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
