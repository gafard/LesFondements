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

test('temps à part : le texte du livret mène à un pas personnel privé', async ({ page }) => {
  await page.goto('/aujourdhui');
  await expect(page.getByRole('heading', { name: 'Ma semaine sur la table' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dieu règne' })).toBeVisible();
  await expect(page.getByText('Texte du livret', { exact: true })).toBeVisible();

  await page.getByPlaceholder('Aujourd’hui, je choisis de…').fill(
    'Commencer ma journée par reconnaître que Dieu règne.'
  );
  await page.getByRole('button', { name: 'Terminer ce moment' }).click();

  await expect(page.getByRole('heading', { name: 'Un amour relationnel et inconditionnel' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((uid) => {
        const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
        const brut = donnees['1']?.answers?.['rituel:v1'];
        if (!brut) return null;
        const rituel = JSON.parse(brut);
        return rituel.moments?.['resume-1']?.pas;
      }, UTILISATEUR.uid)
    )
    .toContain('Dieu règne');
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
