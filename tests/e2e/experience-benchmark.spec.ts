import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { semerSession } from './fixtures';

test('connexion : l’ancien tableau de bord ouvre le parcours', async ({ page }) => {
  await semerSession(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/fiches$/);
  await expect(page.getByRole('heading', { name: 'Le parcours des Fondements' })).toBeVisible();
});

test('coque : Accueil en tête du menu, plus d’onglet « Aujourd’hui »', async ({ page }) => {
  await semerSession(page);
  await page.goto('/fiches');
  const menu = page.locator('aside nav').first();
  await expect(menu.getByRole('link').first()).toHaveAttribute('href', '/');
  await expect(menu.getByRole('link').first()).toHaveText('Accueil');
  await expect(page.getByRole('link', { name: 'Aujourd’hui', exact: true })).toHaveCount(0);
  await expect(page.locator('aside a[href="/"]').filter({ hasText: 'Les Fondements' })).toHaveCount(1);
});

test('parcours : vingt fiches sans repère d’étape, bascule « Par thèmes » reliée à l’index', async ({ page }, info) => {
  await semerSession(page);
  await page.goto('/fiches');
  await expect(page.locator('details')).toHaveCount(0);
  await expect(page.locator('ol a[href="/fiches/20"]')).toHaveCount(1);
  await expect(page.getByText('En cours', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('parcours.png'), fullPage: true });
  const analyse = await new AxeBuilder({ page }).include('#contenu-principal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(analyse.violations).toEqual([]);
  await page.getByRole('button', { name: 'Par thèmes' }).click();
  const loi = page.getByRole('listitem').filter({ hasText: 'Loi (Torah)' });
  await expect(loi.getByRole('link', { name: 'Fiche 2' })).toHaveAttribute('href', '/fiches/2');
  await expect(loi.getByRole('link', { name: 'Fiche 18' })).toHaveAttribute('href', '/fiches/18');
  await expect(page.getByText('Dieu Père-Fils-Esprit', { exact: true })).toBeVisible();
  await expect(page.getByText(/Trinité/)).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Retrouver un thème' }).fill('introuvablexyz');
  await expect(page.getByRole('status').filter({ hasText: 'Aucun thème' })).toContainText('Aucun thème');
});

test('fiche : sans temps du jour, l’exposé mène au résumé et le Mémo Bible se retourne', async ({ page }) => {
  await semerSession(page);
  await page.goto('/fiches/1');
  await expect(page.getByRole('link', { name: 'Vivre mon temps du jour' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Résumé et questions de ce passage' }).first().click();
  await expect(page.locator('#resume-0')).toBeVisible();
  await page.getByRole('button', { name: 'Mémo Bible' }).click();
  await page.getByRole('button', { name: 'Retourner pour lire le verset' }).first().click();
  await expect(page.getByRole('button', { name: 'Retourner la carte' }).first()).toBeVisible();
});

test('immersion : commandes stables, sans débordement et retour au temps précédent', async ({ page }, info) => {
  await semerSession(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/aujourdhui?fiche=1&section=0');
  await expect(page.getByRole('button', { name: 'Entrer', exact: true })).toBeVisible();
  // Le bouton de diagnostic Next en développement recouvre le bouton précédent sur mobile.
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  // Régression : les commandes disparaissaient après quatre secondes d’inactivité.
  await page.waitForTimeout(4500);
  await expect(page.getByRole('button', { name: 'Quitter l’immersion' })).toHaveCSS('opacity', '1');
  await expect(page.locator('footer')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: info.outputPath('immersion.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Entrer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Précédent', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Précédent', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrer', exact: true })).toBeVisible();
});
