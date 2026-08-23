'use client';

import { useState } from 'react';
import { RotateCw, Check, Volume2, ArrowLeft, ArrowRight, Brain, Star } from 'lucide-react';
import { allFiches } from '@/data/allFiches';

interface Flashcard {
  id: number;
  reference: string;
  text: string;
  theme: string;
  ficheId: number;
}

const MEMORIZE_VERSETS: Flashcard[] = [
  { id: 1, ficheId: 1, reference: 'Apocalypse 1:8', text: 'Je suis l\'alpha et l\'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant.', theme: 'Dieu règne souverainement' },
  { id: 2, ficheId: 1, reference: 'Psaume 46:11', text: 'Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.', theme: 'La souveraineté de Dieu' },
  { id: 3, ficheId: 1, reference: '1 Jean 4:16', text: 'Et nous, nous avons connu l\'amour que Dieu a pour nous, et nous y avons cru. Dieu est amour; et celui qui demeure dans l\'amour demeure en Dieu, et Dieu demeure en lui.', theme: 'L\'amour inconditionnel' },
  { id: 4, ficheId: 1, reference: 'Psaume 16:2', text: 'Je dis à l\'Éternel : Tu es mon Seigneur, Tu es mon souverain bien !', theme: 'Attachement à Dieu' },
  { id: 5, ficheId: 2, reference: 'Romains 5:12', text: 'C\'est pourquoi, comme par un seul homme le péché est entré dans le monde, et par le péché la mort, et qu\'ainsi la mort s\'est étendue sur tous les hommes, parce que tous ont péché...', theme: 'La réalité du péché' },
  { id: 6, ficheId: 2, reference: 'Romains 3:23', text: 'Car tous ont péché et sont privés de la gloire de Dieu.', theme: 'Séparation de l\'homme' },
  { id: 7, ficheId: 2, reference: 'Romains 6:23', text: 'Car le salaire du péché, c\'est la mort; mais le don gratuit de Dieu, c\'est la vie éternelle en Jésus-Christ notre Seigneur.', theme: 'Le don de la vie' },
  { id: 8, ficheId: 2, reference: '1 Corinthiens 1:18', text: 'Car la prédication de la croix est une folie pour ceux qui périssent; mais pour nous qui sommes sauvés, elle est une puissance de Dieu.', theme: 'La puissance de la croix' },
  { id: 9, ficheId: 3, reference: 'Jean 3:36', text: 'Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra point la vie, mais la colère de Dieu demeure sur lui.', theme: 'La foi salvatrice' },
  { id: 10, ficheId: 3, reference: 'Romains 10:9', text: 'Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l\'a ressuscité des morts, tu seras sauvé.', theme: 'Confession et salut' },
  { id: 11, ficheId: 3, reference: '1 Jean 3:1', text: 'Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu ! Et nous le sommes.', theme: 'Enfants de Dieu' },
  { id: 12, ficheId: 4, reference: 'Éphésiens 2:8-9', text: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est point par les œuvres, afin que personne ne se glorifie.', theme: 'Le don de la Grâce' },
  { id: 13, ficheId: 4, reference: 'Jean 15:7', text: 'Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez, et cela vous sera accordé.', theme: 'Demeurer en Christ' },
  { id: 14, ficheId: 5, reference: '2 Corinthiens 5:17', text: 'Si quelqu\'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.', theme: 'Nouvelle identité' },
  { id: 15, ficheId: 5, reference: 'Galates 2:20', text: 'J\'ai été crucifié avec Christ; et si je vis, ce n\'est plus moi qui vis, c\'est Christ qui vit en moi.', theme: 'Christ en nous' },
  { id: 16, ficheId: 6, reference: 'Romains 12:2', text: 'Soyez transformés par le renouvellement de l’intelligence, afin que vous discerniez quelle est la volonté de Dieu.', theme: 'Une pensée renouvelée' },
  { id: 17, ficheId: 7, reference: 'Jean 8:36', text: 'Si donc le Fils vous affranchit, vous serez réellement libres.', theme: 'Une liberté véritable' },
  { id: 18, ficheId: 8, reference: 'Jacques 4:7', text: 'Soumettez-vous donc à Dieu; résistez au diable, et il fuira loin de vous.', theme: 'Demeurer libre' },
  { id: 19, ficheId: 9, reference: 'Romains 8:14', text: 'Tous ceux qui sont conduits par l’Esprit de Dieu sont fils de Dieu.', theme: 'Conduits par l’Esprit' },
  { id: 20, ficheId: 10, reference: 'Actes 1:8', text: 'Vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins.', theme: 'La puissance pour témoigner' },
  { id: 21, ficheId: 11, reference: 'Galates 5:22', text: 'Le fruit de l’Esprit, c’est l’amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité.', theme: 'Le fruit de l’Esprit' },
  { id: 22, ficheId: 12, reference: 'Luc 9:23', text: 'Si quelqu’un veut venir après moi, qu’il renonce à lui-même, qu’il se charge chaque jour de sa croix, et qu’il me suive.', theme: 'Suivre Jésus' },
  { id: 23, ficheId: 13, reference: 'Jacques 1:22', text: 'Mettez en pratique la parole, et ne vous bornez pas à l’écouter.', theme: 'Pratiquer la Parole' },
  { id: 24, ficheId: 14, reference: 'Matthieu 6:33', text: 'Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.', theme: 'Chercher le Royaume' },
  { id: 25, ficheId: 15, reference: 'Jean 13:35', text: 'À ceci tous connaîtront que vous êtes mes disciples, si vous avez de l’amour les uns pour les autres.', theme: 'Une communauté d’amour' },
  { id: 26, ficheId: 16, reference: 'Philippiens 4:6', text: 'En toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.', theme: 'Persévérer dans la prière' },
  { id: 27, ficheId: 17, reference: 'Psaume 119:105', text: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.', theme: 'La Parole éclaire' },
  { id: 28, ficheId: 18, reference: 'Hébreux 8:10', text: 'Je mettrai mes lois dans leur esprit, je les écrirai dans leur cœur; et je serai leur Dieu.', theme: 'La nouvelle Alliance' },
  { id: 29, ficheId: 19, reference: 'Romains 11:18', text: 'Ce n’est pas toi qui portes la racine, mais c’est la racine qui te porte.', theme: 'Des racines reçues' },
  { id: 30, ficheId: 20, reference: 'Apocalypse 21:5', text: 'Voici, je fais toutes choses nouvelles.', theme: 'L’espérance finale' },
];

export default function MemorisationPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [filterFiche, setFilterFiche] = useState<number | 'all'>('all');

  const cardList = filterFiche === 'all' 
    ? MEMORIZE_VERSETS 
    : MEMORIZE_VERSETS.filter(v => v.ficheId === filterFiche);

  const currentCard = cardList[currentIndex] || cardList[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cardList.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cardList.length) % cardList.length);
  };

  const markMastered = (id: number) => {
    if (!masteredIds.includes(id)) {
      setMasteredIds([...masteredIds, id]);
    }
    handleNext();
  };

  const markToReview = (id: number) => {
    setMasteredIds(masteredIds.filter(i => i !== id));
    handleNext();
  };

  const speakVerse = (text: string, ref: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${ref}. ${text}`);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Brain className="w-4 h-4 text-amber-600" />
            Mémorisation par Répétition Espacée
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 mb-2">
            Gravez la Parole dans votre Cœur
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Mémorisez les versets clés des 20 fiches grâce au système de flashcards interactives.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-center">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total versets</span>
            <p className="text-xl font-bold text-slate-800">{MEMORIZE_VERSETS.length}</p>
          </div>
          <div>
            <span className="text-xs text-amber-600 font-medium">En apprentissage</span>
            <p className="text-xl font-bold text-amber-600">{MEMORIZE_VERSETS.length - masteredIds.length}</p>
          </div>
          <div>
            <span className="text-xs text-green-600 font-medium">Maîtrisés</span>
            <p className="text-xl font-bold text-green-600">{masteredIds.length}</p>
          </div>
        </div>

        {/* Filter selector */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filtrer par :</span>
            <select
              value={filterFiche}
              onChange={(e) => {
                setFilterFiche(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="all">Tous les versets</option>
              {allFiches.map((fiche) => (
                <option key={fiche.id} value={fiche.id}>Fiche {fiche.id} : {fiche.title}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {cardList.length}
          </span>
        </div>

        {/* Flashcard container */}
        {currentCard && (
          <div className="mb-8">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative min-h-[300px] sm:min-h-[340px] bg-white rounded-3xl p-8 shadow-sm border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isFlipped ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  Fiche {currentCard.ficheId} • {currentCard.theme}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakVerse(currentCard.text, currentCard.reference);
                  }}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                  title="Écouter le verset"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Card Center Content */}
              <div className="text-center py-6">
                {!isFlipped ? (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2 block">
                      Référence
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
                      {currentCard.reference}
                    </h2>
                    <p className="text-xs text-amber-600 font-medium inline-flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" /> Cliquez pour révéler le texte du verset
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <h3 className="text-sm font-bold text-amber-700 mb-3">{currentCard.reference}</h3>
                    <p className="text-lg sm:text-xl font-serif italic text-slate-800 leading-relaxed mb-4">
                      &quot;{currentCard.text}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Indicator */}
              <div className="text-center">
                {masteredIds.includes(currentCard.id) ? (
                  <span className="text-xs text-green-700 bg-green-100 font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-green-600" /> Verset Maîtrisé
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    {isFlipped ? 'Évaluez votre mémorisation ci-dessous' : 'Répétez le verset de mémoire avant de retourner'}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => markToReview(currentCard.id)}
                  className="py-3 px-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" /> À revoir
                </button>
                <button
                  onClick={() => markMastered(currentCard.id)}
                  className="py-3 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Je le sais !
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={handlePrev}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Précédent
                </button>
                <button
                  onClick={() => setIsFlipped(true)}
                  className="py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Voir la réponse
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
