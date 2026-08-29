import { expect, test } from '@playwright/test';
import { GROUPE, UTILISATEUR, semerSession } from './fixtures';

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
  await expect(page.getByText('Ils ne te disent pas ce que tu dois trouver.', { exact: false })).toBeVisible();
  await expect(page.getByText('Lis Apocalypse 1:8 lentement une première fois.', { exact: false })).toBeVisible();
  await expect(page.getByText('Qu’est-ce qui retient ton attention dans la manière dont Dieu parle de lui-même ?')).toBeVisible();

  await page.locator('textarea').first().fill('Dieu règne même lorsque je ne maîtrise pas la situation.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de ce que tu as découvert' })).toBeVisible();
  await page.getByPlaceholder('Ma prière aujourd’hui…').fill('Père, apprends-moi à te faire confiance.');

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que je garde', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choisir un verset' })).toBeDisabled();
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
  await expect(page.getByText('Lis Matthieu 28:19 puis 2 Corinthiens 13:13', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Qu’est-ce que ce passage te fait découvrir de Dieu ?')).toBeVisible();

  await page.getByLabel('Qu’est-ce que ce passage te fait découvrir de Dieu ?').fill(
    'Je découvre un Père qui m’accueille comme son enfant.'
  );
  await page.getByLabel('Qu’est-ce que cela te fait découvrir de Dieu en regardant Jésus ?').fill(
    'Dieu s’approche de notre faiblesse.'
  );
  await page.getByLabel('À la lumière de ces textes, qu’est-ce que tu comprends de cette affirmation ?').fill(
    'Le Saint-Esprit agit et demeure avec nous.'
  );
  await page.getByLabel(
    'Lorsque tu mets ensemble ce que tu viens de découvrir, qu’est-ce que tu comprends maintenant de Dieu ?'
  ).fill('Dieu est un et se fait connaître dans une communion vivante.');

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Tes découvertes, devant Dieu')).toBeVisible();
  await expect(page.getByText('Ce que j’ai découvert de Dieu comme Père')).toBeVisible();
  await expect(page.getByText('Je découvre un Père qui m’accueille comme son enfant.')).toBeVisible();
  await expect(page.getByText('Ce que l’ensemble m’a fait comprendre de Dieu')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Mémoriser la Parole', { exact: true })).toBeVisible();
  await expect(page.getByText('Mémorisation progressive')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verset 1' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Passage entier' }).click();
  await expect(page.getByText('Jn 1:1-3', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que tu gardes · Jn 1:1-3')).toBeVisible();
});

test('mobile : le menu Plus et la table donnent accès à tous les outils', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Les instruments de ta table' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Mes écrits/ })).toBeVisible();

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
