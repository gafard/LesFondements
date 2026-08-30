import { expect, test } from '@playwright/test';

// L'assertion acceptait `/dashboard` ou `/onboarding`, si bien qu'elle est
// restée verte quand les comptes neufs ont cessé de passer par l'accueil.
// Un compte sans groupe n'a rien à faire sur le tableau de bord : le test le
// dit maintenant.
test('inscription : un compte neuf arrive sur l’accueil', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Créer un compte' }).click();
  await page.getByLabel('Prénom').fill('Awa');
  await page.getByLabel('Adresse e-mail').fill('awa.e2e@example.test');
  await page.getByLabel('Mot de passe').fill('mot-de-passe-e2e');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lesfondements_local_user') || 'null')?.displayName))
    .toBe('Awa');
});
