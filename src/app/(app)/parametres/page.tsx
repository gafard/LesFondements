'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BellOff,
  Check,
  Loader2,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { renommerDansLeGroupe } from '@/lib/parcoursStore';
import {
  activerNotifications,
  chargerPreferencesLocales,
  desactiverNotifications,
  envoyerNotificationTest,
  obtenirAbonnementActif,
  obtenirEtatPermission,
  sauvegarderPreferencesLocales,
  synchroniserNotifications,
  verifierSupportNotifications,
  type NotificationPreferences,
  PREFERENCES_DEFAUT,
} from '@/lib/notifications';
import {
  definirConsentementMesure,
  lireConsentementMesure,
  type ConsentementMesure,
} from '@/lib/mesure';

/**
 * Un seul endroit pour ce qui appartient à la personne.
 *
 * Ces réglages vivaient à trois adresses : le nom nulle part — on héritait de
 * la partie gauche de son adresse e-mail sans pouvoir la corriger —, les
 * rappels dans une fenêtre qu'il fallait ouvrir depuis la cloche, la
 * suppression du compte dans une page à part. On les rassemble.
 */
export default function ParametresPage() {
  return (
    <ParcoursGate acces="personnel">
      <div className="table-travail min-h-screen px-4 pb-28 pt-10 sm:px-6">
        <main className="mx-auto max-w-3xl space-y-6">
          <header className="feuille relative rounded-4xl border border-parchemin-300 p-7 shadow-md">
            <span className="punaise -top-2.5 left-8" aria-hidden="true" />
            <span className="timbre inline-flex items-center gap-1.5 bg-parchemin-100 px-3 py-1 text-xs font-bold text-encre-800">
              Mon espace
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold text-encre-950">Mes réglages</h1>
            <p className="mt-2 text-sm leading-relaxed text-encre-700">
              Votre nom, vos rappels, vos données. Rien de ce qui se règle ici ne concerne le
              groupe.
            </p>
          </header>

          <SectionProfil />
          <SectionRappels />
          <SectionConfidentialite />

          <p className="text-center text-sm">
            <Link href="/confidentialite" className="font-bold text-encre-700 underline">
              Lire la politique de confidentialité
            </Link>
          </p>
        </main>
      </div>
    </ParcoursGate>
  );
}

// ── Profil ────────────────────────────────────────────────────

function SectionProfil() {
  const { user, renommer } = useAuth();
  const { profile, group, membership, updateProfile } = useParcours();
  // `null` tant que rien n'a été saisi : le champ montre alors ce que le
  // profil porte déjà, sans qu'un effet ait à recopier l'un dans l'autre.
  const [nomSaisi, setNomSaisi] = useState<string | null>(null);
  const [bioSaisie, setBioSaisie] = useState<string | null>(null);
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'garde'>('repos');

  const nom = nomSaisi ?? user?.displayName ?? profile?.displayName ?? '';
  const bio = bioSaisie ?? profile?.bio ?? '';
  const nomPropre = nom.trim();
  const inchange =
    nomPropre === (user?.displayName ?? '') && bio.trim() === (profile?.bio ?? '');

  const enregistrer = async () => {
    if (!nomPropre) return;
    setEtat('envoi');
    await renommer(nomPropre);
    await updateProfile({ displayName: nomPropre, bio: bio.trim() });
    // Le profil est privé : c'est la ligne d'adhésion que le groupe lit.
    if (group && membership?.status === 'actif' && user) {
      await renommerDansLeGroupe(group.id, user.uid, nomPropre);
    }
    setEtat('garde');
    window.setTimeout(() => setEtat('repos'), 2200);
  };

  return (
    <section className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
      <div className="flex gap-3">
        <UserRound className="mt-1 h-5 w-5 shrink-0 text-or-700" aria-hidden="true" />
        <div>
          <h2 className="font-serif text-xl font-bold text-encre-950">Mon nom</h2>
          <p className="mt-2 text-sm leading-relaxed text-encre-700">
            À l&apos;inscription par e-mail, le nom est déduit de l&apos;adresse. C&apos;est
            rarement le vôtre — et c&apos;est celui que votre cellule voit.
          </p>
        </div>
      </div>

      <label className="mt-5 block text-sm font-bold text-encre-900">
        Nom affiché
        <input
          value={nom}
          onChange={(evenement) => setNomSaisi(evenement.target.value.slice(0, 60))}
          maxLength={60}
          autoComplete="name"
          placeholder="Comment souhaitez-vous être appelé ?"
          className="mt-2 min-h-11 w-full rounded-2xl border border-parchemin-400 bg-white px-4 text-base text-encre-950 outline-none focus:ring-1 focus:ring-or-400"
        />
      </label>

      <label className="mt-4 block text-sm font-bold text-encre-900">
        Un mot sur moi
        <span className="ml-2 font-normal text-encre-600">facultatif</span>
        <textarea
          value={bio}
          onChange={(evenement) => setBioSaisie(evenement.target.value.slice(0, 280))}
          rows={2}
          maxLength={280}
          placeholder="Ce que votre cellule peut savoir de vous."
          className="manuscrit mt-2 w-full rounded-2xl border border-parchemin-400 bg-white px-4 py-2.5 text-base text-encre-950 outline-none placeholder:font-sans focus:ring-1 focus:ring-or-400"
        />
      </label>

      {user?.email && (
        <p className="mt-3 text-2xs text-encre-600">
          Connecté avec <span className="font-bold">{user.email}</span>. L&apos;adresse ne change
          pas ici.
        </p>
      )}

      <button
        type="button"
        onClick={() => void enregistrer()}
        disabled={!nomPropre || inchange || etat === 'envoi'}
        className="bouton-or mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {etat === 'envoi' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : etat === 'garde' ? (
          <Check className="h-4 w-4" />
        ) : null}
        {etat === 'garde' ? 'Enregistré' : 'Enregistrer'}
      </button>
    </section>
  );
}

// ── Rappels ───────────────────────────────────────────────────

const REGLAGES: Array<{
  cle: keyof NotificationPreferences;
  titre: string;
  detail: string;
}> = [
  {
    cle: 'goutteDeRosee',
    titre: 'Le rappel du matin',
    detail: 'Une invitation à ouvrir votre temps du jour, à l’heure que vous choisissez.',
  },
  {
    cle: 'tempsDuJour',
    titre: 'Nommer le temps du jour',
    detail:
      'Le rappel du matin annonce le temps qui vous attend plutôt qu’un verset au hasard.',
  },
  {
    cle: 'rappel48h',
    titre: 'Deux jours avant la rencontre',
    detail: 'De quoi préparer la fiche sans courir la veille au soir.',
  },
  {
    cle: 'jourDeRencontre',
    titre: 'Le jour de la rencontre',
    detail: 'Un mot le matin même.',
  },
  {
    cle: 'vieDeGroupe',
    titre: 'La vie du groupe',
    detail: 'Une fiche clôturée, une pépite déposée sur le mur.',
  },
];

function SectionRappels() {
  const { user } = useAuth();
  const { group } = useParcours();
  const [supporte, setSupporte] = useState(true);
  const [actif, setActif] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(PREFERENCES_DEFAUT);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const sup = verifierSupportNotifications();
      setSupporte(sup);
      if (!sup) return;
      setPrefs(chargerPreferencesLocales());
      const permission = obtenirEtatPermission();
      void obtenirAbonnementActif().then((abonnement) => {
        setActif(permission === 'granted' && !!abonnement);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const basculer = async () => {
    setOccupe(true);
    setMessage(null);
    setErreur(null);
    if (actif) {
      await desactiverNotifications();
      setActif(false);
      setMessage('Les rappels sont éteints sur cet appareil.');
    } else {
      const resultat = await activerNotifications(user?.uid, prefs, { groupId: group?.id });
      if (resultat.success) {
        setActif(true);
        setMessage('Cet appareil recevra vos rappels.');
      } else {
        setErreur(resultat.error || 'Les rappels n’ont pas pu être activés.');
      }
    }
    setOccupe(false);
  };

  const changer = (cle: keyof NotificationPreferences, valeur: boolean | string) => {
    const suivantes = { ...prefs, [cle]: valeur };
    setPrefs(suivantes);
    sauvegarderPreferencesLocales(suivantes);
    if (actif) {
      void synchroniserNotifications(suivantes, { groupId: group?.id }).then((resultat) => {
        if (!resultat.success) setErreur(resultat.error ?? 'Réglages non synchronisés.');
      });
    }
  };

  if (!supporte) {
    return (
      <section className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
        <div className="flex gap-3">
          <BellOff className="mt-1 h-5 w-5 shrink-0 text-encre-500" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-xl font-bold text-encre-950">Mes rappels</h2>
            <p className="mt-2 text-sm leading-relaxed text-encre-700">
              Ce navigateur ne sait pas recevoir de rappels. Sur iPhone, installez
              d&apos;abord l&apos;application sur l&apos;écran d&apos;accueil.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
      <div className="flex gap-3">
        <Bell className="mt-1 h-5 w-5 shrink-0 text-or-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl font-bold text-encre-950">Mes rappels</h2>
          <p className="mt-2 text-sm leading-relaxed text-encre-700">
            Le parcours se tient dans la durée, pas dans l&apos;élan. Ces rappels sont là pour
            ça.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void basculer()}
        disabled={occupe}
        aria-pressed={actif}
        className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-bold disabled:opacity-40 ${
          actif
            ? 'border border-parchemin-400 bg-white text-encre-800'
            : 'bouton-or'
        }`}
      >
        {occupe ? <Loader2 className="h-4 w-4 animate-spin" /> : actif ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {actif ? 'Éteindre sur cet appareil' : 'Activer les rappels'}
      </button>

      {message && <p className="mt-3 text-sm font-bold text-emerald-800">{message}</p>}
      {erreur && <p role="alert" className="mt-3 text-sm font-bold text-rose-800">{erreur}</p>}

      <label className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-encre-900">
        Heure du rappel du matin
        <input
          type="time"
          value={prefs.heureMatin}
          onChange={(evenement) => changer('heureMatin', evenement.target.value)}
          className="min-h-11 rounded-2xl border border-parchemin-400 bg-white px-4 text-base text-encre-950"
        />
      </label>

      <ul className="mt-5 space-y-2.5">
        {REGLAGES.map((reglage) => {
          const coche = prefs[reglage.cle] !== false;
          return (
            <li key={reglage.cle}>
              <button
                type="button"
                role="switch"
                aria-checked={coche}
                onClick={() => changer(reglage.cle, !coche)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  coche
                    ? 'border-or-400 bg-or-50'
                    : 'border-parchemin-400 bg-white/70'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    coche ? 'border-or-600 bg-or-600 text-white' : 'border-parchemin-400 bg-white'
                  }`}
                >
                  {coche && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-encre-950">{reglage.titre}</span>
                  <span className="mt-0.5 block text-2xs leading-relaxed text-encre-700">
                    {reglage.detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {actif && (
        <button
          type="button"
          onClick={async () => {
            setOccupe(true);
            const resultat = await envoyerNotificationTest();
            setOccupe(false);
            if (resultat.success) setMessage('Rappel de test envoyé.');
            else setErreur(resultat.error || 'L’envoi de test a échoué.');
          }}
          disabled={occupe}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-parchemin-400 bg-white px-5 text-xs font-bold text-encre-700 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          M&apos;envoyer un rappel de test
        </button>
      )}
    </section>
  );
}

// ── Confidentialité ───────────────────────────────────────────

function SectionConfidentialite() {
  const router = useRouter();
  const { supprimerCompte } = useAuth();
  const [consentement, setConsentement] = useState<ConsentementMesure>(() =>
    lireConsentementMesure()
  );
  const [confirmation, setConfirmation] = useState('');
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState('');

  return (
    <>
      <section id="donnees" className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
        <div className="flex gap-3">
          <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-or-700" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-xl font-bold text-encre-950">Mesure d’usage anonyme</h2>
            <p className="mt-2 text-sm leading-relaxed text-encre-700">
              Partage uniquement des jalons limités — dont l’ouverture du parcours du jour — sans
              identité, groupe, localisation ou contenu écrit.
            </p>
          </div>
        </div>
        <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Autoriser la mesure d’usage</legend>
          {(
            [
              ['accepte', 'J’accepte la mesure minimale'],
              ['refuse', 'Je refuse toute transmission'],
            ] as const
          ).map(([valeur, label]) => (
            <button
              key={valeur}
              type="button"
              onClick={() => {
                definirConsentementMesure(valeur);
                setConsentement(valeur);
              }}
              aria-pressed={consentement === valeur}
              className={`min-h-11 rounded-2xl border px-4 py-3 text-sm font-bold ${
                consentement === valeur
                  ? 'border-or-500 bg-or-100 text-encre-950'
                  : 'border-parchemin-400 bg-white text-encre-700'
              }`}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </section>

      <section id="compte" className="rounded-3xl border border-rose-300 bg-rose-50 p-6">
        <Trash2 className="h-6 w-6 text-rose-700" aria-hidden="true" />
        <h2 className="mt-3 font-serif text-xl font-bold text-rose-950">Supprimer mon compte</h2>
        <p className="mt-2 text-sm leading-relaxed text-rose-900">
          Cette action retire vos réponses, votre journal, votre mémorisation et vos témoignages.
          Elle est irréversible.
        </p>
        <label className="mt-5 block text-sm font-bold text-rose-950">
          Écrivez SUPPRIMER pour confirmer
          <input
            value={confirmation}
            onChange={(evenement) => setConfirmation(evenement.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-rose-300 bg-white px-4 text-base"
            autoComplete="off"
          />
        </label>
        {erreur && (
          <p role="alert" className="mt-3 text-sm font-bold text-rose-900">
            {erreur}
          </p>
        )}
        <button
          type="button"
          disabled={confirmation !== 'SUPPRIMER' || suppression}
          onClick={async () => {
            setSuppression(true);
            setErreur('');
            try {
              await supprimerCompte();
              router.replace('/');
            } catch (cause) {
              const code = cause instanceof Error ? cause.message : '';
              setErreur(
                code === 'TRANSFERT_GROUPE_REQUIS'
                  ? 'Transmettez d’abord l’animation de votre cellule à un co-animateur.'
                  : code === 'CONNEXION_RECENTE_REQUISE'
                    ? 'Reconnectez-vous, puis revenez ici pour confirmer la suppression.'
                    : 'La suppression n’a pas abouti. Vos données restent en place.'
              );
              setSuppression(false);
            }
          }}
          className="mt-4 min-h-11 rounded-full bg-rose-800 px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {suppression ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </section>
    </>
  );
}
