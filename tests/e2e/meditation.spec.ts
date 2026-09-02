import { expect, test } from '@playwright/test';
import { UTILISATEUR, semerSession } from './fixtures';

test('méditation : deux questions essentielles, les autres librement', async ({ page }) => {
  await semerSession(page);
  await page.goto('/aujourdhui?fiche=1&section=2&moment=meditation');

  await expect(page.getByText('1 / 2')).toBeVisible();
  const premiere = page.getByLabel(
    'Qu’est-ce qui retient ton attention dans ce que Jésus affirme ici sur Dieu ?'
  );
  await premiere.fill('Je découvre un Dieu qui se fait connaître.');

  await page.getByRole('button', { name: 'Suivante' }).click();
  const seconde = page.getByLabel(
    'Y a-t-il quelque chose dans ta compréhension de Dieu qui est devenu plus clair ou qui t’interroge encore ?'
  );
  await seconde.fill('Je veux continuer à contempler son unité.');

  await expect(page.getByRole('button', { name: /Approfondir librement · 7 pistes/ })).toBeVisible();
  await page.getByRole('button', { name: /Approfondir librement · 7 pistes/ }).click();
  await expect(page.getByText('Approfondir librement', { exact: true })).toBeVisible();
  await expect(page.getByText('1 / 7')).toBeVisible();
  await expect(
    page.getByLabel('Qu’est-ce qui retient ton attention lorsque tu gardes ces passages ensemble ?')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Revenir aux deux questions essentielles' }).click();
  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(seconde).toHaveValue('Je veux continuer à contempler son unité.');

  await expect
    .poll(() =>
      page.evaluate(
        ({ uid }) => {
          const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
          return JSON.stringify(donnees['1']?.answers ?? {});
        },
        { uid: UTILISATEUR.uid }
      )
    )
    .toContain('contempler son unité');
});

test('prière : elle reprend uniquement les mots réellement déposés', async ({ page }) => {
  await semerSession(page);
  await page.goto('/aujourdhui?fiche=1&section=2&moment=meditation');

  await page.locator('textarea').first().fill('Dieu est un.');
  await page.getByRole('button', { name: 'Suivante' }).click();
  await page.locator('textarea').first().fill('Il se donne à connaître.');
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(page.getByText('Dieu est un.')).toBeVisible();
  await expect(page.locator('article.fiche-bristol')).toBeVisible();

  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(page.getByText('Il se donne à connaître.')).toBeVisible();
  await expect(page.getByText('Reprends tes propres mots.', { exact: false })).toBeVisible();
});
