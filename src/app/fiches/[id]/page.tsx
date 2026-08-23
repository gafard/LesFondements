'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { allFiches } from '@/data/allFiches';
import VersetCard from '@/components/VersetCard';
import AudioPlayer from '@/components/AudioPlayer';
import VideoPlayer from '@/components/VideoPlayer';
import { getAnswers, saveAnswers, markFicheCompleted } from '@/lib/firestore';
import { CheckCircle, ChevronLeft, ChevronRight, BookOpen, MessageCircle, HelpCircle, Award, Check, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_DATA: Record<number, QuizQuestion[]> = {
  1: [
    {
      question: 'Sur quoi repose l\'amour inconditionnel de Dieu pour nous ?',
      options: [
        'Sur notre capacité à respecter parfaitement la morale',
        'Sur sa propre nature car « Dieu est amour » (1 Jean 4:16)',
        'Sur le nombre de prières que nous faisons par jour',
        'Sur notre assiduité aux cultes'
      ],
      correctIndex: 1,
      explanation: 'Dieu nous aime parce qu\'Il est amour et non en récompense de nos mérites.'
    },
    {
      question: 'Que signifie l\'unité de Dieu dans la Trinité ?',
      options: [
        'Trois dieux indépendants en compétition',
        'Une énergie ou force impersonnelle',
        'Un seul Dieu unique révélé en Père, Fils et Saint-Esprit',
        'Une doctrine purement philosophique'
      ],
      correctIndex: 2,
      explanation: 'Dieu est un : l\'unité dans la diversité entre le Père, le Fils (Jésus) et l\'Esprit Saint.'
    }
  ],
  2: [
    {
      question: 'Que signifie littéralement le mot péché dans le texte biblique ?',
      options: [
        'Être une mauvaise personne aux yeux de la société',
        'Manquer le but et quitter la communion d\'amour avec le Créateur',
        'Ne pas suivre les traditions humaines',
        'Avoir des faiblesses physiques'
      ],
      correctIndex: 1,
      explanation: 'Pécher signifie faillir au dessein pour lequel nous avons été créés : vivre en relation intime avec Dieu.'
    },
    {
      question: 'Quel est le rôle principal de la Loi (Torah) ?',
      options: [
        'Permettre à l\'homme de se justifier par ses propres forces',
        'Révéler la sainteté de Dieu et la culpabilité de tous face au péché',
        'Remplacer la grâce de Dieu',
        'Créer des rituels sans importance'
      ],
      correctIndex: 1,
      explanation: 'La Loi sert de miroir montrant l\'incapacité de l\'homme à atteindre la perfection et son besoin absolu de Jésus.'
    }
  ],
  3: [
    {
      question: 'Quels sont les deux mouvements indissociables de la conversion ?',
      options: [
        'Le baptême d\'eau et les bonnes œuvres',
        'La repentance (changer d\'orientation) et la foi (confiance en Jésus)',
        'La méditation et le jeûne',
        'L\'appartenance à une communauté et le respect des règles'
      ],
      correctIndex: 1,
      explanation: 'La conversion biblique implique de se détourner du mal (repentance) et de se tourner vers Christ (foi).'
    }
  ],
  4: [
    {
      question: 'Qu\'est-ce que le légalisme dans la vie chrétienne ?',
      options: [
        'Le respect des lois de l\'État',
        'S\'appuyer sur ses propres œuvres pour plaire à Dieu ou gagner sa faveur',
        'Lire la Bible régulièrement',
        'Vivre selon l\'amour du prochain'
      ],
      correctIndex: 1,
      explanation: 'Le légalisme déplace le regard de l\'œuvre parfaite de Christ vers nos propres performances.'
    }
  ],
  5: [
    {
      question: 'Qu\'appelle-t-on l\'Échange Divin à la croix ?',
      options: [
        'Une transaction commerciale entre l\'homme et Dieu',
        'Jésus a pris nos péchés et notre condamnation pour nous donner sa justice et sa sainteté',
        'Un symbole religieux sans réalité spirituelle',
        'Une promesse réservée à une élite'
      ],
      correctIndex: 1,
      explanation: 'À la croix, Jésus a été fait péché pour que nous devenions justice de Dieu en Lui (2 Co 5:21).'
    }
  ]
};

export default function FicheDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ficheId = parseInt(params.id as string);

  const [activeTab, setActiveTab] = useState<'enseignement' | 'resume' | 'questions' | 'quiz'>('enseignement');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fiche = allFiches.find(f => f.id === ficheId);

  useEffect(() => {
    if (user && fiche) {
      getAnswers(user.uid, fiche.id).then((ans) => {
        if (ans && typeof ans === 'object') {
          setAnswers(ans as Record<string, string>);
        }
      }).catch(console.error);
    }
  }, [user, fiche]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">Chargement...</div>
      </div>
    );
  }
  if (!user) return null;

  if (!fiche) {
    return (
      <div className="min-h-screen pt-24 text-center px-4">
        <h2 className="text-2xl font-bold font-serif">Fiche introuvable</h2>
        <Link href="/fiches" className="text-indigo-600 mt-4 inline-block hover:underline">Retour aux fiches</Link>
      </div>
    );
  }

  // Full text compilation for Text-To-Speech audio
  const fullTextToRead = fiche.sections.map(s => `${s.title}. ${s.content}`).join(' ');

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setSaved(false);
  };

  const handleSaveAnswers = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveAnswers(user.uid, fiche.id, answers);
      setSaved(true);
      setTimeout(() => setSaving(false), 500);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    await markFicheCompleted(user.uid, fiche.id);
    setCompleted(true);
  };

  const quizQuestions = QUIZ_DATA[fiche.id] || [
    {
      question: `Quel est le fil conducteur de la fiche « ${fiche.title} » ?`,
      options: [
        fiche.summary[0]?.content || 'Mettre en pratique l’enseignement reçu.',
        'Accumuler des connaissances sans changer ses habitudes.',
        'Progresser uniquement par ses propres efforts.',
        'Éviter les relations et avancer seul.',
      ],
      correctIndex: 0,
      explanation: fiche.summary[0]?.content || 'La compréhension conduit à une mise en pratique concrète.',
    },
  ];

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateQuizScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score++;
    });
    return score;
  };

  const tabs = [
    { id: 'enseignement' as const, label: 'Enseignement', icon: BookOpen },
    { id: 'resume' as const, label: 'Résumé & Partage', icon: MessageCircle },
    { id: 'questions' as const, label: 'Questions', icon: HelpCircle },
    { id: 'quiz' as const, label: 'Quiz de révision', icon: Award },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/fiches" className="text-sm text-indigo-600 hover:text-indigo-700 mb-3 inline-block">&larr; Toutes les fiches</Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">Fiche {fiche.id}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-2">{fiche.title}</h1>
          {fiche.subtitle && <p className="text-lg text-slate-500 italic">{fiche.subtitle}</p>}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 pb-px gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
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

        {/* Multimedia Header (Audio & Video) */}
        <AudioPlayer 
          src={fiche.audioUrl} 
          title={`Fiche ${fiche.id} : ${fiche.title}`} 
          textToRead={fullTextToRead}
        />
        {fiche.videoUrl && <VideoPlayer url={fiche.videoUrl} title={`Fiche ${fiche.id} : ${fiche.title}`} />}

        {/* Main Content Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8">
          
          {/* TAB 1: ENSEIGNEMENT */}
          {activeTab === 'enseignement' && (
            <div className="space-y-8">
              {fiche.sections.map((section, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <h2 className="text-2xl font-bold font-serif text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                    {section.title}
                  </h2>
                  {section.content.includes('<p>') ? (
                    <div 
                      className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-4 [&>p]:mb-4"
                      dangerouslySetInnerHTML={{ __html: section.content }} 
                    />
                  ) : (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                      {section.content}
                    </div>
                  )}
                  {section.versets && section.versets.length > 0 && (
                    <div className="grid gap-3 mt-4">
                      {section.versets.map((v, vi) => (
                        <VersetCard key={vi} reference={v.reference} text={v.text} type={v.type} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Annexes */}
              {fiche.annexes && fiche.annexes.length > 0 && (
                <div className="mt-8 pt-8 border-t-2 border-amber-100">
                  <h2 className="text-2xl font-bold font-serif text-amber-800 mb-6">📎 Annexes</h2>
                  {fiche.annexes.map((annexe, ai) => (
                    <div key={ai} className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                      <h3 className="text-xl font-bold font-serif text-amber-900 mb-4">{annexe.title}</h3>
                      <div className="text-amber-900/80 leading-relaxed whitespace-pre-line italic">
                        {annexe.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RÉSUMÉ & PARTAGE */}
          {activeTab === 'resume' && (
            <div className="space-y-8">
              {fiche.summary && fiche.summary.length > 0 ? (
                fiche.summary.map((section, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-xl font-bold font-serif text-slate-900 mb-3">{section.title}</h3>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                      {section.content}
                    </div>
                    {section.versets && section.versets.length > 0 && (
                      <div className="grid gap-3 mt-3">
                        {section.versets.map((v, vi) => (
                          <VersetCard key={vi} reference={v.reference} text={v.text} type={v.type} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">Résumé non disponible pour cette fiche.</p>
              )}

              {/* Lectures recommandées */}
              {fiche.lectures && fiche.lectures.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-3">📖 Lectures recommandées</h4>
                  <ul className="space-y-1">
                    {fiche.lectures.map((lecture, li) => (
                      <li key={li} className="text-blue-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        {lecture}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUESTIONS INTERACTIVES */}
          {activeTab === 'questions' && (
            <div>
              <h3 className="text-xl font-serif font-bold mb-2">Questions de réflexion personnelle & partage</h3>
              <p className="text-slate-500 text-sm mb-6">Prenez le temps de méditer chaque question. Vos réponses sont automatiquement synchronisées.</p>
              <div className="space-y-6">
                {fiche.questions.map((q, qi) => (
                  <div key={q.id} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="font-medium text-slate-800 mb-3">
                      <span className="text-indigo-600 font-bold mr-2">{qi + 1}.</span>
                      {q.text}
                    </p>
                    <textarea
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] bg-white"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Votre réponse ou méditation..."
                    />
                  </div>
                ))}
                <div className="flex justify-end items-center gap-3 pt-2">
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Sauvegardé</span>}
                  {saving && <span className="text-sm text-slate-500">Sauvegarde...</span>}
                  <button
                    onClick={handleSaveAnswers}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Enregistrer mes réponses
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUIZ DE RÉVISION */}
          {activeTab === 'quiz' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-slate-900">Quiz de Compréhension</h3>
                  <p className="text-slate-500 text-xs">Vérifiez l&apos;assimilation des points doctrinaux clés de cette fiche.</p>
                </div>
                {quizSubmitted && (
                  <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-xs">
                    Score : {calculateQuizScore()} / {quizQuestions.length}
                  </span>
                )}
              </div>

              {quizQuestions.length > 0 ? (
                <div className="space-y-6">
                  {quizQuestions.map((q, qIdx) => {
                    const isCorrect = selectedAnswers[qIdx] === q.correctIndex;

                    return (
                      <div key={qIdx} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h4 className="font-semibold text-slate-800 text-sm mb-3">
                          {qIdx + 1}. {q.question}
                        </h4>

                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIdx) => {
                            let optStyle = 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700';

                            if (selectedAnswers[qIdx] === optIdx) {
                              optStyle = 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium';
                            }

                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                optStyle = 'border-green-500 bg-green-50 text-green-900 font-semibold';
                              } else if (selectedAnswers[qIdx] === optIdx && !isCorrect) {
                                optStyle = 'border-red-500 bg-red-50 text-red-900';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleOptionSelect(qIdx, optIdx)}
                                className={`w-full text-left p-3 text-xs rounded-lg border transition-all flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correctIndex && (
                                  <Check className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                                )}
                                {quizSubmitted && selectedAnswers[qIdx] === optIdx && !isCorrect && (
                                  <X className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className={`p-3 rounded-lg text-xs ${isCorrect ? 'bg-green-100/70 text-green-800' : 'bg-amber-100/70 text-amber-800'}`}>
                            💡 <strong>Explication :</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-3">
                    {quizSubmitted ? (
                      <button
                        onClick={() => { setSelectedAnswers({}); setQuizSubmitted(false); }}
                        className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Recommencer le quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(selectedAnswers).length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors shadow-sm"
                      >
                        Valider mes réponses
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            {fiche.id > 1 && (
              <Link href={`/fiches/${fiche.id - 1}`} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors text-xs font-semibold">
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </Link>
            )}
            {fiche.id < 20 && (
              <Link href={`/fiches/${fiche.id + 1}`} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors text-xs font-semibold">
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
          <button
            onClick={handleComplete}
            disabled={completed}
            className={`flex items-center px-6 py-2.5 rounded-full font-bold transition-all text-xs ${
              completed
                ? 'bg-green-100 text-green-700 scale-105'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
            }`}
          >
            {completed ? (
              <><CheckCircle className="w-4 h-4 mr-1.5" /> Fiche Validée !</>
            ) : (
              'Marquer cette fiche comme terminée'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
