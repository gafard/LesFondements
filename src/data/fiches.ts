export interface Verset {
  reference: string;
  text: string;
  type: 'memorize' | 'read' | 'quote';
}

export interface Section {
  title: string;
  content: string;
  versets: Verset[];
}

export interface Question {
  id: string;
  text: string;
}

export interface Fiche {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  sections: Section[];
  summary: Section[];
  questions: Question[];
  lectures: string[];
  audioUrl?: string;
  videoUrl?: string;
  annexes?: { title: string; content: string }[];
}

export const fiches: Fiche[] = [
  {
    id: 1,
    title: 'Connaître Dieu',
    subtitle: 'Découvrir la nature et le caractère de Dieu',
    icon: 'Crown',
    sections: [
      {
        title: 'Dieu règne',
        content: '<p>Dieu est le créateur de toutes choses et le souverain absolu de l\'univers. Sa majesté et sa puissance sont infinies, et il règne éternellement avec justice et droiture.</p><p>Comprendre que Dieu règne, c\'est accepter qu\'il a le contrôle sur toutes les circonstances de nos vies. Il est l\'Alpha et l\'Oméga, le commencement et la fin (Apocalypse 1:8). Il nous invite à trouver notre sécurité et notre paix dans sa souveraineté, sachant qu\'il est notre refuge et notre force (Psaume 46:11).</p>',
        versets: [
          { reference: 'Ap 1:8', text: 'Je suis l\'alpha et l\'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant.', type: 'memorize' },
          { reference: 'Ps 46:11', text: 'Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.', type: 'memorize' }
        ]
      },
      {
        title: 'Un amour relationnel et inconditionnel',
        content: '<p>L\'amour de Dieu n\'est pas basé sur nos performances ou nos mérites, mais sur sa propre nature. "Dieu est amour" (1 Jean 4:16). Cet amour est parfait, inconditionnel et éternel.</p><p>Dieu désire une relation intime avec chacun de nous. Il nous a créés pour être en communion avec Lui. Nous pouvons lui parler avec des termes d\'affection, sachant qu\'il nous écoute et nous comprend profondément. Notre bonheur suprême se trouve en Lui (Psaume 16:2).</p>',
        versets: [
          { reference: '1 Jn 4:16', text: 'Et nous, nous avons connu l\'amour que Dieu a pour nous, et nous y avons cru. Dieu est amour; et celui qui demeure dans l\'amour demeure en Dieu, et Dieu demeure en lui.', type: 'memorize' },
          { reference: 'Ps 16:2', text: 'Je dis à l\'Éternel : Tu es mon Seigneur, Tu es mon souverain bien !', type: 'memorize' }
        ]
      },
      {
        title: 'Dieu est un (Trinité: Père, Fils, Esprit)',
        content: '<p>Bien qu\'il n\'y ait qu\'un seul Dieu, Il s\'est révélé à nous en trois personnes distinctes mais inséparables : le Père, le Fils (Jésus-Christ) et le Saint-Esprit. C\'est ce que nous appelons la Trinité.</p><p>Le Père est la source de toute chose. Le Fils est la Parole faite chair (Jean 1:1-3) qui est venue nous révéler le Père et accomplir le salut. Le Saint-Esprit est Dieu présent en nous, nous guidant, nous consolant et nous transformant à l\'image de Christ.</p>',
        versets: [
          { reference: 'Jn 1:1-3', text: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Toutes choses ont été faites par elle, et rien de ce qui a été fait n\'a été fait sans elle.', type: 'memorize' }
        ]
      }
    ],
    summary: [
      {
        title: 'L\'essentiel à retenir',
        content: 'Dieu est le souverain de l\'univers, Il nous aime d\'un amour inconditionnel et Il est un Dieu trine (Père, Fils, Saint-Esprit).',
        versets: []
      }
    ],
    questions: [
      { id: '1_1', text: 'Qu\'évoque pour toi le fait que Dieu règne?' },
      { id: '1_2', text: 'As-tu saisi la grandeur de son amour inconditionnel?' },
      { id: '1_3', text: 'Connais-tu Dieu en tant que Père, Fils et Esprit?' },
      { id: '1_4', text: 'Quelle image avais-tu de Dieu?' },
      { id: '1_5', text: 'Qu\'est-ce qui peut faire obstacle pour Le connaître?' },
      { id: '1_6', text: 'Parles-tu à Dieu avec termes d\'affection?' }
    ],
    lectures: ['Pr 1:7', 'Pr 2:5', 'Lc 15:11-32', 'Jean 14-17'],
    annexes: [
      {
        title: 'La Lettre d\'Amour du Père',
        content: 'Mon enfant,\n\nTu ne me connais peut-être pas, mais je sais tout de toi... Je sais quand tu t\'assieds et quand tu te lèves... Je connais toutes tes voies... Même les cheveux de ta tête sont comptés... Car tu as été créé à mon image... En moi tu as la vie, le mouvement et l\'être... Car tu es de ma race...\n\nAvant même de te former dans le ventre de ta mère, je te connaissais... Je t\'ai choisi avant la création du monde... Tu n\'es pas une erreur, car tous tes jours sont écrits dans mon livre... J\'ai déterminé le temps exact de ta naissance et où tu vivrais... Tu as été créé d\'une manière créature merveilleuse... Je t\'ai tissé dans le ventre de ta mère... Et c\'est moi qui t\'ai fait sortir du sein de ta mère...\n\nJ\'ai été mal représenté par ceux qui ne me connaissent pas... Je ne suis pas distant et fâché, car je suis l\'expression parfaite de l\'amour... Et mon désir est de déverser mon amour sur toi... Simplement parce que tu es mon enfant et que je suis ton Père... Je t\'offre plus que ton père terrestre ne pourrait jamais t\'offrir... Car je suis le Père parfait...\n\nTout don excellent que tu reçois vient de ma main... Car je suis celui qui pourvoit à tous tes besoins... Mon plan pour ton avenir a toujours été rempli d\'espérance... Parce que je t\'aime d\'un amour éternel... Mes pensées vers toi sont innombrables comme le sable de la mer...\n\nEt je me réjouis de toi avec des chants d\'allégresse... Je ne cesserai jamais de te faire du bien... Car tu es mon trésor le plus précieux... Je désire t\'établir de tout mon cœur et de toute mon âme... Et je veux te montrer des choses grandes et merveilleuses... Si tu me cherches de tout ton cœur, tu me trouveras...\n\nFais de moi tes délices et je te donnerai ce que ton cœur désire... Car c\'est moi qui te donne ces désirs... Je suis capable de faire infiniment au-delà de ce que tu pourrais demander ou penser... Car je suis ta plus grande consolation... Je suis aussi le Père qui te console dans toutes tes peines... Quand tu as le cœur brisé, je suis près de toi... Comme un berger porte un agneau, je te porte sur mon cœur...\n\nUn jour, j\'essuierai toute larme de tes yeux... Et je prendrai toute la douleur que tu as subie sur cette terre... Je suis ton Père, et je t\'aime de la même façon que j\'aime mon fils, Jésus... Car en Jésus, mon amour pour toi est révélé... Il est la représentation exacte de mon être... Il est venu démontrer que je suis pour toi, pas contre toi... Et te dire que je ne compte pas tes péchés...\n\nJésus est mort pour que toi et moi puissions être réconciliés... Sa mort a été l\'expression ultime de mon amour pour toi... J\'ai donné tout ce que j\'aime pour gagner ton amour... Si tu reçois le don de mon Fils Jésus, tu me reçois... Et rien ne te séparera plus jamais de mon amour...\n\nReviens à la maison et je donnerai la plus grande fête que le ciel ait jamais vue... J\'ai toujours été Père, et je serai toujours Père... Ma question est : Veux-tu être mon enfant ?... Je t\'attends...'
      }
    ]
  },
  {
    id: 2,
    title: 'Le péché, le salut',
    subtitle: 'Comprendre notre séparation et le plan de Dieu',
    icon: 'Cross',
    sections: [
      {
        title: 'Le péché',
        content: '<p>À la création, l\'homme vivait en parfaite communion avec Dieu. Mais par la désobéissance (la Chute), le péché est entré dans l\'humanité, brisant cette relation originelle. Le péché n\'est pas seulement une mauvaise action, mais une nature, un état de séparation volontaire d\'avec notre Créateur.</p><p>Cette rupture a affecté toute la création. "Par un seul homme le péché est entré dans le monde, et par le péché la mort" (Romains 5:12). Personne n\'est épargné par cette condition : "Car tous ont péché et sont privés de la gloire de Dieu" (Romains 3:23). Le péché entraîne des conséquences mortelles, spirituellement et physiquement.</p>',
        versets: [
          { reference: 'Rm 5:12', text: 'C\'est pourquoi, comme par un seul homme le péché est entré dans le monde, et par le péché la mort, et qu\'ainsi la mort s\'est étendue sur tous les hommes, parce que tous ont péché...', type: 'memorize' },
          { reference: 'Rm 3:23', text: 'Car tous ont péché et sont privés de la gloire de Dieu.', type: 'memorize' }
        ]
      },
      {
        title: 'La Loi',
        content: '<p>La Loi donnée par Dieu à Moïse (la Torah, incluant les 10 commandements) est sainte, juste et bonne. Son but n\'était pas de sauver l\'homme, car l\'être humain imparfait est incapable de l\'accomplir parfaitement. La Loi sert de miroir pour nous révéler notre état pécheur et notre besoin d\'un Sauveur.</p><p>Nous ne pouvons pas être justifiés (rendus justes devant Dieu) par l\'observation de la Loi ou par nos bonnes œuvres. La Loi nous condamne, montrant que nous n\'atteignons jamais le standard de perfection de Dieu.</p>',
        versets: []
      },
      {
        title: 'Le Salut',
        content: '<p>Laissé à lui-même, l\'homme est coupé de Dieu, et "le salaire du péché, c\'est la mort" (Romains 6:23). Mais Dieu, dans son amour infini, a pris l\'initiative du salut. Jésus-Christ est venu comme notre substitut parfait.</p><p>À la croix, un échange a eu lieu. Jésus a pris sur lui nos péchés et la condamnation que nous méritions, et nous offre en retour sa justice et la vie éternelle. La prédication de la croix est une folie pour ceux qui périssent (1 Corinthiens 1:18), mais elle est la puissance de Dieu pour nous sauver. Par sa résurrection, Jésus a vaincu la mort, et ce salut nous est offert par grâce.</p>',
        versets: [
          { reference: 'Rm 6:23', text: 'Car le salaire du péché, c\'est la mort; mais le don gratuit de Dieu, c\'est la vie éternelle en Jésus-Christ notre Seigneur.', type: 'memorize' },
          { reference: '1 Co 1:18', text: 'Car la prédication de la croix est une folie pour ceux qui périssent; mais pour nous qui sommes sauvés, elle est une puissance de Dieu.', type: 'memorize' }
        ]
      }
    ],
    summary: [
      {
        title: 'L\'essentiel à retenir',
        content: 'Le péché nous a séparés de Dieu, la Loi nous montre notre besoin d\'un sauveur, et Jésus a accompli le salut à la croix par substitution.',
        versets: []
      }
    ],
    questions: [
      { id: '2_1', text: 'Que représente le péché?' },
      { id: '2_2', text: 'Ai-je conscience que le péché a coupé la relation avec Dieu?' },
      { id: '2_3', text: 'Ai-je conscience de l\'impossibilité de respecter parfaitement la Loi?' },
      { id: '2_4', text: 'Ai-je compris que je suis perdu sans Jésus?' },
      { id: '2_5', text: 'Ai-je compris que c\'est Dieu qui prend l\'initiative du salut?' }
    ],
    lectures: ['Es 53:4-12', 'Ph 2:6-11', 'Ephésiens 2:4-9', 'Dt 5:6-21']
  },
  {
    id: 3,
    title: 'Devenir enfant de Dieu',
    subtitle: 'La nouvelle naissance et la foi',
    icon: 'Heart',
    sections: [
      {
        title: 'La foi',
        content: '<p>La foi n\'est pas un sentiment vague ou une formule magique, mais une confiance absolue en Dieu et en ses promesses. Elle implique un choix conscient de notre volonté. Croire en Jésus, c\'est placer notre vie entière entre ses mains, sachant qu\'Il a accompli tout ce qui est nécessaire pour notre salut.</p><p>Il y a un équilibre vital entre la grâce et la foi. La grâce est la main tendue de Dieu qui offre le salut gratuitement. La foi est notre main qui s\'ouvre pour recevoir ce cadeau immérité.</p>',
        versets: [
          { reference: 'Jn 3:36', text: 'Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra point la vie, mais la colère de Dieu demeure sur lui.', type: 'memorize' }
        ]
      },
      {
        title: 'La nécessité d\'une nouvelle naissance',
        content: '<p>Jésus a déclaré qu\'il faut naître de nouveau pour voir le royaume de Dieu. Notre nature humaine déchue doit être transformée. La conversion implique deux aspects : la repentance (changer de direction, se détourner du péché) et la foi (se tourner vers Christ).</p><p>Par cette nouvelle naissance spirituelle, nous devenons une nouvelle créature et sommes adoptés dans la famille de Dieu. "Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu !" (1 Jean 3:1a). Confesser de notre bouche et croire dans notre cœur sont les clés du salut (Romains 10:9-10).</p>',
        versets: [
          { reference: 'Rm 10:9-10', text: 'Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l\'a ressuscité des morts, tu seras sauvé. Car c\'est en croyant du cœur qu\'on parvient à la justice, et c\'est en confessant de la bouche qu\'on parvient au salut.', type: 'memorize' },
          { reference: '1 Jn 3:1a', text: 'Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu !', type: 'memorize' }
        ]
      },
      {
        title: 'Le baptême',
        content: '<p>Le baptême d\'eau est un acte d\'obéissance et un témoignage public de notre nouvelle naissance. Il symbolise notre identification avec Christ dans sa mort (plongé dans l\'eau) et dans sa résurrection (sorti de l\'eau) pour marcher en nouveauté de vie.</p>',
        versets: []
      }
    ],
    summary: [
      {
        title: 'L\'essentiel à retenir',
        content: 'Nous sommes sauvés par grâce, par le moyen de la foi. Ce salut entraîne une nouvelle naissance qui fait de nous des enfants de Dieu.',
        versets: []
      }
    ],
    questions: [
      { id: '3_1', text: 'Comment définirais-tu la foi?' },
      { id: '3_2', text: 'As-tu expérimenté la marche par la foi?' },
      { id: '3_3', text: 'Même si Dieu veut que tous soient sauvés, comprends-tu que tous ne le seront pas (refus de croire)?' },
      { id: '3_4', text: 'Ai-je fait cette démarche personnelle de repentance et de foi?' },
      { id: '3_5', text: 'Est-ce que je suis convaincu d\'être né de nouveau?' },
      { id: '3_6', text: 'Est-ce que je me considère pleinement comme enfant de Dieu?' }
    ],
    lectures: ['Hébreux 11', 'Romains 4', 'Jn 3:1-6', 'Hébreux 10:19-22', '1 Jn 1:9', 'Ac 19:18-19']
  },
  {
    id: 4,
    title: 'La Grâce',
    subtitle: 'Vivre libéré du légalisme',
    icon: 'Wind',
    sections: [
      {
        title: 'Qu\'est-ce que la Grâce',
        content: '<p>La grâce est la faveur imméritée de Dieu. "Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi" (Éphésiens 2:8). Elle n\'est pas seulement le pardon de nos péchés, mais aussi la puissance de Dieu agissant dans nos vies pour nous rendre capables de vivre comme Il le désire. Jésus est venu pour que nous ayons la vie en abondance (Jean 10:10).</p><p>Une fois sauvés, nous devenons une nouvelle création (2 Corinthiens 5:17). Les choses anciennes sont passées, toutes choses sont devenues nouvelles.</p>',
        versets: [
          { reference: 'Ep 2:8', text: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu.', type: 'memorize' },
          { reference: 'Jn 10:10', text: 'Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu\'elles soient dans l\'abondance.', type: 'memorize' },
          { reference: '2 Co 5:17', text: 'Si quelqu\'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.', type: 'memorize' }
        ]
      },
      {
        title: 'Pourquoi la grâce est-elle difficile à vivre ?',
        content: '<p>Vivre la grâce est souvent difficile parce que nous avons une tendance naturelle au légalisme, croyant que nous devons "mériter" l\'amour de Dieu par nos efforts. Nous essayons d\'établir notre propre justice au lieu de nous reposer sur celle de Christ.</p><p>De plus, une fausse identité basée sur nos échecs passés ou le regard des autres nous empêche souvent d\'accepter pleinement le regard de grâce que Dieu porte sur nous.</p>',
        versets: []
      },
      {
        title: 'Comment Dieu me fait croître',
        content: '<p>La croissance spirituelle est aussi l\'œuvre de la grâce. Dieu ranime notre désir pour Lui, sème sa Parole dans nos cœurs et nous appelle à une relation d\'intimité. C\'est par cette communion, en demeurant en Lui (Jean 15:7), que nous obtenons la victoire sur le péché, non par nos propres forces.</p><p>Notre part est l\'obéissance, mais une obéissance motivée par l\'amour, non par la peur ou le devoir. "Si vous gardez mes commandements, vous demeurerez dans mon amour" (Jean 15:10). Nous sommes appelés à être transformés par le renouvellement de notre intelligence (Romains 12:2).</p>',
        versets: [
          { reference: 'Jn 15:7', text: 'Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez, et cela vous sera accordé.', type: 'memorize' },
          { reference: 'Jn 15:10', text: 'Si vous gardez mes commandements, vous demeurerez dans mon amour, de même que j\'ai gardé les commandements de mon Père, et que je demeure dans son amour.', type: 'memorize' },
          { reference: 'Rm 12:2', text: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l\'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.', type: 'memorize' }
        ]
      }
    ],
    summary: [
      {
        title: 'L\'essentiel à retenir',
        content: 'La grâce n\'est pas seulement un laissez-passer pour le ciel, c\'est la puissance de Dieu pour vivre une vie transformée, loin du légalisme.',
        versets: []
      }
    ],
    questions: [
      { id: '4_1', text: 'Ai-je tendance au légalisme (vouloir mériter) ?' },
      { id: '4_2', text: 'Suis-je dans le repos de la grâce ou dans la performance ?' },
      { id: '4_3', text: 'Mon identité repose-t-elle sur ce que je fais ou sur ce que Dieu dit ?' },
      { id: '4_4', text: 'Comment est ma soif, mon désir pour Dieu ?' },
      { id: '4_5', text: 'Pour moi, l\'obéissance est-elle un plaisir ou une contrainte ?' }
    ],
    lectures: ['Galates 5', 'Romains 6']
  },
  {
    id: 5,
    title: 'Mon identité en Christ',
    subtitle: 'Comprendre qui je suis devenu',
    icon: 'User',
    sections: [
      {
        title: 'Ce que Dieu a fait pour moi',
        content: '<p>À la croix, il s\'est produit un merveilleux "échange divin". Jésus a pris sur lui tout ce qui était mauvais en nous, pour nous donner tout ce qui était parfait en lui. Il a pris notre péché et nous a donné sa justice : "Celui qui n\'a point connu le péché, il l\'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu" (2 Corinthiens 5:21).</p><p>Dieu nous a délivrés du pouvoir des ténèbres et nous a transportés dans le royaume de son Fils bien-aimé (Colossiens 1:13). Notre ancienne nature a été crucifiée avec Christ, et maintenant, c\'est Christ qui vit en nous (Galates 2:20).</p>',
        versets: [
          { reference: '2 Co 5:21', text: 'Celui qui n\'a point connu le péché, il l\'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu.', type: 'memorize' },
          { reference: 'Col 1:13', text: 'Qui nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume du Fils de son amour.', type: 'memorize' },
          { reference: 'Ga 2:20', text: 'J\'ai été crucifié avec Christ; et si je vis, ce n\'est plus moi qui vis, c\'est Christ qui vit en moi.', type: 'memorize' }
        ]
      },
      {
        title: 'Qui je suis en Christ',
        content: '<p>Notre véritable identité ne se trouve ni dans notre passé, ni dans nos réussites, ni dans ce que les autres pensent de nous, mais uniquement dans ce que Dieu déclare à notre sujet. En Christ, nous sommes une nouvelle création, totalement justifiés (déclarés justes comme si nous n\'avions jamais péché).</p><p>La Bible nous appelle des saints, non pas parce que nous sommes parfaits dans nos actions, mais parce que nous avons été mis à part pour Dieu et revêtus de la justice de Christ. Nous devons apprendre à nous voir comme Dieu nous voit.</p>',
        versets: []
      },
      {
        title: 'Déclarations de mon identité',
        content: '<p>Il est vital de proclamer ce que la Parole dit de nous. Je suis pardonné. Je suis accepté. Je suis enfant de Dieu. Je suis temple du Saint-Esprit. Je suis racheté, justifié et glorifié.</p><p>Remplacer les mensonges de l\'ennemi (accusations, culpabilité, honte) par la vérité de la Parole de Dieu est le chemin vers la liberté. Notre esprit doit être renouvelé pour aligner nos pensées sur notre nouvelle réalité spirituelle.</p>',
        versets: []
      }
    ],
    summary: [
      {
        title: 'L\'essentiel à retenir',
        content: 'Mon identité a changé lors de la nouvelle naissance grâce à l\'échange accompli à la croix. Je suis maintenant justifié et saint en Christ.',
        versets: []
      }
    ],
    questions: [
      { id: '5_1', text: 'Ai-je compris l\'échange divin accompli à la croix ?' },
      { id: '5_2', text: 'Comment est-ce que je me vois moi-même au quotidien ?' },
      { id: '5_3', text: 'Est-ce que je me considère véritablement comme un saint ?' },
      { id: '5_4', text: 'Ai-je des mensonges sur mon identité qu\'il me faut rejeter ?' }
    ],
    lectures: ['Romains 8', 'Éphésiens 1']
  }
];
