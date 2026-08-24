'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Lock, Mail, User, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsGuest,
    isFirebaseConfigured,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Destination après connexion : le lien d'invitation d'où l'on vient, sinon l'accueil. */
  const suite = searchParams.get('suite') || '/dashboard';

  useEffect(() => {
    if (user) router.replace(suite);
  }, [user, router, suite]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) await signInWithEmail(email, password);
      else await signUpWithEmail(email, password, name);
      router.replace(suite);
    } catch (err: unknown) {
      console.error(err);
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      if (code === 'auth/email-already-in-use') setError('Cette adresse est déjà utilisée.');
      else if (
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential'
      )
        setError('Adresse ou mot de passe incorrect.');
      else if (code === 'auth/weak-password')
        setError('Choisissez un mot de passe d’au moins 6 caractères.');
      else setError('Une erreur est survenue. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace(suite);
    } catch (err) {
      console.error(err);
      setError(
        "La connexion Google a échoué. Vérifiez que le domaine est autorisé dans la console Firebase."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAsGuest(name || 'Ami·e du parcours');
      router.replace(suite);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 lg:py-28">
      
      {/* Background Illustrated Community Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-community-v2.png"
          alt="Petit groupe africain réuni autour de la Parole"
          fill
          sizes="100vw"
          priority
          className="object-cover object-[70%_center] opacity-25 lg:opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07162b] via-[#07162b]/95 to-[#07162b]/80" />
      </div>

      {/* Atmospheric Vitrail Glows */}
      <span className="vitrail left-[-8rem] top-[-5rem] h-96 w-96 bg-or-400/15 animate-souffle relative z-1" />
      <span
        className="vitrail bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] bg-indigo-500/20 animate-souffle relative z-1"
        style={{ animationDelay: '2s' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LEFT EDITORIAL COLUMN (DESKTOP)                                   */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block lg:col-span-6 space-y-6 text-[#fff8e8]">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt="Les Fondements Logo"
                width={40}
                height={40}
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <span className="text-xl font-serif font-bold text-white tracking-tight">Les Fondements</span>
            </Link>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-serif italic text-amber-300/90 tracking-wide">
                Parcours d’affermissement spirituel • 20 étapes
              </p>
              <h2 className="font-serif text-3xl xl:text-4xl font-bold leading-tight text-[#fff8e8]">
                Enracinez votre foi.<br />
                Vivez-la <span className="text-amber-300 italic">en communauté.</span>
              </h2>
              <p className="text-sm text-parchemin-100/75 leading-relaxed max-w-md">
                Chaque semaine, une fiche d&apos;enseignement, un verset à graver, des questions de cœur et un échange fraternel en cellule de 5 à 6 personnes.
              </p>
            </div>

            {/* 3 Milestone Badges Preview */}
            <div className="space-y-2.5 pt-2">
              {[
                { num: '01', title: 'Connaître Dieu', desc: 'Un amour relationnel et inconditionnel' },
                { num: '04', title: 'La Grâce', desc: 'Le don immérité et la puissance divine' },
                { num: '15', title: 'Une communauté', desc: 'L’intimité et le soutien mutuel en cellule' },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-or-400/20 text-or-300 border border-or-300/30 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-serif text-white">{step.title}</h4>
                    <p className="text-2xs text-parchemin-100/60">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quote Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-or-400/10 via-white/5 to-transparent border border-or-300/20 text-2xs text-parchemin-100/80 font-serif italic">
              &quot;Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d’eux.&quot;
              <span className="block mt-1 font-sans font-bold text-or-300 not-italic">— Matthieu 18:20</span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN : AUTH FORM                                          */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="text-center lg:hidden mb-6">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
                <Image
                  src="/logo.png"
                  alt="Les Fondements Logo"
                  width={36}
                  height={36}
                  className="h-9 w-auto object-contain"
                  priority
                />
                <span className="font-serif font-bold text-white text-lg">Les Fondements</span>
              </Link>
              <h1 className="mt-1 font-serif text-2xl font-bold text-parchemin-100">
                {isLogin ? 'Bon retour' : 'Entrer dans le parcours'}
              </h1>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-parchemin-100/60">
                {suite.startsWith('/rejoindre')
                  ? 'Créez votre compte pour rejoindre votre groupe.'
                  : 'Vingt fiches, un petit groupe, cinq mois.'}
              </p>
            </div>

            <div className="feuille relative rounded-3xl border border-parchemin-300 p-6 sm:p-8 shadow-2xl text-encre-950">
              <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
              
              <div className="hidden lg:block mb-6">
                <h3 className="font-serif text-2xl font-bold text-encre-950">
                  {isLogin ? 'Bon retour' : 'Commencer le parcours'}
                </h3>
                <p className="text-xs text-encre-600 mt-1">
                  {isLogin ? 'Retrouvez votre progression et votre groupe.' : 'Créez votre profil disciple en 30 secondes.'}
                </p>
              </div>

              <div className="mb-6 flex gap-1 rounded-2xl bg-parchemin-200/80 p-1">
                {[
                  { value: true, label: 'Connexion' },
                  { value: false, label: 'Créer un compte' },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setIsLogin(tab.value)}
                    className={`flex-1 rounded-xl py-2.5 text-2xs font-bold transition-all ${
                      isLogin === tab.value
                        ? 'bg-encre-950 text-white shadow-md'
                        : 'text-encre-600 hover:text-encre-950'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

          {error && (
            <p className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-2xs leading-relaxed text-rose-700">
              {error}
            </p>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-encre-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Votre prénom"
                  className="w-full rounded-2xl border border-parchemin-300 bg-white py-3.5 pl-11 pr-4 text-sm text-encre-950 outline-none placeholder:text-encre-300 shadow-2xs focus:border-or-400"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-encre-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre adresse e-mail"
                className="w-full rounded-2xl border border-parchemin-300 bg-white py-3.5 pl-11 pr-4 text-sm text-encre-950 outline-none placeholder:text-encre-300 shadow-2xs focus:border-or-400"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-encre-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="mot de passe"
                className="w-full rounded-2xl border border-parchemin-300 bg-white py-3.5 pl-11 pr-4 text-sm text-encre-950 outline-none placeholder:text-encre-300 shadow-2xs focus:border-or-400"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bouton-or flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? 'Se connecter' : 'Créer mon compte'}
              {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a1b33] px-3 text-2xs font-bold uppercase tracking-[0.18em] text-parchemin-100/35">
                ou
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white/90 py-3 text-xs font-bold text-encre-800 transition-colors hover:bg-white disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuer avec Google
          </button>

          {/*
            Le mode découverte ne vaut que sans backend : une session locale
            ne peut pas rejoindre un groupe partagé, ni recevoir d'invitation.
            Le proposer une fois Firebase branché serait une fausse promesse.
          */}
          {!isFirebaseConfigured && (
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/8 py-3 text-2xs font-bold text-parchemin-100/75 transition-colors hover:bg-white/14 disabled:opacity-60"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Découvrir sans créer de compte
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-2xs leading-relaxed text-parchemin-100/40">
          Après la connexion, vous choisirez votre groupe : c&apos;est lui qui ouvre le parcours.
          {!isFirebaseConfigured && (
            <>
              <br />
              Aucun serveur n&apos;est branché : tout reste dans ce navigateur.
            </>
          )}
        </p>
      </div>
    </div>
  </div>
</div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="nuit flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-or-300" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
