'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Download,
  Loader2,
  RefreshCw,
  Share,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { appliquerMiseAJour, installer, useApplication } from '@/lib/application';
import {
  PAQUETS,
  oublierPaquets,
  paquetPresent,
  telechargerPaquet,
  type Avancement,
  type ClePaquet,
} from '@/lib/paquetsHorsLigne';

/**
 * Le centre : installer, emporter hors connexion, mettre à jour.
 *
 * Ces trois choses n'avaient pas de lieu. L'invite d'installation
 * apparaissait d'elle-même et, une fois écartée, ne revenait jamais — un
 * geste réflexe suffisait à fermer la porte pour de bon. Le téléchargement
 * hors connexion vivait dans un coin du tableau de bord. Et les mises à jour
 * ne se voyaient pas du tout.
 *
 * Ici, tout est consultable à tout moment, et rien ne s'impose.
 */
export default function CentreApplication({
  ouvert,
  onFermer,
  ficheCourante = 1,
}: {
  ouvert: boolean;
  onFermer: () => void;
  ficheCourante?: number;
}) {
  const { installee, installable, plateforme, miseAJourPrete } = useApplication();
  const [presents, setPresents] = useState<Partial<Record<ClePaquet, boolean>>>({});
  const [enCours, setEnCours] = useState<ClePaquet | null>(null);
  const [avancement, setAvancement] = useState<Avancement | null>(null);
  const [souci, setSouci] = useState<string | null>(null);

  const relever = useCallback(async () => {
    const releve: Partial<Record<ClePaquet, boolean>> = {};
    for (const paquet of PAQUETS) releve[paquet.cle] = await paquetPresent(paquet, ficheCourante);
    return releve;
  }, [ficheCourante]);

  // Le relevé se fait à l'ouverture. Le drapeau évite d'écrire dans un
  // composant refermé pendant que les sondes du cache reviennent.
  useEffect(() => {
    if (!ouvert) return;
    let vivant = true;
    void relever().then((releve) => {
      if (vivant) setPresents(releve);
    });
    return () => {
      vivant = false;
    };
  }, [ouvert, relever]);

  const releverLesPresents = useCallback(async () => {
    setPresents(await relever());
  }, [relever]);

  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [ouvert, onFermer]);

  const emporter = async (cle: ClePaquet) => {
    const paquet = PAQUETS.find((p) => p.cle === cle);
    if (!paquet) return;
    setSouci(null);
    setEnCours(cle);
    setAvancement({ faits: 0, total: 0, echecs: 0 });
    try {
      const fin = await telechargerPaquet(paquet, ficheCourante, setAvancement);
      if (fin.echecs) {
        setSouci(
          `${fin.echecs} élément${fin.echecs > 1 ? 's' : ''} n’${fin.echecs > 1 ? 'ont' : 'a'} pas pu être emporté${fin.echecs > 1 ? 's' : ''}. Réessayez avec une meilleure connexion.`
        );
      }
      await releverLesPresents();
    } catch (erreur) {
      setSouci(erreur instanceof Error ? erreur.message : 'Le téléchargement a échoué.');
    } finally {
      setEnCours(null);
      setAvancement(null);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onFermer}
        className={`fixed inset-0 z-[90] cursor-default bg-encre-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          ouvert ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-label="L’application"
        aria-hidden={!ouvert}
        className={`fixed inset-x-0 bottom-0 z-[91] mx-auto max-h-[86vh] max-w-lg overflow-y-auto rounded-t-4xl border-t border-white/12 bg-encre-950/95 px-5 pt-3 shadow-2xl backdrop-blur-2xl transition-transform duration-400 ${
          ouvert ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <span className="mx-auto mb-5 block h-1 w-10 rounded-full bg-white/20" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-parchemin-100">L’application</h2>
            <p className="mt-0.5 text-2xs text-parchemin-100/45">
              Installation, hors connexion, mises à jour.
            </p>
          </div>
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 rounded-full p-2 text-parchemin-100/50 transition-colors hover:text-parchemin-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Mise à jour ── */}
        {miseAJourPrete && (
          <div className="mb-4 rounded-2xl border border-or-400/25 bg-or-400/10 p-4">
            <p className="font-serif text-sm font-bold text-parchemin-100">
              Une nouvelle version de votre carnet est prête
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-parchemin-100/60">
              Elle s’installera quand vous le direz. Rien ne changera sous vos doigts en
              attendant.
            </p>
            <button
              onClick={appliquerMiseAJour}
              className="bouton-or mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Mettre à jour maintenant
            </button>
          </div>
        )}

        {/* ── Installation ── */}
        <div className="mb-5 rounded-2xl bg-white/[0.06] p-4">
          {installee ? (
            <p className="flex items-center gap-2.5 text-sm text-parchemin-100">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              L’application est installée sur cet appareil.
            </p>
          ) : plateforme === 'ios' ? (
            <>
              <p className="flex items-center gap-2.5 text-sm text-parchemin-100">
                <Share className="h-4 w-4 shrink-0 text-or-300" />
                Installer sur iPhone ou iPad
              </p>
              <p className="mt-2 text-2xs leading-relaxed text-parchemin-100/60">
                Touchez <strong className="text-parchemin-100/85">Partager</strong> dans la barre
                de Safari, puis{' '}
                <strong className="text-parchemin-100/85">Sur l’écran d’accueil</strong>. iOS ne
                permet pas de le faire à votre place.
              </p>
            </>
          ) : installable ? (
            <>
              <p className="flex items-center gap-2.5 text-sm text-parchemin-100">
                <Smartphone className="h-4 w-4 shrink-0 text-or-300" />
                Installer l’application
              </p>
              <p className="mt-1.5 text-2xs leading-relaxed text-parchemin-100/60">
                Elle s’ouvre alors sans barre de navigateur, et fonctionne hors connexion.
              </p>
              <button
                onClick={() => void installer()}
                className="bouton-or mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
              >
                <Download className="h-3.5 w-3.5" />
                Installer
              </button>
            </>
          ) : (
            <p className="text-2xs leading-relaxed text-parchemin-100/55">
              Votre navigateur ne propose pas l’installation pour l’instant. Elle apparaîtra ici
              dès qu’elle sera possible.
            </p>
          )}
        </div>

        {/* ── Paquets hors connexion ── */}
        <p className="mb-2 text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/55">
          Emporter hors connexion
        </p>
        <div className="space-y-2">
          {PAQUETS.map((paquet) => {
            const present = presents[paquet.cle];
            const occupe = enCours === paquet.cle;
            return (
              <div key={paquet.cle} className="rounded-2xl bg-white/[0.06] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold text-parchemin-100">
                      {paquet.nom}
                      {present && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                    </p>
                    <p className="mt-1 text-2xs leading-relaxed text-parchemin-100/55">
                      {paquet.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-2xs font-bold text-parchemin-100/40">
                    {paquet.poids}
                  </span>
                </div>

                {occupe && avancement ? (
                  <div className="mt-3">
                    <div className="h-1 overflow-hidden rounded-full bg-white/12">
                      <span
                        className="block h-full rounded-full bg-or-400 transition-[width] duration-200"
                        style={{
                          width: `${avancement.total ? Math.round((avancement.faits / avancement.total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-3xs text-parchemin-100/50">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {avancement.faits} / {avancement.total || '…'}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => void emporter(paquet.cle)}
                    disabled={!!enCours}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-2xs font-bold text-parchemin-100/80 transition-colors hover:bg-white/18 hover:text-parchemin-100 disabled:opacity-30"
                  >
                    <Download className="h-3 w-3" />
                    {present ? 'Mettre à jour' : 'Emporter'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {souci && (
          <p className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-2xs leading-relaxed text-amber-100">
            {souci}
          </p>
        )}

        <button
          onClick={async () => {
            await oublierPaquets();
            await releverLesPresents();
          }}
          disabled={!!enCours}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-2xs font-bold text-parchemin-100/50 transition-colors hover:bg-white/8 hover:text-parchemin-100 disabled:opacity-30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Libérer l’espace hors connexion
        </button>
      </div>
    </>
  );
}
