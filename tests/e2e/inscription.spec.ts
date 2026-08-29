import { expect, test } from '@playwright/test';

test('inscription : crée une session locale et ouvre le parcours', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Créer un compte' }).click();
  await page.getByLabel('Prénom').fill('Awa');
  await page.getByLabel('Adresse e-mail').fill('awa.e2e@example.test');
  await page.getByLabel('Mot de passe').fill('mot-de-passe-e2e');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page).toHaveURL(/\/dashboard|\/onboarding/);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lesfondements_local_user') || 'null')?.displayName))
    .toBe('Awa');
});
