import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { semerSession, UTILISATEUR } from './fixtures';

test('accueil : fiche complète dominante, prologue unique et fermeture au clavier', async ({ page }, info) => {
  await semerSession(page);
  await page.goto('/dashboard');
  const prochain = page.getByRole('region', { name: 'Connaître Dieu' });
  await expect(prochain.getByRole('link', { name: 'Consulter la fiche complète' })).toHaveAttribute('href', '/fiches/1');
  expect((await prochain.boundingBox())!.y).toBeLessThan(300);
  await expect(page.getByRole('button', { name: 'Découvrir le parcours · 50 s' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cellule E2E' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('accueil.png'), fullPage: true });
  const analyse = await new AxeBuilder({ page }).include('#contenu-principal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(analyse.violations).toEqual([]);
  await page.getByRole('button', { name: 'Découvrir le parcours · 50 s' }).click();
  await expect(page.getByRole('dialog', { name: 'Découvrir le parcours' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Découvrir le parcours' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Découvrir le parcours · 50 s' })).toBeFocused();
});

test('accueil : les doublons ont quitté le tableau de bord', async ({ page }) => {
  await semerSession(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Les temps de cette fiche', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Avancer par un temps guidé' })).toHaveAttribute('href', '/aujourdhui?fiche=1');
});

test('cellule : préparation terminée, la fiche reste à relire et la cellule à portée', async ({ page }) => {
  await semerSession(page, { fichesTerminees: [1] });
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Relire la fiche complète' })).toHaveAttribute('href', '/fiches/1');
  await expect(page.getByRole('link', { name: 'Voir ma cellule et préparer le partage' })).toHaveAttribute('href', '/groupes');
});

test('coque : la page d’accueil reste accessible depuis l’application', async ({ page }) => {
  await semerSession(page);
  await page.goto('/dashboard');
  const accueil = page.locator('a[href="/"]').filter({ hasText: 'Page d’accueil' });
  await expect(accueil.first()).toBeAttached();
});

test('parcours : vingt fiches ouvertes, sans chapitres, index thématique relié', async ({ page }, info) => {
  await semerSession(page);
  await page.goto('/fiches');
  await expect(page.locator('details')).toHaveCount(0);
  await expect(page.locator('ol a[href="/fiches/20"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Étudier la fiche 1' })).toHaveAttribute('href', '/fiches/1');
  await page.screenshot({ path: info.outputPath('parcours.png'), fullPage: true });
  const analyse = await new AxeBuilder({ page }).include('#contenu-principal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(analyse.violations).toEqual([]);
  const loi = page.getByRole('listitem').filter({ hasText: 'Loi (Torah)' });
  await expect(loi.getByRole('link', { name: 'Fiche 2' })).toHaveAttribute('href', '/fiches/2');
  await expect(loi.getByRole('link', { name: 'Fiche 18' })).toHaveAttribute('href', '/fiches/18');
  await page.getByRole('textbox', { name: 'Retrouver une fiche ou un thème' }).fill('introuvablexyz');
  await expect(page.getByRole('status').filter({ hasText: 'Aucun titre' })).toContainText('Aucun titre');
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
