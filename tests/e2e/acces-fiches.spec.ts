import { test, expect } from '@playwright/test';
import { semerSession } from './fixtures';

for (const personnel of [true, false]) {
  for (const immersion of [false, true]) {
    test(`${personnel ? 'personnel' : 'cellule'} : lien direct ${immersion ? 'immersion' : 'fiche'} 2 verrouillé sans fiche 1`, async ({ page }) => {
      await semerSession(page, { avecGroupe: !personnel, personnel });
      await page.goto(immersion ? '/aujourdhui?fiche=2' : '/fiches/2');
      await expect(immersion ? page.getByText('Terminez la fiche précédente pour poursuivre.', { exact: false }) : page.getByRole('heading', { name: 'La fiche 2 n’est pas encore ouverte' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Quitter l’immersion' })).toHaveCount(0);
    });
    test(`${personnel ? 'personnel' : 'cellule'} : ${immersion ? 'immersion' : 'fiche'} 2 ouverte après les prérequis`, async ({ page }) => {
      await semerSession(page, { avecGroupe: !personnel, personnel, etape: 2, fichesTerminees: [1] });
      await page.goto(immersion ? '/aujourdhui?fiche=2&moment=bloc' : '/fiches/2');
      await expect(immersion ? page.getByRole('button', { name: 'Quitter l’immersion' }) : page.getByRole('heading', { name: /Le péché, le salut/ }).first()).toBeVisible();
    });
  }
}
