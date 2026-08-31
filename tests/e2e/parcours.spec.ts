import { expect, test } from '@playwright/test';
import { GROUPE, UTILISATEUR, chercherDansLaPile, deposerLesNotes, semerSession } from './fixtures';

test.beforeEach(async ({ page }) => {
  await semerSession(page);
});

test('fiche 1 : une réponse est sauvegardée automatiquement', async ({ page }) => {
  await page.goto('/fiches/1');
  await page.getByRole('button', { name: 'Résumé et partage' }).click();
  const reponse = page.getByPlaceholder("Cette semaine, je m'engage à…");
  await reponse.fill('Prendre dix minutes chaque matin pour méditer.');

  await expect(page.getByText('Vos réponses sont enregistrées')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        ({ uid }) => {
          const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
          return donnees['1']?.answers?.['pas:1'];
        },
        { uid: UTILISATEUR.uid }
      )
    )
    .toContain('dix minutes');
});

test('temps du jour : lire, méditer, prier et mémoriser restent dans la même immersion', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=1&section=0&scene=7');
  await expect(page.locator('.immersion-bureau')).toBeVisible();
  await expect(page.getByText('Méditer la Parole', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Laisser « Dieu règne »/ })).toBeVisible();
  await expect(page.getByText('Relis, attends, écris', { exact: false })).toBeVisible();
  await expect(page.getByText('Lis Apocalypse 1:8 lentement une première fois.', { exact: false })).toBeVisible();
  await expect(page.getByText('Qu’est-ce qui retient ton attention dans la manière dont Dieu parle de lui-même ?')).toBeVisible();

  await page.locator('textarea').first().fill('Dieu règne même lorsque je ne maîtrise pas la situation.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  // La prière ne se tape pas : elle se dit. L'écran reprend ce qui a été
  // écrit à la méditation et invite à parler, sans champ à remplir.
  await expect(page.getByText('Dieu règne même lorsque je ne maîtrise pas la situation.')).toBeVisible();
  await expect(page.getByText('Parle à Dieu maintenant')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que je garde', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choisir un verset' })).toBeDisabled();
  await page.getByRole('button', { name: 'Parole suivante' }).click();
  await page.getByRole('button', { name: /^Ps 46:11/ }).click();
  await expect(page.getByRole('button', { name: /^Ps 46:11/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Mémoriser la Parole', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Vivre cette Parole', { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder('Je veux me souvenir de ce verset lorsque…').fill(
    'Je commencerai à m’inquiéter avant ma réunion.'
  );
  await page.getByPlaceholder('Quand ce moment arrivera, je veux…').fill(
    'Commencer ma journée par reconnaître que Dieu règne.'
  );
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'J’ai préparé' }).click();
  await expect(page.getByRole('heading', { name: 'La Parole est semée.' })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate((uid) => {
        const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
        return {
          termine: donnees['1']?.answers?.['temps-apart:0'],
          verset: donnees['1']?.answers?.['verset-choisi:f1-s1'],
          moment: donnees['1']?.answers?.['pas-moment:f1-s1'],
          pas: donnees['1']?.answers?.['pas:f1-s1'],
        };
      }, UTILISATEUR.uid)
    )
    .toEqual({
      termine: '1',
      verset: 'Ps 46:11',
      moment: 'Je commencerai à m’inquiéter avant ma réunion.',
      pas: 'Commencer ma journée par reconnaître que Dieu règne.',
    });
});

test('fiche 1 · partie 2 : le verset choisi porte la mémorisation et la mise en pratique', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=1&section=1&scene=17');

  await expect(page.getByRole('button', { name: /^1 Jn 4:16/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ps 16:2/ })).toBeVisible();
  await page.getByRole('button', { name: /^1 Jn 4:16/ }).click();

  await expect(page.getByRole('button', { name: /^1 Jn 4:16/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Mémoriser la Parole', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByText('La Parole que tu gardes · 1 Jn 4:16')).toBeVisible();
  await expect(page.getByPlaceholder('Je veux me souvenir de ce verset lorsque…')).toBeVisible();
  await expect(page.getByPlaceholder('Quand ce moment arrivera, je veux…')).toBeVisible();
});

test('fiche 1 · partie 3 : les textes conduisent à une prière issue des découvertes', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=1&section=2&scene=17');

  await expect(page.getByText('Lis lentement Marc 12:29', { exact: false })).toBeVisible();
  await expect(page.locator('article').first()).toHaveClass(/post-it-/);

  await deposerLesNotes(page, [
    'Je découvre un Père qui m’accueille comme son enfant.',
    'Dieu s’approche de notre faiblesse.',
    'Le Saint-Esprit agit et demeure avec nous.',
    'Dieu est un et se fait connaître dans une communion vivante.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  // Les découvertes reviennent sur des fiches, empilées : la première est
  // devant, et c'est bien ce qui a été écrit qui y est repris.
  await expect(page.locator('article.fiche-bristol')).toBeVisible();
  await expect(page.getByText('Je découvre un Père qui m’accueille comme son enfant.')).toBeVisible();
  await expect(page.getByText('1 / 4')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Mémoriser la Parole', { exact: true })).toBeVisible();
  await expect(page.getByText('Mémorisation progressive')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verset 1' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Passage entier' }).click();
  await expect(page.getByText('Jn 1:1-3', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que tu gardes · Jn 1:1-3')).toBeVisible();
});

test('fiche 2 : péché, Loi, salut et grâce forment quatre traversées complètes', async ({ page }) => {
  await page.addInitScript(
    ({ uid, groupeId }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(groupes.map((groupe: { id: string }) =>
          groupe.id === groupeId ? { ...groupe, currentStep: 2 } : groupe
        ))
      );
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          2: {
            completed: false,
            answers: {
              'verset-choisi:f2-s1': 'Rm 5:12',
              'verset-choisi:f2-s2': 'Rm 3:20',
              'verset-choisi:f2-s3': 'Rm 6:23',
            },
            lastUpdated: Date.now(),
          },
        })
      );
    },
    { uid: UTILISATEUR.uid, groupeId: GROUPE.id }
  );

  await page.goto('/dashboard');
  await expect(page.getByText('0 / 4 étapes')).toBeVisible();
  await expect(page.getByText('Le péché', { exact: true })).toBeVisible();
  await expect(page.getByText('La Loi', { exact: true })).toBeVisible();
  await expect(page.getByText('Le Salut', { exact: true })).toBeVisible();
  await expect(page.getByText('La Grâce', { exact: true })).toBeVisible();

  await page.goto('/aujourdhui?fiche=2&section=3&scene=3');
  await expect(page.getByText('Lis Éphésiens 2:4-9 lentement.', { exact: false })).toBeVisible();
  await deposerLesNotes(page, [
    'Je découvre un Dieu riche en bonté qui donne la vie.',
    'La grâce vient de Dieu et ne se gagne pas.',
    'C’est par grâce que vous êtes sauvés.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(page.getByText('Je découvre un Dieu riche en bonté qui donne la vie.')).toBeVisible();
  await expect(page.getByText('1 / 3')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Parole suivante' }).click();
  await page.getByRole('button', { name: /^Ep 2:8-9/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Dans quelle situation aujourd’hui serais-tu tenté de vivre comme si tu devais mériter ce que Dieu donne ?')).toBeVisible();
  await page.getByPlaceholder('Je pourrais chercher à mériter lorsque…').fill(
    'Je pense devoir prouver ma valeur à Dieu.'
  );
  await page.getByPlaceholder('À partir de cette Parole, je voudrais…').fill(
    'Recevoir sa grâce avec reconnaissance.'
  );

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde le chemin parcouru.' })).toBeVisible();
  await expect(page.getByText('Péché', { exact: true })).toBeVisible();
  await expect(page.getByText('Loi', { exact: true })).toBeVisible();
  await expect(page.getByText('Salut', { exact: true })).toBeVisible();
  await expect(page.getByText('Grâce', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ep 2:8-9' })).toBeVisible();
});

test('fiche 3 : six découvertes distinctes conduisent à une Parole principale', async ({ page }) => {
  await page.addInitScript(
    ({ uid, groupeId }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(groupes.map((groupe: { id: string }) =>
          groupe.id === groupeId ? { ...groupe, currentStep: 3 } : groupe
        ))
      );
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          3: {
            completed: false,
            answers: {
              'verset-choisi:f3-s1': 'He 11:1',
              'verset-choisi:f3-s2': 'Ep 2:8-9',
              'verset-choisi:f3-s3': 'Jn 3:36',
              'verset-choisi:f3-s4': '2 Co 5:17',
              'verset-choisi:f3-s5': '1 Jn 3:1a',
            },
            lastUpdated: Date.now(),
          },
        })
      );
    },
    { uid: UTILISATEUR.uid, groupeId: GROUPE.id }
  );

  await page.goto('/dashboard');
  await expect(page.getByText('0 / 6 étapes')).toBeVisible();
  await expect(page.getByText('La foi', { exact: true })).toBeVisible();
  await expect(page.getByText('La grâce et la foi', { exact: true })).toBeVisible();
  await expect(page.getByText('La nécessité d’une nouvelle naissance', { exact: true })).toBeVisible();
  await expect(page.getByText('Une nouvelle création', { exact: true })).toBeVisible();
  await expect(page.getByText('Enfant de Dieu, adopté du Père', { exact: true })).toBeVisible();
  await expect(page.getByText('Après la nouvelle naissance : le baptême', { exact: true })).toBeVisible();

  await page.goto('/aujourdhui?fiche=3&section=3&scene=3');
  await expect(page.getByText('Lis 2 Corinthiens 5:17 lentement', { exact: false })).toBeVisible();
  await expect(page.locator('textarea').first()).toBeVisible();

  await page.goto('/aujourdhui?fiche=3&section=4&scene=3');
  await expect(page.getByText('Lis Galates 4:5-7 lentement', { exact: false })).toBeVisible();
  // Consigne d'une note suivante : elle attend son tour dans la pile.
  expect(
    await chercherDansLaPile(page, page.getByText('Lis maintenant Romains 8:14-16', { exact: false }))
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=3&section=5&scene=3');
  await expect(page.getByText('Lis Actes 2:37-38 lentement', { exact: false })).toBeVisible();
  await deposerLesNotes(page, [
    'Un signe visible qui exprime une réalité reçue de Dieu.',
    'Cela m’invite à regarder honnêtement ma réponse à la Parole.',
    'Ma question et mon désir de lui répondre librement.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(page.getByText('Un signe visible qui exprime une réalité reçue de Dieu.')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /^Rm 6:3-4/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Y a-t-il une réponse concrète que cette Parole t’appelle à donner ?')).toBeVisible();
  await page.getByPlaceholder('Ce que cette Parole fait naître en moi…').fill(
    'Prendre le temps de discerner ma réponse devant Dieu.'
  );
  await page.getByPlaceholder('La réponse que je souhaite donner…').fill(
    'En parler avec la personne qui m’accompagne.'
  );

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde le chemin parcouru.' })).toBeVisible();
  await expect(page.getByText('Foi', { exact: true })).toBeVisible();
  await expect(page.getByText('Grâce reçue par la foi', { exact: true })).toBeVisible();
  await expect(page.getByText('Nouvelle naissance', { exact: true })).toBeVisible();
  await expect(page.getByText('Nouvelle création', { exact: true })).toBeVisible();
  await expect(page.getByText('Adoption', { exact: true })).toBeVisible();
  await expect(page.getByText('Baptême', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'He 11:1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rm 6:3-4' })).toBeVisible();
});

test('fiche 4 : la Parole et l’interprétation du livret restent distinctes dans six traversées', async ({ page }) => {
  await page.addInitScript(
    ({ uid, groupeId }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(groupes.map((groupe: { id: string }) =>
          groupe.id === groupeId ? { ...groupe, currentStep: 4 } : groupe
        ))
      );
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          4: {
            completed: false,
            answers: {
              'verset-choisi:f4-s1': 'Ep 2:8',
              'verset-choisi:f4-s2': 'Rm 8:1',
              'verset-choisi:f4-s3': 'Jn 15:7',
              'verset-choisi:f4-s4': 'He 13:21',
              'verset-choisi:f4-s5': '2 Co 12:9',
            },
            lastUpdated: Date.now(),
          },
        })
      );
    },
    { uid: UTILISATEUR.uid, groupeId: GROUPE.id }
  );

  await page.goto('/dashboard');
  await expect(page.getByText('0 / 6 étapes')).toBeVisible();
  await expect(page.getByText('Qu’est-ce que la grâce ?', { exact: true })).toBeVisible();
  await expect(page.getByText('Pourquoi est-il difficile de vivre dans la grâce ?', { exact: true })).toBeVisible();
  await expect(page.getByText('Comment Dieu me fait-il croître dans la grâce ?', { exact: true })).toBeVisible();
  await expect(page.getByText('Ma part : l’obéissance', { exact: true })).toBeVisible();
  await expect(page.getByText('Dans la faiblesse et l’épreuve', { exact: true })).toBeVisible();
  await expect(page.getByText('Le repos', { exact: true })).toBeVisible();

  await page.goto('/aujourdhui?fiche=4&section=3&scene=3');
  expect(
    await chercherDansLaPile(page, page.getByText('📖 La Parole', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('📘 Le livret · interprétation proposée', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(
      page,
      page.getByText('Il s’agit ici d’une interprétation proposée par le livret', { exact: false })
    )
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=4&section=4&scene=3');
  await expect(page.getByText('Lis lentement 2 Corinthiens 12:9', { exact: false })).toBeVisible();
  await expect(page.locator('textarea').first()).toBeVisible();

  await page.goto('/aujourdhui?fiche=4&section=5&scene=3');
  await expect(page.getByText('Lis lentement Hébreux 4:10-11', { exact: false })).toBeVisible();
  expect(
    await chercherDansLaPile(page, page.getByText('sans la transformer en promesse générale', { exact: false }))
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=4&section=5&scene=3');
  await deposerLesNotes(page, [
    'Le repos me semble être une confiance qui demeure active.',
    'Dieu précède et prépare ce qu’il donne à vivre.',
    'Éphésiens 2:10 reste devant moi.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(page.getByText('Le repos me semble être une confiance qui demeure active.')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Parole suivante' }).click();
  await page.getByRole('button', { name: /^Ep 2:10/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByPlaceholder('Je veux revenir à cette Parole lorsque…').fill(
    'Je recommence à vouloir tout produire seul.'
  );
  await page.getByPlaceholder('À partir de cette Parole, je voudrais…').fill(
    'Revenir à ce que Dieu a déjà préparé.'
  );

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde le chemin parcouru.' })).toBeVisible();
  await expect(page.getByText('La grâce comme don', { exact: true })).toBeVisible();
  await expect(page.getByText('Approbation et performance', { exact: true })).toBeVisible();
  await expect(page.getByText('Croître dans la grâce', { exact: true })).toBeVisible();
  await expect(page.getByText('Obéissance', { exact: true })).toBeVisible();
  await expect(page.getByText('Faiblesse', { exact: true })).toBeVisible();
  await expect(page.getByText('Repos', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ep 2:8' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ep 2:10' })).toBeVisible();
});

test('fiche 5 : quatre traversées bibliques conduisent à une identité reçue en Christ', async ({ page }) => {
  await page.addInitScript(
    ({ uid, groupeId }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(groupes.map((groupe: { id: string }) =>
          groupe.id === groupeId ? { ...groupe, currentStep: 5 } : groupe
        ))
      );
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          5: {
            completed: false,
            answers: {
              'verset-choisi:f5-s1': 'Rm 6:3-4',
              'verset-choisi:f5-s2': 'Ep 1:3',
              'verset-choisi:f5-s3': '2 Co 5:21',
            },
            lastUpdated: Date.now(),
          },
        })
      );
    },
    { uid: UTILISATEUR.uid, groupeId: GROUPE.id }
  );

  await page.goto('/dashboard');
  await expect(page.getByText('0 / 4 étapes')).toBeVisible();
  await expect(page.getByText('Morts et ressuscités avec Jésus-Christ', { exact: true })).toBeVisible();
  await expect(page.getByText('Assis avec le Christ dans les lieux célestes', { exact: true })).toBeVisible();
  await expect(page.getByText("L'échange divin", { exact: true })).toBeVisible();
  await expect(page.getByText('Notre réelle identité', { exact: true })).toBeVisible();

  await page.goto('/aujourdhui?fiche=5&section=2&scene=3');
  await expect(page.getByText('Lis lentement Ésaïe 53:4-6', { exact: false })).toBeVisible();
  expect(
    await chercherDansLaPile(page, page.getByText('📖 La Parole', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('📘 Le livret · interprétation proposée', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(
      page,
      page.getByText('Garde distincts ce que les passages affirment directement', { exact: false })
    )
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=5&section=3&scene=3');
  expect(
    await chercherDansLaPile(page, page.getByText('Explore maintenant ces huit cartes', { exact: false }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('sans fabriquer une déclaration positive', { exact: false }))
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=5&section=3&scene=3');
  await deposerLesNotes(page, [
    'Je reçois mon identité de ce que Dieu a accompli et affirme en Christ.',
    'Jean 1:12 me rappelle que je suis enfant de Dieu.',
    'Je n’ai pas à construire ma valeur sur le regard des autres.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(
    page.getByText('Je reçois mon identité de ce que Dieu a accompli et affirme en Christ.')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que je garde', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Jn 1:12/ })).toBeVisible();
  await page.getByRole('button', { name: /^Jn 1:12/ }).click();
  await expect(page.getByRole('button', { name: /^Jn 1:12/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Parole précédente' }).click();
  await expect(page.getByRole('button', { name: /^1 Co 6:19/ })).toBeVisible();
  await page.getByRole('button', { name: 'Parole suivante' }).click();
  await page.getByRole('button', { name: /^Jn 1:12/ }).click();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que tu gardes · Jn 1:12')).toBeVisible();
  await page.getByPlaceholder('Je risque d’oublier cette Parole lorsque…').fill(
    'Je laisse une critique définir ma valeur.'
  );
  await page.getByPlaceholder('Je voudrais revenir à cette Parole en…').fill(
    'Relisant ce que Dieu affirme avant de répondre.'
  );

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde le chemin parcouru.' })).toBeVisible();
  await expect(page.getByText('Vie nouvelle avec Christ', { exact: true })).toBeVisible();
  await expect(page.getByText('Position en Christ', { exact: true })).toBeVisible();
  await expect(page.getByText('La croix', { exact: true })).toBeVisible();
  await expect(page.getByText('Identité reçue', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rm 6:3-4' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jn 1:12' })).toBeVisible();
});

test('fiche 6 : la Parole éclaire une situation réelle puis conduit à un pas de transformation', async ({ page }) => {
  await page.addInitScript(
    ({ uid, groupeId }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(groupes.map((groupe: { id: string }) =>
          groupe.id === groupeId ? { ...groupe, currentStep: 6 } : groupe
        ))
      );
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          6: {
            completed: false,
            answers: {
              'verset-choisi:f6-s1': 'Ga 5:24',
              'verset-choisi:f6-s2': 'Jn 15:5',
              'verset-choisi:f6-s3': 'Rm 12:2',
            },
            lastUpdated: Date.now(),
          },
        })
      );
    },
    { uid: UTILISATEUR.uid, groupeId: GROUPE.id }
  );

  await page.goto('/dashboard');
  await expect(page.getByText('0 / 4 étapes')).toBeVisible();
  await expect(page.getByText('Se dépouiller et se revêtir', { exact: true })).toBeVisible();
  await expect(page.getByText('Marcher par la chair ou par l’Esprit ?', { exact: true })).toBeVisible();
  await expect(page.getByText('Renouveler ma manière de penser', { exact: true })).toBeVisible();
  await expect(page.getByText('Apprendre à marcher par l’Esprit', { exact: true })).toBeVisible();

  await page.goto('/aujourdhui?fiche=6&section=0&scene=3');
  await expect(page.getByText('Lis lentement Éphésiens 4:20-24', { exact: false })).toBeVisible();
  expect(
    await chercherDansLaPile(page, page.getByText('🪞 Ma vie aujourd’hui', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('Ne choisis qu’une seule chose', { exact: false }))
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=6&section=3&scene=3');
  await expect(page.getByText('Lis lentement Galates 2:20', { exact: false })).toBeVisible();
  expect(
    await chercherDansLaPile(page, page.getByText('à la fois de son effort et de la puissance', { exact: false }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('📘 Le livret · interprétation proposée', { exact: true }))
  ).toBe(true);
  expect(
    await chercherDansLaPile(page, page.getByText('Ce sont ses formulations interprétatives', { exact: false }))
  ).toBe(true);

  await page.goto('/aujourdhui?fiche=6&section=3&scene=3');
  // La mise en pratique de cette section rappelle la sixième note : il faut
  // donc aller jusque-là. C'est elle qui portera « la difficulté identifiée ».
  await deposerLesNotes(page, [
    'Je sais que Dieu agit, et je continue de tout porter seul.',
    'Le texte distingue ce qui vient de lui et ce qui vient de moi.',
    'Je confonds souvent effort et dépendance.',
    'Je m’épuise avant de demander.',
    'Je voudrais apprendre à compter sur lui d’abord.',
    'Rester disponible et doux lorsque je reçois une critique inattendue.',
  ]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  // La prière reprend les notes dans l'ordre : la première est devant.
  await expect(page.getByText('Je sais que Dieu agit, et je continue de tout porter seul.')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Parole précédente' }).click();
  await page.getByRole('button', { name: /^Ga 5:16/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByText('La difficulté que tu as identifiée')).toBeVisible();
  await expect(page.getByText('Rester disponible et doux lorsque je reçois une critique inattendue.')).toBeVisible();
  await expect(
    page.getByText('Rester disponible et doux lorsque je reçois une critique inattendue.').locator('xpath=ancestor::aside')
  ).toHaveClass(/post-it-jaune/);
  await page.getByPlaceholder('La prochaine fois, je voudrais…').fill(
    'M’arrêter avant de répondre et demander à Dieu de m’aider à écouter.'
  );

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde le chemin parcouru.' })).toBeVisible();
  await expect(page.getByText('Une ancienne manière de vivre', { exact: true })).toBeVisible();
  await expect(page.getByText('Chair et Esprit', { exact: true })).toBeVisible();
  await expect(page.getByText('Une pensée à renouveler', { exact: true })).toBeVisible();
  await expect(page.getByText('Dépendre de l’action de Dieu', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ga 5:24' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ga 5:16' })).toBeVisible();
});

/**
 * Les dix outils s'affichaient deux fois : en cartes sur le tableau de bord,
 * et à l'identique sous « Plus » dans la barre du bas. Le même menu à deux
 * endroits, sans rien pour les distinguer. La navigation tient maintenant en
 * un seul endroit, et le tableau de bord garde ce qui parle d'aujourd'hui.
 */
test('mobile : le menu Plus donne accès à tout, et à un seul endroit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Les instruments de ta table' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Plus' }).click();
  const menu = page.getByRole('dialog', { name: 'Tous les outils' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link', { name: /Mémorisation/ })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Journal' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Retrouver mes écrits' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Guide pastoral' })).toBeVisible();

  await menu.getByRole('link', { name: 'Retrouver mes écrits' }).click();
  await expect(page).toHaveURL(/\/recherche$/);
});

test('tableau de bord : une étape vécue peut être revue sans perdre ses réponses', async ({ page }) => {
  await page.addInitScript((uid) => {
    localStorage.setItem(
      `lesfondements_prog_${uid}`,
      JSON.stringify({
        1: {
          completed: false,
          answers: {
            'temps-apart:0': '1',
            'q:f1-s1-q1': 'Une découverte déjà écrite.',
          },
          lastUpdated: Date.now(),
        },
      })
    );
  }, UTILISATEUR.uid);
  await page.goto('/dashboard');

  const revoir = page.getByRole('link', { name: 'Revoir l’étape 1 : Dieu règne' });
  await expect(revoir).toBeVisible();
  await revoir.click();
  await expect(page).toHaveURL(/\/aujourdhui\?fiche=1&section=0$/);
  await expect(page.getByRole('heading', { name: 'Connaître Dieu' })).toBeVisible();

  await expect(
    page.evaluate((uid) => {
      const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
      return donnees['1']?.answers?.['q:f1-s1-q1'];
    }, UTILISATEUR.uid)
  ).resolves.toBe('Une découverte déjà écrite.');
});

test('absence : le choix reste associé au membre', async ({ page }) => {
  await page.goto('/groupes');
  await page.getByRole('button', { name: /Je ne peux pas/i }).click();

  await expect
    .poll(() =>
      page.evaluate(
        ({ groupId, uid }) => {
          const membres = JSON.parse(localStorage.getItem(`lf.members.${groupId}`) || '[]');
          return membres.find((membre: { uid: string }) => membre.uid === uid)?.nextAttendance;
        },
        { groupId: GROUPE.id, uid: UTILISATEUR.uid }
      )
    )
    .toBe('absent');
});

test('rencontre : l’animateur ouvre une séance à deux membres', async ({ page }) => {
  await page.goto('/groupes/rencontre');
  await page.getByRole('button', { name: 'Ouvrir la rencontre' }).click();
  await expect(page.getByText('Rencontre en cours')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (groupId) => JSON.parse(localStorage.getItem(`lf.sessions.${groupId}`) || '[]')[0]?.status,
        GROUPE.id
      )
    )
    .toBe('ouverte');
});

test('mémorisation : une évaluation programme la prochaine révision', async ({ page }) => {
  await page.goto('/memorisation');
  await page.getByRole('button', { name: 'Toutes les fiches' }).click();
  await page.getByRole('button', { name: /Retourner la carte/ }).click();
  await page.getByRole('button', { name: 'Bien' }).click();

  await expect
    .poll(() =>
      page.evaluate((uid) => {
        const entrees = Object.values(JSON.parse(localStorage.getItem(`lf.memoire.${uid}`) || '{}')) as Array<{
          attempts?: number;
          dueAt?: number;
        }>;
        return entrees.some((entree) => (entree.attempts ?? 0) > 0 && (entree.dueAt ?? 0) > Date.now());
      }, UTILISATEUR.uid)
    )
    .toBe(true);
});

test('hors-ligne : la fiche déjà ouverte reste lisible et modifiable', async ({ page, context }) => {
  await page.goto('/fiches/1');
  await page.getByRole('button', { name: 'Résumé et partage' }).click();
  await context.setOffline(true);
  const reponse = page.getByPlaceholder("Cette semaine, je m'engage à…");
  await reponse.fill('Réponse écrite sans réseau.');
  await page.waitForTimeout(1_000);

  const sauvegardee = await page.evaluate((uid) => {
    const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
    return donnees['1']?.answers?.['pas:1'];
  }, UTILISATEUR.uid);
  expect(sauvegardee).toBe('Réponse écrite sans réseau.');
  // Rétablir le réseau permet à Playwright de terminer proprement la trace
  // et distingue le comportement testé de la phase de nettoyage.
  await context.setOffline(false);
});
