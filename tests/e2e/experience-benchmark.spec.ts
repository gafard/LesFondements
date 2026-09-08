import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { semerSession, UTILISATEUR } from './fixtures';

test('accueil : prochain temps dominant, prologue unique et fermeture au clavier', async ({ page }, info) => {
  await semerSession(page);
  await page.goto('/dashboard');
  const prochain = page.getByRole('region', { name: 'Dieu règne' });
  await expect(prochain.getByRole('link', { name: 'Commencer mon temps' })).toBeVisible();
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

test('accueil : un ancien marque-page vers une fiche future ne détourne pas la reprise', async ({ page }) => {
  await semerSession(page);
  await page.addInitScript(uid => localStorage.setItem(`lf.dernierPassage:${uid}`, JSON.stringify({ uid, url: '/aujourdhui?fiche=2&section=0&scene=3', titre: 'Fiche 2', date: Date.now() })), UTILISATEUR.uid);
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Commencer mon temps' })).toHaveAttribute('href', '/aujourdhui?fiche=1&section=0');
});

test('cellule : préparation terminée, prochaine action vers la rencontre et verrou explicite', async ({ page }) => {
  await semerSession(page, { fichesTerminees: [1] });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Prêt pour la rencontre.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Préparer la rencontre', exact: true })).toHaveAttribute('href', '/groupes');
  await page.goto('/aujourdhui?fiche=2');
  await expect(page.getByText('Ta préparation de la fiche 1 est terminée.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Préparer la rencontre' })).toHaveAttribute('href', '/groupes');
});

test('cellule avancée : le membre est renvoyé vers sa propre première fiche inachevée', async ({ page }) => {
  await semerSession(page, { etape: 3 });
  await page.goto('/fiches/2');
  await expect(page.getByRole('link', { name: 'Reprendre la fiche 1' })).toHaveAttribute('href', '/aujourdhui?fiche=1');
  await expect(page.getByText('La suite tient aussi compte', { exact: false })).toContainText('fiche 3');
});

test('parcours : chapitre courant ouvert, recherche dans les autres chapitres et verrous conservés', async ({ page }, info) => {
  await semerSession(page);
  await page.goto('/fiches');
  await expect(page.getByRole('heading', { name: 'Recevoir', exact: true })).toBeVisible();
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('a[href="/fiches/2"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('parcours.png'), fullPage: true });
  const analyse = await new AxeBuilder({ page }).include('#contenu-principal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(analyse.violations).toEqual([]);
  await page.getByRole('textbox', { name: 'Retrouver une fiche' }).fill('20');
  await expect(page.getByRole('heading', { name: 'Demeurer et espérer' })).toBeVisible();
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('a[href="/fiches/20"]')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Retrouver une fiche' }).fill('introuvablexyz');
  await expect(page.getByRole('status').filter({ hasText: 'Aucune fiche' })).toContainText('Aucune fiche');
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
