import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { semerSession } from './fixtures';

for (const route of ['/', '/login']) {
  test(`accessibilité publique : ${route}`, async ({ page }) => {
    await page.goto(route);
    const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(resultat.violations).toEqual([]);
  });
}

for (const route of ['/dashboard', '/aujourdhui', '/fiches/1', '/groupes', '/memorisation']) {
  test(`accessibilité applicative : ${route}`, async ({ page }) => {
    await semerSession(page);
    await page.goto(route);
    await expect(page.getByRole('heading').first()).toBeVisible();
    const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(resultat.violations).toEqual([]);
  });
}

test('accessibilité applicative : menu des outils mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await semerSession(page);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Plus' }).click();
  await expect(page.getByRole('dialog', { name: 'Tous les outils' })).toBeVisible();
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(resultat.violations).toEqual([]);
});

test('accessibilité applicative : méditation, prière et mémorisation de Dieu est un', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await semerSession(page);
  await page.goto('/aujourdhui?fiche=1&section=2&scene=17');
  await expect(page.getByText('Lis lentement Marc 12:29', { exact: false })).toBeVisible();

  let resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(resultat.violations).toEqual([]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de ce que tu as découvert' })).toBeVisible();
  resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(resultat.violations).toEqual([]);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Mémorisation progressive')).toBeVisible();
  resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(resultat.violations).toEqual([]);
});
