import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HeartHandshake,
  PenLine,
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
      <section className="relative isolate min-h-[860px] overflow-hidden bg-[#07162b] text-white">
        <Image
          src="/hero-community-v2.png"
          alt="Un petit groupe réuni autour d’un livre ouvert sur un chemin doré"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#07162b_0%,rgba(7,22,43,.96)_32%,rgba(7,22,43,.46)_62%,rgba(7,22,43,.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#07162b] to-transparent" />
        <div className="absolute left-[46%] top-28 hidden h-20 w-20 rotate-12 items-center justify-center rounded-full border border-amber-300/50 bg-[#07162b]/70 font-serif text-xs italic text-amber-200 backdrop-blur-md lg:flex">ensemble</div>

        <div className="relative mx-auto flex min-h-[860px] max-w-7xl flex-col justify-center px-4 pb-40 pt-32 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-[#07162b]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Un parcours à vivre, pas à terminer
            </div>
            <h1 className="font-serif text-5xl font-semibold leading-[0.93] tracking-[-0.045em] text-[#fff8e8] sm:text-7xl lg:text-[6.4rem]">
              Une foi
              <span className="block italic text-amber-300">enracinée.</span>
              Une vie transformée.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-200 sm:text-xl">
              20 semaines pour apprendre en profondeur, parler en vérité et mettre sa foi en mouvement — personnellement et avec cinq autres personnes.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-7 py-4 text-sm font-bold text-[#08172d] shadow-[0_18px_50px_rgba(251,191,36,.18)] transition hover:-translate-y-0.5 hover:bg-amber-200">
                Commencer le chemin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#experience" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15">
                Comprendre la méthode
              </Link>
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-8 grid max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border border-white/15 bg-[#07162b]/70 backdrop-blur-xl sm:left-6 sm:right-auto sm:w-[44rem] lg:left-8">
            {[
              ['20', 'étapes progressives'],
              ['171', 'questions de réflexion'],
              ['5–6', 'personnes par groupe'],
            ].map(([value, label], index) => (
              <div key={value} className={`p-4 sm:p-5 ${index > 0 ? 'border-l border-white/10' : ''}`}>
                <p className="font-serif text-2xl text-amber-300 sm:text-3xl">{value}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-300 sm:text-xs">{label}</p>
              </div>
            ))}
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

      <section className="editorial-paper bg-[#e8dfcf] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-800">
              <Compass className="h-4 w-4" /> La feuille de route
            </div>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-[#0b1d38] sm:text-6xl">20 étapes.<br /><span className="italic text-amber-700">Un chemin qui vous déplace.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">Le parcours avance comme une histoire : recevoir, être transformé, devenir disciple, puis demeurer et transmettre.</p>
          </div>

          <div className="roadmap-track relative mt-20 grid gap-5 lg:grid-cols-4">
            {chapters.map((chapter, index) => (
              <article key={chapter.range} className={`relative z-10 min-h-64 rounded-[2rem] border border-white/80 p-7 shadow-[0_18px_50px_rgba(15,23,42,.08)] ${index % 2 === 0 ? 'bg-[#fffaf0] lg:-translate-y-5' : 'bg-[#0b1d38] text-white lg:translate-y-5'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${index % 2 === 0 ? 'text-amber-700' : 'text-amber-300'}`}>Chapitre {index + 1}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm ${index % 2 === 0 ? 'bg-amber-300 text-[#0b1d38]' : 'bg-white/10 text-amber-300'}`}>{index + 1}</span>
                </div>
                <p className={`mt-10 font-serif text-3xl ${index % 2 === 0 ? 'text-amber-700' : 'text-amber-300'}`}>{chapter.range}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold">{chapter.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${index % 2 === 0 ? 'text-slate-600' : 'text-slate-300'}`}>{chapter.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-16 text-center"><Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-[#0b1d38]/20 bg-white/50 px-6 py-3 text-sm font-bold text-indigo-900 transition hover:bg-white">Explorer les 20 fiches <ArrowRight className="h-4 w-4" /></Link></div>
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
