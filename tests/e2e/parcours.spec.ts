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
  await expect(page.getByText('Mémoriser la Parole', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Vivre cette vérité', { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder('Aujourd’hui, je veux…').fill(
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
          pas: donnees['1']?.answers?.['pas:f1-s1'],
        };
      }, UTILISATEUR.uid)
    )
    .toEqual({ termine: '1', pas: 'Commencer ma journée par reconnaître que Dieu règne.' });
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
