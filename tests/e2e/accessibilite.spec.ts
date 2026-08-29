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
