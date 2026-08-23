import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  Headphones,
  HeartHandshake,
  MessageCircleHeart,
  PenLine,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';

const chapters = [
  { range: '01—05', title: 'Recevoir', detail: 'Dieu, le salut, la grâce et votre identité.' },
  { range: '06—10', title: 'Être transformé', detail: 'Vie nouvelle, liberté et présence de l’Esprit.' },
  { range: '11—15', title: 'Devenir disciple', detail: 'Dons, caractère, mission et communauté.' },
  { range: '16—20', title: 'Demeurer & espérer', detail: 'Prière, Bible, alliances et espérance.' },
];

const rhythms = [
  {
    icon: PenLine,
    eyebrow: 'Avant la rencontre',
    title: 'Je prépare',
    text: 'Je lis, j’écoute, je réponds aux questions et je note ce que Dieu travaille en moi.',
  },
  {
    icon: Users,
    eyebrow: 'Chaque semaine',
    title: 'Nous partageons',
    text: 'Un petit groupe de 5 à 6 personnes met des mots sur le chemin, prie et s’encourage.',
  },
  {
    icon: CheckCircle2,
    eyebrow: 'Dans la vraie vie',
    title: 'Je pratique',
    text: 'Chaque fiche se termine par un pas concret : une décision, une conversation ou un service.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f3e9] text-slate-950">
      <section className="relative isolate min-h-[860px] overflow-hidden bg-[#08172d] px-4 pb-24 pt-32 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="absolute -left-28 top-20 h-96 w-96 rounded-full border border-amber-300/15" />
        <div className="absolute -left-12 top-36 h-72 w-72 rounded-full border border-amber-300/10" />
        <div className="absolute right-[-12rem] top-[-10rem] h-[42rem] w-[42rem] rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.03fr_.97fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-100/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" /> Parcours de discipleship numérique
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-[#fff8e8] sm:text-7xl lg:text-[5.6rem]">
              Une foi enracinée.
              <span className="mt-2 block text-amber-300">Une vie transformée.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Les Fondements devient un compagnon de croissance sur 20 semaines : une expérience personnelle profonde, portée par la force du petit groupe.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-7 py-4 text-sm font-bold text-[#08172d] shadow-[0_18px_50px_rgba(251,191,36,.18)] transition hover:-translate-y-0.5 hover:bg-amber-200">
                Commencer mon parcours <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#experience" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/10">
                <PlayCircle className="h-4 w-4 text-amber-300" /> Découvrir l’expérience
              </Link>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 border-t border-white/10 pt-7">
              <div>
                <p className="font-serif text-3xl text-amber-300">20</p>
                <p className="mt-1 text-xs text-slate-400">étapes progressives</p>
              </div>
              <div className="border-l border-white/10 pl-5 sm:pl-8">
                <p className="font-serif text-3xl text-amber-300">171</p>
                <p className="mt-1 text-xs text-slate-400">questions de réflexion</p>
              </div>
              <div className="border-l border-white/10 pl-5 sm:pl-8">
                <p className="font-serif text-3xl text-amber-300">5–6</p>
                <p className="mt-1 text-xs text-slate-400">personnes par groupe</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-6 rounded-[3rem] bg-amber-300/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.55rem] bg-[#fcf8ef] p-5 text-slate-900 sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102447] text-amber-300">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Semaine 09</p>
                      <p className="font-serif text-lg font-bold">La présence de l’Esprit</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">EN COURS</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1.35fr_.65fr]">
                  <div className="rounded-2xl bg-[#102447] p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Votre progression</p>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="font-serif text-4xl">42%</p>
                      <p className="text-xs text-slate-400">8 / 20 fiches</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[42%] rounded-full bg-amber-300" />
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-slate-300">
                      <Headphones className="h-4 w-4 text-amber-300" /> 12 min d’écoute disponibles
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <Brain className="h-5 w-5 text-amber-700" />
                    <p className="mt-8 font-serif text-2xl font-bold">7</p>
                    <p className="text-xs leading-5 text-slate-600">versets à revoir aujourd’hui</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">Prochaine rencontre</p>
                      <p className="mt-1 font-serif text-lg font-bold">Groupe Vie · jeudi 19 h</p>
                    </div>
                    <div className="flex -space-x-2">
                      {['MA', 'JN', 'AK', '+3'].map((person, index) => (
                        <span key={person} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold ${index === 3 ? 'bg-amber-300 text-slate-900' : 'bg-indigo-100 text-indigo-800'}`}>{person}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <MessageCircleHeart className="h-4 w-4 text-rose-500" /> 3 sujets de prière partagés cette semaine
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">La méthode du livret, augmentée</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-tight text-[#0b1d38] sm:text-5xl">Le contenu ne reste pas sur la page. Il devient un rythme de vie.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
              L’application conserve ce qui rend le parcours puissant — préparation personnelle, vérité partagée et mise en pratique — puis lui ajoute la continuité, la mémoire et l’accompagnement qui manquent au papier.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {rhythms.map((rhythm, index) => (
              <article key={rhythm.title} className="group rounded-[2rem] border border-[#ded6c8] bg-white p-7 shadow-[0_15px_50px_rgba(15,23,42,.05)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1d38] text-amber-300">
                    <rhythm.icon className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-4xl text-slate-200">0{index + 1}</span>
                </div>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">{rhythm.eyebrow}</p>
                <h3 className="mt-2 font-serif text-3xl font-semibold text-[#0b1d38]">{rhythm.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{rhythm.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8dfcf] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-800">
                <Compass className="h-4 w-4" /> Une architecture de transformation
              </div>
              <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-[#0b1d38] sm:text-5xl">20 étapes. Un seul chemin cohérent.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Le parcours va de la découverte de Dieu jusqu’à une foi capable de servir, transmettre et espérer. Chaque chapitre prépare le suivant.</p>
              <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-800 hover:text-indigo-600">Voir les 20 fiches <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <article key={chapter.range} className="grid gap-5 rounded-[1.75rem] border border-white/70 bg-[#f8f3e9] p-6 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:p-8">
                  <p className="font-serif text-3xl text-amber-700">{chapter.range}</p>
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-[#0b1d38]">{chapter.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{chapter.detail}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500">{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0b1d38] text-white lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Une plateforme, trois espaces</p>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight sm:text-5xl">Personnel. Communautaire. Missionnel.</h2>
            <div className="mt-10 space-y-7">
              {[
                [BookOpen, 'Mon parcours', 'Fiches interactives, audio, questions, quiz et progression.'],
                [HeartHandshake, 'Mon groupe', 'Préparation synchronisée, visio, discussions et mur de prière.'],
                [Sparkles, 'Ma croissance', 'Journal, mémorisation, témoignages, ressources et certificat.'],
              ].map(([Icon, title, text]) => {
                const FeatureIcon = Icon as typeof BookOpen;
                return (
                  <div key={title as string} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300"><FeatureIcon className="h-5 w-5" /></span>
                    <div><h3 className="font-serif text-xl font-semibold">{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{text as string}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative min-h-[500px] overflow-hidden bg-amber-300 p-8 text-[#0b1d38] sm:p-12 lg:p-16">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-[#0b1d38]/20" />
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full border border-[#0b1d38]/15" />
            <div className="relative">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1d38] text-amber-300"><Users className="h-6 w-6" /></span>
              <p className="mt-12 font-serif text-3xl font-semibold leading-snug sm:text-4xl">« La croissance devient durable quand quelqu’un connaît notre chemin et marche avec nous. »</p>
              <p className="mt-8 max-w-md leading-7 text-[#0b1d38]/70">L’espace leader donne une vue claire de la progression, prépare la rencontre et aide à accompagner sans contrôler.</p>
              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/45 p-4"><p className="text-2xl font-serif font-bold">6/6</p><p className="mt-1 text-xs">membres préparés</p></div>
                <div className="rounded-2xl bg-white/45 p-4"><p className="text-2xl font-serif font-bold">4</p><p className="mt-1 text-xs">prières suivies</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Le prochain pas commence ici</p>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-[#0b1d38] sm:text-6xl">Vous n’avez pas besoin d’aller vite. Vous avez besoin d’aller profond.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">Créez votre espace, rejoignez un groupe et transformez les 164 pages du livret en 20 semaines de croissance vécue.</p>
          <Link href="/login" className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-[#0b1d38] px-8 py-4 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-indigo-900">Créer mon espace gratuitement <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-[#ded6c8] px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
        <p>Les Fondements — le livret devient un parcours personnel, communautaire et transmissible.</p>
      </footer>
    </div>
  );
}
