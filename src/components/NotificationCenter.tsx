'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Sparkles,
  BookOpen,
  Users,
  Check,
  Send,
  X,
  Clock,
} from 'lucide-react';
import {
  verifierSupportNotifications,
  obtenirEtatPermission,
  chargerPreferencesLocales,
  sauvegarderPreferencesLocales,
  activerNotifications,
  desactiverNotifications,
  envoyerNotificationTest,
  NotificationPreferences,
  PREFERENCES_DEFAUT,
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
  const [prefs, setPrefs] = useState<NotificationPreferences>(PREFERENCES_DEFAUT);

  useEffect(() => {
    const sup = verifierSupportNotifications();
    setSupporte(sup);
    if (sup) {
      const perm = obtenirEtatPermission();
      setActive(perm === 'granted');
      setPrefs(chargerPreferencesLocales());
    }
  }, [ouvert]);

  if (!ouvert) return null;

  const basculerActivation = async () => {
    setChargement(true);
    setMessageSucces(null);
    setMessageErreur(null);

    if (active) {
      await desactiverNotifications();
      setActive(false);
      setMessageSucces('Les notifications ont été désactivées.');
    } else {
      const res = await activerNotifications(user?.uid, prefs);
      if (res.success) {
        setActive(true);
        setMessageSucces('Cet appareil est prêt. Vos préférences sont conservées dans votre carnet.');
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
      title: 'Les Fondements · Parole du Cœur',
      body: '« Tu es mon refuge et mon bouclier ; j’espère en ta promesse. » (Ps 119:114)',
      url: '/dashboard',
    });
    if (res.success) {
      setMessageSucces('Notification de test envoyée par le Worker ! Regardez votre écran.');
    } else {
      setMessageErreur(res.error || 'Erreur lors du test.');
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
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Carte style Carnet / Feuille de travail */}
      <div className="feuille relative z-10 w-full max-w-lg overflow-hidden rounded-4xl border border-parchemin-400 p-6 shadow-2xl sm:p-8">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />

        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-parchemin-300 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-or-100 text-or-800 shadow-2xs">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-600">
                Rappels & Méditation
              </span>
              <h2 className="manuscrit text-2xl font-bold text-encre-950">
                Notifications des Fondements
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

        {/* Corps */}
        <div className="mt-6 space-y-6">
          {!supporte ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs text-amber-900 border border-amber-200">
              Votre navigateur ou appareil ne supporte pas les notifications Web Push.
            </div>
          ) : (
            <>
              {/* Interrupteur Principal */}
              <div className="flex items-center justify-between rounded-3xl bg-white/70 p-4 border border-parchemin-300 shadow-xs">
                <div>
                  <p className="font-serif text-sm font-bold text-encre-900">
                    {active ? 'Notifications actives' : 'Recevoir les rappels spirituels'}
                  </p>
                  <p className="text-2xs text-encre-500">
                    Rappels de l’appareil · envoi distant seulement quand le service est configuré
                  </p>
                </div>
                <button
                  type="button"
                  onClick={basculerActivation}
                  disabled={chargement}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-2xs font-bold transition-all shadow-xs ${
                    active
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {active ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Activées
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5" /> Activer
                    </>
                  )}
                </button>
              </div>

              {/* Options de notifications */}
              <div className="space-y-3">
                <p className="text-2xs font-bold uppercase tracking-wider text-encre-400">
                  Thématiques de réception
                </p>

                {/* 1. Goutte de Rosée */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-or-600" />
                    <div>
                      <p className="text-xs font-bold text-encre-900">Goutte de Rosée du matin</p>
                      <p className="text-3xs text-encre-500">Un verset inspirant pour bien commencer la journée</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.goutteDeRosee}
                    onChange={(e) => majPreference('goutteDeRosee', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* 2. Rappel de fiche */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-encre-900">Rappel de continuité de fiche</p>
                      <p className="text-3xs text-encre-500">Une invitation douce à reprendre votre progression</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.rappelFiche}
                    onChange={(e) => majPreference('rappelFiche', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* 3. Vie de groupe */}
                <label className="flex items-center justify-between rounded-2xl bg-parchemin-100/70 p-3.5 transition-colors hover:bg-parchemin-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-encre-900">Communion & Vie de groupe</p>
                      <p className="text-3xs text-encre-500">Rappels de rencontres de partage et nouveaux sujets</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.vieDeGroupe}
                    onChange={(e) => majPreference('vieDeGroupe', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* Heure de rappel */}
              <div className="flex items-center justify-between rounded-2xl border border-parchemin-300 bg-white/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-encre-500" />
                  <span className="text-xs font-medium text-encre-800">Heure de la méditation matinale</span>
                </div>
                <input
                  type="time"
                  value={prefs.heureMatin}
                  onChange={(e) => majPreference('heureMatin', e.target.value)}
                  className="rounded-lg border border-parchemin-400 bg-white px-2 py-1 text-xs font-bold text-encre-900"
                />
              </div>

              {/* Messages d'état */}
              {messageSucces && (
                <div className="rounded-xl bg-emerald-50 p-3 text-2xs font-semibold text-emerald-800 border border-emerald-200">
                  {messageSucces}
                </div>
              )}
              {messageErreur && (
                <div className="rounded-xl bg-rose-50 p-3 text-2xs font-semibold text-rose-800 border border-rose-200">
                  {messageErreur}
                </div>
              )}

              {/* Bouton de test */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={tester}
                  disabled={chargement || !active}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-or-300 bg-or-50/80 px-4 py-2.5 text-xs font-bold text-or-900 transition-colors hover:bg-or-100 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Envoyer une notification test maintenant
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
