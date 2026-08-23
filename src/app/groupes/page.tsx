'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { 
  Users, 
  Video, 
  Clock, 
  Heart, 
  MessageSquare, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw,
  Share2,
  ShieldCheck
} from 'lucide-react';

interface PrayerRequest {
  id: string;
  author: string;
  text: string;
  date: string;
  prayedCount: number;
  isAnswered: boolean;
}

interface GroupDiscussion {
  id: string;
  author: string;
  ficheId: number;
  question: string;
  text: string;
  date: string;
}

export default function GroupesPage() {
  const { user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'rencontre' | 'priere' | 'partage' | 'guide'>('rencontre');

  // Group join/create state
  const groupName = 'Groupe Disciples - Espérance';
  const inviteCode = 'FOND-8492';
  const currentFicheWeek = 2;
  const [copied, setCopied] = useState(false);

  // Group members
  const members = [
    { name: user?.displayName || 'Moi (Animateur)', role: 'Animateur', prepared: true, currentFiche: 2 },
    { name: 'Sarah M.', role: 'Membre', prepared: true, currentFiche: 2 },
    { name: 'David K.', role: 'Membre', prepared: false, currentFiche: 1 },
    { name: 'Esther B.', role: 'Membre', prepared: true, currentFiche: 2 },
    { name: 'Marc L.', role: 'Membre', prepared: true, currentFiche: 2 },
  ];

  // Timer state for meeting moderation
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 min discussion timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds === 0) return;
    const timeout = window.setTimeout(() => {
      setTimerSeconds(Math.max(0, timerSeconds - 1));
      if (timerSeconds === 1) setIsTimerRunning(false);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [isTimerRunning, timerSeconds]);

  // Prayer wall
  const [prayers, setPrayers] = useState<PrayerRequest[]>([
    {
      id: '1',
      author: 'Sarah M.',
      text: 'Prière pour mon entretien professionnel mardi et pour que la paix de Dieu garde mon cœur.',
      date: 'Hier à 18:30',
      prayedCount: 4,
      isAnswered: false
    },
    {
      id: '2',
      author: 'David K.',
      text: 'Action de grâce ! Réconciliation complète avec mon frère après avoir médité sur la Fiche 7 (le pardon). Gloire à Dieu !',
      date: 'Il y a 2 jours',
      prayedCount: 6,
      isAnswered: true
    },
    {
      id: '3',
      author: 'Marc L.',
      text: 'Soutien dans la prière pour la santé de ma mère hospitalisée cette semaine.',
      date: 'Il y a 3 jours',
      prayedCount: 5,
      isAnswered: false
    }
  ]);
  const [newPrayer, setNewPrayer] = useState('');

  // Discussions
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>([
    {
      id: '1',
      author: 'Esther B.',
      ficheId: 2,
      question: 'Ai-je compris que c\'est Dieu qui prend l\'initiative de venir à moi ?',
      text: 'Ce qui m\'a le plus touchée dans la Fiche 2, c\'est de réaliser que la grâce n\'a rien à voir avec mes efforts ou ma performance. Ça m\'enlève un fardeau énorme de culpabilité.',
      date: 'Hier à 20:15'
    },
    {
      id: '2',
      author: 'Sarah M.',
      ficheId: 2,
      question: 'Que représente le péché ?',
      text: 'Comprendre que pécher signifie d\'abord « manquer le but » et se couper de la communion d\'amour avec Dieu, plutôt qu\'une simple liste d\'interdits moraux, change toute ma perspective.',
      date: 'Aujourd\'hui à 11:00'
    }
  ]);
  const [newDiscussionText, setNewDiscussionText] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim()) return;
    const prayerItem: PrayerRequest = {
      id: Date.now().toString(),
      author: user?.displayName || 'Membre',
      text: newPrayer,
      date: 'À l\'instant',
      prayedCount: 1,
      isAnswered: false
    };
    setPrayers([prayerItem, ...prayers]);
    setNewPrayer('');
  };

  const handlePray = (id: string) => {
    setPrayers(prayers.map(p => p.id === id ? { ...p, prayedCount: p.prayedCount + 1 } : p));
  };

  const handleToggleAnswered = (id: string) => {
    setPrayers(prayers.map(p => p.id === id ? { ...p, isAnswered: !p.isAnswered } : p));
  };

  const handleAddDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim()) return;
    const item: GroupDiscussion = {
      id: Date.now().toString(),
      author: user?.displayName || 'Moi',
      ficheId: currentFicheWeek,
      question: 'Partage libre sur la Fiche ' + currentFicheWeek,
      text: newDiscussionText,
      date: 'À l\'instant'
    };
    setDiscussions([item, ...discussions]);
    setNewDiscussionText('');
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-indigo-400/20">
                <Users className="w-3.5 h-3.5" />
                Cellule de 5-6 personnes (Recommandation p. 3 du livret)
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif">{groupName}</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Fiche de la semaine : <strong className="text-amber-300">Fiche {currentFicheWeek} — Le péché, le salut</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <span className="text-xs text-indigo-200">Code d&apos;invitation :</span>
                <strong className="font-mono text-amber-300 tracking-wider">{inviteCode}</strong>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                  title="Copier le code"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-300" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Lancer la Visio
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 pb-px gap-2">
          {[
            { id: 'rencontre' as const, label: 'Rencontre & Membres', icon: Users },
            { id: 'priere' as const, label: 'Mur de Prière', icon: Heart },
            { id: 'partage' as const, label: 'Partage des Fiches', icon: MessageSquare },
            { id: 'guide' as const, label: 'Guide & Minuteur Animateur', icon: ShieldCheck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: RENCONTRE & MEMBRES */}
        {activeTab === 'rencontre' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Membres du petit groupe ({members.length}/6)
                </h3>
                <div className="divide-y divide-slate-100">
                  {members.map((m, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{m.name}</span>
                          <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            m.role === 'Animateur' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">Progression : Fiche {m.currentFiche}</span>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        m.prepared ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {m.prepared ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {m.prepared ? 'Fiche préparée' : 'En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Meeting Banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-serif font-bold text-indigo-900 text-base">Prochaine rencontre hebdomadaire</h4>
                  <p className="text-xs text-indigo-700 mt-1">Samedi à 15h00 (Visio ou présentiel) • Thème : Fiche 2</p>
                </div>
                <Link
                  href={`/fiches/${currentFicheWeek}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Ouvrir la Fiche {currentFicheWeek}
                </Link>
              </div>
            </div>

            {/* Quick Rules Column */}
            <div className="space-y-6">
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5">
                <h4 className="font-serif font-bold text-amber-900 text-sm mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Principes clés (p. 3 du livret)
                </h4>
                <ul className="text-xs text-amber-900/80 space-y-2.5 leading-relaxed">
                  <li>• <strong>5-6 participants</strong> : idéal pour que chacun puisse s&apos;exprimer librement.</li>
                  <li>• <strong>Préparation préalable</strong> : chacun étudie la fiche chez soi avant la réunion.</li>
                  <li>• <strong>Pas de cours magistral</strong> : la rencontre est un échange interactif basé sur le partage.</li>
                  <li>• <strong>Assiduité</strong> : engagement sur la durée (~5 mois) pour la richesse du groupe.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MUR DE PRIÈRE */}
        {activeTab === 'priere' && (
          <div className="space-y-6">
            <form onSubmit={handleAddPrayer} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Déposer un sujet de prière
              </h3>
              <p className="text-xs text-slate-500 mb-3">Partagez vos requêtes ou actions de grâce en toute confiance avec votre groupe.</p>
              <textarea
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                placeholder="Décrivez votre besoin de prière..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm min-h-[90px] mb-3"
              />
              <div className="flex justify-end">
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-full text-xs transition-colors">
                  Publier sur le mur
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {prayers.map((prayer) => (
                <div
                  key={prayer.id}
                  className={`bg-white p-5 rounded-2xl border transition-all shadow-2xs ${
                    prayer.isAnswered ? 'border-green-200 bg-green-50/20' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900">{prayer.author}</strong>
                      <span className="text-2xs text-slate-400">{prayer.date}</span>
                    </div>
                    {prayer.isAnswered && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Prière Exaucée !
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{prayer.text}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handlePray(prayer.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      J&apos;ai prié ({prayer.prayedCount})
                    </button>

                    <button
                      onClick={() => handleToggleAnswered(prayer.id)}
                      className="text-xs font-medium text-slate-500 hover:text-green-600 transition-colors"
                    >
                      {prayer.isAnswered ? 'Marquer comme en cours' : 'Marquer comme exaucée'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PARTAGE DES FICHES */}
        {activeTab === 'partage' && (
          <div className="space-y-6">
            <form onSubmit={handleAddDiscussion} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Partager une réflexion sur la Fiche {currentFicheWeek}
              </h3>
              <p className="text-xs text-slate-500 mb-3">Répondez à l&apos;une des questions de la fiche pour enrichir la discussion du groupe.</p>
              <textarea
                value={newDiscussionText}
                onChange={(e) => setNewDiscussionText(e.target.value)}
                placeholder="Votre partage ou témoignage..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm min-h-[90px] mb-3"
              />
              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-full text-xs transition-colors">
                  Envoyer au groupe
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {discussions.map((d) => (
                <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <strong className="text-sm text-slate-900">{d.author}</strong>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ml-2">
                        Fiche {d.ficheId}
                      </span>
                    </div>
                    <span className="text-2xs text-slate-400">{d.date}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 italic mb-2">
                    &quot;{d.question}&quot;
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GUIDE & MINUTEUR ANIMATEUR */}
        {activeTab === 'guide' && (
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Animation Guide */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Conseils pour l&apos;Animateur (p. 3-4, 160-162)
              </h3>
              
              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <strong className="text-amber-900 block mb-1">1. Rôle de facilitateur</strong>
                  Ne refaites pas le cours. Assurez-vous que chacun participe et que personne n&apos;accapare la parole.
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <strong className="text-indigo-900 block mb-1">2. Temps de prière ciblés</strong>
                  • À l&apos;issue des <strong>fiches 7 & 8</strong> (Vivre libre) : proposez un temps individuel pour les blessures, forteresses et le pardon.<br/>
                  • À la <strong>fiche 10</strong> : priez pour le renouvellement du Saint-Esprit.
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">3. Climat de confiance</strong>
                  Pas de jugement d&apos;un côté, ni de susceptibilité de l&apos;autre. &quot;Les brebis sont celles du Seigneur, pas les nôtres.&quot; (p. 161)
                </div>
              </div>
            </div>

            {/* Moderation Timer */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 mb-2 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Minuteur de Partage Équitable
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Utilisez ce compte à rebours pour accorder un temps de parole équitable à chaque participant (ex: 3 minutes).
                </p>

                <div className="text-5xl font-mono font-bold text-indigo-600 my-6">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? 'Mettre en pause' : 'Démarrer le tour'}
                </button>
                <button
                  onClick={() => { setIsTimerRunning(false); setTimerSeconds(180); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium p-2.5 rounded-full transition-colors"
                  title="Réinitialiser à 3 min"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
