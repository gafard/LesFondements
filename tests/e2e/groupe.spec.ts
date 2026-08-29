import { expect, test } from '@playwright/test';
import { semerSession } from './fixtures';

test('groupe : crée une cellule avec un calendrier IANA', async ({ page }) => {
  await semerSession(page, { avecGroupe: false });
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('button', { name: /Créer mon groupe/i }).click();
  await page.getByLabel('Nom du groupe').fill('Cellule Grâce E2E');
  await page.getByRole('button', { name: /Créer le groupe et ouvrir le parcours/i }).click();

  await expect(page.getByText(/inviter|code/i).first()).toBeVisible();
  const timezone = await page.evaluate(() => {
    const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
    return groupes.find((groupe: { name: string }) => groupe.name === 'Cellule Grâce E2E')?.meeting?.timezone;
  });
  expect(timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+/);
});
