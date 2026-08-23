'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorCode = typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
      if (errorCode === 'auth/email-already-in-use') setError('Cet email est déjà utilisé.');
      else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') setError('Email ou mot de passe incorrect.');
      else setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la connexion avec Google.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600 mb-6">
          <BookOpen className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-serif">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          
          <div className="flex justify-center mb-8 border-b">
            <button
              className={`pb-2 px-4 font-medium text-sm ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              onClick={() => setIsLogin(true)}
            >
              Connexion
            </button>
            <button
              className={`pb-2 px-4 font-medium text-sm ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              onClick={() => setIsLogin(false)}
            >
              Inscription
            </button>
          </div>

          {error && <div className="mb-4 bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <div className="mt-1">
                  <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse email</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400">
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={handleGoogleSignIn} className="flex w-full justify-center items-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
