import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HeartHandshake,
  PenLine,
  Users,
  Brain,
  Award,
  Flame,
  Search,
  Quote,
} from 'lucide-react';

const chapters = [
  { 
    range: '01—05', 
    title: 'Recevoir', 
    detail: 'Dieu, le salut, la grâce souveraine et votre identité nouvelle en Christ.',
    badge: 'Fondation'
  },
  { 
    range: '06—10', 
    title: 'Être transformé', 
    detail: 'Vie nouvelle, liberté des forteresses, pardon et puissance du Saint-Esprit.',
    badge: 'Libération'
  },
  { 
    range: '11—15', 
    title: 'Devenir disciple', 
    detail: 'Dons de l’Esprit, caractère forger, communauté relationnelle et mission du Royaume.',
    badge: 'Maturité'
  },
  { 
    range: '16—20', 
    title: 'Demeurer & espérer', 
    detail: 'L\'intimité de la prière, la Bible vivante, les alliances et l\'espérance éternelle.',
    badge: 'Transmission'
  },
];

const rhythms = [
  {
    icon: PenLine,
    eyebrow: 'Avant la rencontre',
    title: 'Je prépare personnellement',
    text: 'Dans le calme, avec une boisson chaude : je lis, j’écoute la voix, je médite et j’écris ce qui résonne en moi.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    image: '/warm-quiet-time.jpg'
  },
  {
    icon: Users,
    eyebrow: 'Chaque semaine',
    title: 'Nous partageons en cellule',
    text: 'À 5 ou 6 dans un salon ou en visio : on partage ses pépites, on prie les uns pour les autres avec bienveillance.',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    image: '/warm-fellowship.jpg'
  },
  {
    icon: CheckCircle2,
    eyebrow: 'Dans la vraie vie',
    title: 'Je pratique et transmets',
    text: 'Chaque fiche débouche sur un pas d’amour concret : une réconciliation, un service rendu, une bénédiction partagée.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    image: '/group-communion-hero.jpg'
  },
];

export default function Home() {
  return (
    <div className="table-travail min-h-screen text-encre-900 selection:bg-amber-300 selection:text-slate-950 relative overflow-hidden">
      
      {/* Subtle Background Watermark Typography */}
      <div className="watermark-text absolute right-6 top-32 text-[15vw] opacity-30 select-none">
        FONDEMENTS
      </div>

      {/* ==================================================================== */}
      {/* HERO SECTION                                                         */}
      {/* ==================================================================== */}
      <section className="relative isolate min-h-[92vh] flex items-center overflow-hidden bg-[#07162b] text-white pt-20 pb-16">
        
        {/* Hero Overhead Community Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-community-v2.png"
            alt="Petit groupe africain réuni autour d’un livre ouvert relié par un ruban doré"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] opacity-45 sm:opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07162b] via-[#07162b]/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07162b] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-12">
          <div className="max-w-2xl">
            <span className="timbre rounded-md px-3.5 py-1 text-2xs font-bold text-or-300 border-or-400/40">
              LE PARCOURS DES 20 FONDEMENTS
            </span>

            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.08] text-parchemin-100 sm:text-6xl lg:text-7xl">
              Ancrer sa foi.<br />
              <span className="italic text-or-400">Grandir ensemble.</span>
            </h1>

            <p className="mt-6 text-base leading-relaxed text-parchemin-100/80 sm:text-lg">
              Un parcours interactif de 20 fiches pour plonger dans les fondements de la vie chrétienne,
              seul dans le secret et chaque semaine en cellule de communion.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold shadow-lg"
              >
                Rejoindre ou créer une cellule
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/fiches"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
              >
                Découvrir le sentier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 1 BIS : LES DEUX PORTES                                      */}
      {/* ==================================================================== */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">
            Avant la première fiche
          </p>
          <h2 className="font-serif text-3xl font-bold leading-tight text-encre-950 sm:text-5xl">
            Le parcours ne
            <span className="italic text-or-600"> s&apos;ouvre pas seul.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-encre-700">
            Tant qu&apos;il n&apos;y a pas de groupe, les fiches restent fermées. C&apos;est la
            règle du livret, et c&apos;est ce qui fait tenir les cinq mois.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="feuille pose-1 relative rounded-3xl border border-parchemin-300 p-7 shadow-sm transition-all hover:shadow-md">
            <span className="punaise -top-2.5 left-8" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-or-50 text-or-700 shadow-xs">
              <Search className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl font-bold text-encre-950">
              Rejoindre un groupe
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-encre-600">
              Vous indiquez votre ville — ou vous laissez l&apos;application vous situer. Les
              groupes vous sont proposés du plus proche au plus lointain, avec les places qui
              restent et le jour où ils se retrouvent.
            </p>
            <ul className="mt-5 space-y-2 border-t border-parchemin-300/80 pt-4">
              {[
                'Seuls les groupes non complets sont proposés',
                'Vous envoyez une demande, l’animateur vous accueille',
                'Aucun groupe autour de vous ? Il en existe un 100 % en ligne',
              ].map((ligne) => (
                <li key={ligne} className="flex gap-2.5 text-2xs leading-relaxed text-encre-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or-600" />
                  {ligne}
                </li>
              ))}
            </ul>
          </div>

          <div className="feuille pose-2 relative rounded-3xl border border-parchemin-300 p-7 shadow-sm transition-all hover:shadow-md">
            <span className="ruban -top-2.5 left-8 -rotate-1 rounded-[2px]" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-or-50 text-or-700 shadow-xs">
              <Flame className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl font-bold text-encre-950">
              Créer le vôtre
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-encre-600">
              Vous avez déjà quelques personnes en tête. Vous fixez le jour, l&apos;heure et le
              lieu, puis vous les invitez par e-mail ou en partageant un code.
            </p>
            <ul className="mt-5 space-y-2 border-t border-parchemin-300/80 pt-4">
              {[
                'Présentiel, visio, ou les deux à la fois',
                'Chacun annonce s’il vient sur place ou se connecte',
                'Le déroulé de la rencontre est guidé, étape par étape',
              ].map((ligne) => (
                <li key={ligne} className="flex gap-2.5 text-2xs leading-relaxed text-encre-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or-600" />
                  {ligne}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Warm Fellowship Showcase Card */}
        <div className="mt-12 overflow-hidden rounded-4xl bg-[#07162b] text-white shadow-2xl border border-amber-300/20 grid lg:grid-cols-12">
          <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px]">
            <Image
              src="/warm-fellowship.jpg"
              alt="Groupe d'amis réunis dans un salon chaleureux autour de la Bible et d'un thé"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07162b] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#07162b]" />
          </div>

          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <p className="font-serif italic text-amber-300 text-xs sm:text-sm mb-2">
                La vie en petit groupe • Page 3 du livret
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-snug text-[#fff8e8]">
                « Pas un cours magistral, mais un partage de cœur. »
              </h3>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-300">
                Chez soi autour d&apos;une boisson chaude ou en visio, on pose les masques. On rit, on prie les uns pour les autres, et on s&apos;encourage dans les victoires comme dans les luttes.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-2xs text-amber-200/90 font-medium">
              <span>☕ 5 à 6 personnes par cellule</span>
              <span>🤝 Confidentialité & bienveillance</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-[#ded6c8] bg-white/80 px-6 py-5 text-center shadow-2xs backdrop-blur-md">
          <p className="font-serif text-sm sm:text-base italic leading-relaxed text-slate-800">
            « Une fiche à la fois : vous la préparez dans le calme, vous la vivez ensemble, puis la suivante s&apos;ouvre. »
          </p>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2 : LE RYTHME HEBDOMADAIRE                                   */}
      {/* ==================================================================== */}
      <section id="experience" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">
            Le rythme d&apos;apprentissage
          </p>
          <h2 className="font-serif text-3xl font-bold leading-tight text-encre-950 sm:text-5xl">
            Trois temps forts.<br />
            <span className="italic text-or-600">Une seule transformation.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-encre-600">
            Le livret a été pensé pour que chaque semaine s’articule autour de 3 piliers complémentaires :
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {rhythms.map((rhythm, index) => {
            const poses = ['pose-1', 'pose-2', 'pose-3'];
            const pose = poses[index % poses.length];

            return (
              <div
                key={rhythm.title}
                className={`feuille ${pose} relative flex flex-col justify-between overflow-hidden rounded-3xl border border-parchemin-300 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-7`}
              >
                <span className="ruban -top-2.5 left-8 -rotate-1 rounded-[2px]" />
                <div>
                  {/* Warm Photo Header */}
                  <div className="relative mb-6 h-44 w-full overflow-hidden rounded-2xl shadow-2xs">
                    <Image
                      src={rhythm.image}
                      alt={rhythm.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 font-serif text-3xl font-bold text-white drop-shadow-md">
                      0{index + 1}
                    </span>
                  </div>
                  
                  <span className="timbre rounded-md px-3 py-1 text-2xs font-bold text-or-800">
                    {rhythm.eyebrow}
                  </span>

                  <h3 className="mb-2 mt-3 font-serif text-xl font-bold text-encre-950 sm:text-2xl">{rhythm.title}</h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-encre-600">{rhythm.text}</p>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-parchemin-300/80 pt-4 text-2xs font-semibold text-or-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-or-600" /> Engagement fraternel
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3 : LA FEUILLE DE ROUTE (ROADMAP 4 CHAPITRES)                 */}
      {/* ==================================================================== */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="manuscrit mb-2 text-xl text-or-800">
              La feuille de route
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-encre-950 sm:text-5xl">
              20 étapes.<br /><span className="italic text-or-600">Un sentier qui vous déplace.</span>
            </h2>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-encre-600">
              Le parcours avance comme une histoire vivante : recevoir, être transformé, devenir disciple, puis demeurer et transmettre.
            </p>
          </div>

          {/* 4 Grand Chapters Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {chapters.map((chapter, index) => {
              const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];
              const pose = poses[index % poses.length];

              return (
                <div
                  key={chapter.range}
                  className={`feuille ${pose} relative z-10 rounded-3xl border border-parchemin-300 p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}
                >
                  <span className="punaise -top-2.5 left-6" />
                  <span className="timbre block w-fit rounded px-2.5 py-0.5 text-2xs font-bold text-or-800">
                    {chapter.badge}
                  </span>
                  <span className="mt-4 block font-mono text-xs font-bold tracking-widest text-encre-400">
                    FICHES {chapter.range}
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-encre-950">
                    {chapter.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-encre-600">
                    {chapter.detail}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/login"
              className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-bold shadow-lg"
            >
              Trouver un groupe et ouvrir la fiche 1 <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mx-auto mt-3 max-w-sm text-2xs leading-relaxed text-encre-500">
              Les fiches s&apos;ouvrent une à une, au rythme de votre groupe.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4 : LE CŒUR DE LA PLATEFORME (3 ESPACES)                     */}
      {/* ==================================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          
          {/* Left Navy Column */}
          <div className="bg-[#07162b] text-white p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <p className="font-serif italic text-amber-300 text-sm">
                Une plateforme complète pour votre église
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold leading-tight">
                Personnel. Communautaire. Missionnel.
              </h2>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">Mon Parcours Guidé</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Fiches enrichies, audio narration, questions interactives sauvegardées, quiz de révision et certification finale.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center flex-shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">Mon Groupe & Mur de Prière</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Petits groupes de 5-6 personnes, visioconférence intégrée, partage de pépites et requêtes de prière en direct.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">Mémorisation & Outils Visuels</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Flashcards avec répétition espacée, export d&apos;images HD de versets pour WhatsApp/Instagram et Bible intégrée.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Basé sur le livret original</span>
              <span className="text-amber-300 font-semibold">moneglisepreferee.net</span>
            </div>
          </div>

          {/* Right White Column (Inspiration quote & certificate preview) */}
          <div className="bg-white p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="sticky-note p-5 rounded-2xl mb-8">
                <Quote className="w-6 h-6 text-amber-700/60 mb-2" />
                <p className="font-serif italic text-slate-800 text-sm leading-relaxed">
                  &quot;Ce parcours n&apos;a pas pour but de remplir la tête de connaissances, mais de conduire à une relation vivante et authentique avec le Christ.&quot;
                </p>
                <span className="block mt-3 text-2xs font-bold text-amber-900 uppercase tracking-wider">
                  — Préface du Livret
                </span>
              </div>

              <h3 className="font-serif font-bold text-2xl text-slate-900 mb-3">
                Un certificat de fin de parcours
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                À l&apos;issue des 20 étapes et de la validation des questions de réflexion, recevez votre attestation officielle personnalisée avec le verset de Colossiens 1:28.
              </p>

              <div className="bg-[#f8f3e9] p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div className="text-xs">
                  <strong className="text-slate-900 block font-serif">Reconnaissance de Maturité</strong>
                  <span className="text-slate-600">Prêt à transmettre et accompagner d&apos;autres disciples.</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07162b] hover:bg-indigo-950 text-white py-3.5 px-6 font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Rejoindre maintenant gratuitement <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
