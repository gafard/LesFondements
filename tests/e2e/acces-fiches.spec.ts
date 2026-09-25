import { test, expect } from '@playwright/test';
import { semerSession } from './fixtures';

// Toutes les fiches se consultent librement : on encourage la progression,
// on ne l'impose plus.
for (const personnel of [true, false]) {
  for (const immersion of [false, true]) {
    test(`${personnel ? 'personnel' : 'cellule'} : ${immersion ? 'immersion' : 'fiche'} 2 ouverte sans avoir terminé la fiche 1`, async ({ page }) => {
      await semerSession(page, { avecGroupe: !personnel, personnel });
      await page.goto(immersion ? '/aujourdhui?fiche=2&moment=bloc' : '/fiches/2');
      await expect(immersion ? page.getByRole('button', { name: 'Quitter l’immersion' }) : page.getByRole('heading', { name: /Le péché, le salut/ }).first()).toBeVisible();
    });
  }
}

test('visiteur : une fiche au-delà de la première se lit sans compte', async ({ page }) => {
  await page.goto('/fiches/5');
  await expect(page.getByRole('heading', { name: /Mon identité en Christ/ }).first()).toBeVisible();
});
