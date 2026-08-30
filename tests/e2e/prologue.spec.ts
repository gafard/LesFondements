import { expect, test } from '@playwright/test';
import { semerSession } from './fixtures';

/**
 * Le prologue se regardait à peine.
 *
 * `creerLeGroupe` rafraîchissait le parcours avant de poser l'étape
 * suivante. Le temps d'un rendu, le parcours était « ouvert » et l'étape
 * valait encore « creer » — que la redirection vers le tableau de bord ne
 * protège pas. La navigation était donc demandée pendant l'écran
 * d'invitation, et tombait quelques centaines de millisecondes plus tard,
 * en plein prologue : la vidéo démarrait puis disparaissait.
 *
 * Ce contrôle regarde ce que l'œil voyait : la vidéo tourne, et on est
 * toujours sur l'accueil.
 */
test('prologue : la vidéo tient l’écran après la création du groupe', async ({ page }) => {
  await semerSession(page, { avecGroupe: false });
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('button', { name: /Créer mon groupe/i }).click();
  await page.getByLabel('Nom du groupe').fill('Cellule Prologue');
  await page.getByRole('button', { name: /Créer le groupe et ouvrir le parcours/i }).click();
  await expect(page.getByText(/inviter|code/i).first()).toBeVisible();

  await page.getByRole('button', { name: /Entrer dans le parcours/i }).click({ force: true });
  await expect(page.getByText(/Votre voyage/i)).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => document.querySelector('video')?.paused ?? true), { timeout: 5000 })
    .toBe(false);

  // Deux secondes plus tard, on n'a pas été emmené ailleurs.
  await page.waitForTimeout(2000);
  expect(new URL(page.url()).pathname).toBe('/onboarding');
  expect(await page.evaluate(() => document.querySelector('video')?.currentTime ?? 0)).toBeGreaterThan(0.3);
});
