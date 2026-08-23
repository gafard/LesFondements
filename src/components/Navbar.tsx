'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  LogOut, 
  User, 
  Menu, 
  X, 
  BookOpen, 
  PenLine, 
  LayoutDashboard, 
  Users, 
  Brain, 
  Tag, 
  BookMarked, 
  Award,
  MessageCircle
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = pathname === '/';
  const isTransparentLanding = isLanding && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const navClass = `fixed w-full z-50 transition-all duration-300 ${
    isScrolled || !isLanding ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 text-slate-800' : 'bg-[#08172d]/65 backdrop-blur-md border-b border-white/10 text-white'
  }`;

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className={`font-serif font-bold text-xl tracking-tight ${isTransparentLanding ? 'text-white' : 'text-slate-900'}`}>
                Les Fondements
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            {user ? (
              <>
                <Link href="/dashboard" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname === '/dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                </Link>
                <Link href="/fiches" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname.startsWith('/fiches') ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <BookOpen className="w-4 h-4" /> Les 20 Fiches
                </Link>
                <Link href="/groupes" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname.startsWith('/groupes') ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <Users className="w-4 h-4" /> Groupe & Prière
                </Link>
                <Link href="/memorisation" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname === '/memorisation' ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <Brain className="w-4 h-4" /> Mémorisation
                </Link>
                <Link href="/index-thematique" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname === '/index-thematique' ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <Tag className="w-4 h-4" /> Thèmes
                </Link>
                <Link href="/journal" className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${pathname === '/journal' ? 'text-indigo-600 font-bold' : 'text-slate-700'}`}>
                  <PenLine className="w-4 h-4" /> Journal
                </Link>

                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-semibold text-xs shadow-2xs">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Déconnexion">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/fiches" className={isTransparentLanding ? 'text-slate-200 hover:text-amber-300' : 'text-slate-700 hover:text-indigo-600'}>Le Parcours</Link>
                <Link href="/index-thematique" className={isTransparentLanding ? 'text-slate-200 hover:text-amber-300' : 'text-slate-700 hover:text-indigo-600'}>Index Thématique</Link>
                <Link href="/ressources" className={isTransparentLanding ? 'text-slate-200 hover:text-amber-300' : 'text-slate-700 hover:text-indigo-600'}>Bibliographie</Link>
                <Link href="/login" className={`${isTransparentLanding ? 'bg-amber-300 text-[#08172d] hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'} px-5 py-2 rounded-full font-semibold transition-colors shadow-sm`}>
                  Connexion Gratuite
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`${isTransparentLanding ? 'text-white hover:text-amber-300' : 'text-slate-600 hover:text-indigo-600'} p-2`}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white shadow-xl border-t border-slate-100 absolute w-full max-h-[85vh] overflow-y-auto">
          <div className="px-4 pt-3 pb-6 space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" /> Tableau de bord
                </Link>
                <Link href="/fiches" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Les 20 Fiches
                </Link>
                <Link href="/groupes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <Users className="w-4 h-4 text-indigo-600" /> Groupe & Mur de Prière
                </Link>
                <Link href="/memorisation" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <Brain className="w-4 h-4 text-amber-600" /> Mémorisation (Flashcards)
                </Link>
                <Link href="/index-thematique" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <Tag className="w-4 h-4 text-slate-500" /> Index Thématique (p.163)
                </Link>
                <Link href="/ressources" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <BookMarked className="w-4 h-4 text-slate-500" /> Bibliographie (p.164)
                </Link>
                <Link href="/journal" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <PenLine className="w-4 h-4 text-amber-600" /> Journal Spirituel
                </Link>
                <Link href="/temoignages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <MessageCircle className="w-4 h-4 text-indigo-600" /> Témoignages
                </Link>
                <Link href="/certificat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600">
                  <Award className="w-4 h-4 text-amber-600" /> Mon Certificat
                </Link>
                <div className="pt-2 border-t border-slate-100">
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/fiches" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-800">Le Parcours</Link>
                <Link href="/index-thematique" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-800">Index Thématique</Link>
                <Link href="/ressources" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-800">Bibliographie</Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center px-4 py-2.5 rounded-full text-sm font-bold bg-indigo-600 text-white shadow-sm mt-2">
                  Connexion Gratuite
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
