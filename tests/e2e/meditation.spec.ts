import { expect, test } from '@playwright/test';
import { UTILISATEUR, semerSession } from './fixtures';

/**
 * La méditation présentait ses questions en une seule colonne : jusqu'à dix
 * notes ouvertes en même temps, un long défilement, et l'impression qu'il
 * faut tout remplir d'un coup.
 *
 * Elles sont désormais empilées : une note devant, les suivantes entrevues
 * derrière. Ce contrôle vérifie ce qui compte — une seule note se remplit à
 * la fois, on passe à la suivante, et ce qui a été écrit tient.
 */
test('méditation : une note devant, les autres derrière', async ({ page }) => {
  await semerSession(page);
  await page.goto('/aujourdhui?fiche=1&section=2&scene=17');

  await expect(page.getByText('1 / 9')).toBeVisible();

  const premiere = page.getByLabel('Qu’est-ce qui retient ton attention dans ce que Jésus affirme ici sur Dieu ?');
  await expect(premiere).toBeVisible();
  await premiere.fill('Je découvre un Père qui m’accueille.');

  // Les notes suivantes attendent leur tour : elles ne sont pas remplissables.
  await expect(
    page.getByLabel('Qu’est-ce qui retient ton attention lorsque tu gardes ces passages ensemble ?')
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(page.getByText('2 / 9')).toBeVisible();
  await expect(
    page.getByLabel('Qu’est-ce qui retient ton attention lorsque tu gardes ces passages ensemble ?')
  ).toBeVisible();

  // Revenir en arrière retrouve ce qu'on avait écrit.
  await page.getByRole('button', { name: 'Précédente' }).click();
  await expect(premiere).toHaveValue('Je découvre un Père qui m’accueille.');

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
    .toContain('accueille');
});

/**
 * La prière reprenait les découvertes dans une carte de verre sombre, avec
 * des onglets « Découverte 1, 2, 3 ». Ni le verre ni les onglets n'étaient de
 * cette table : elle se prie maintenant sur des fiches posées en pile, comme
 * on a médité sur des notes.
 */
test('prière : les découvertes reprises en pile, sur du papier', async ({ page }) => {
  await semerSession(page);
  await page.goto('/aujourdhui?fiche=1&section=2&scene=17');

  for (const texte of ['Dieu est un.', 'Il se donne à connaître.', 'Le Père, le Fils, l’Esprit.']) {
    await page.locator('textarea').first().fill(texte);
    await page.getByRole('button', { name: 'Suivante' }).click();
  }

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Parle à Dieu à partir de tes découvertes')).toBeVisible();

  // Une découverte devant, les deux autres derrière.
  await expect(page.getByText('1 / 3')).toBeVisible();
  await expect(page.getByText('Dieu est un.')).toBeVisible();
  await expect(page.getByText('Il se donne à connaître.')).toHaveCount(0);

  // Le papier, pas le verre.
  await expect(page.locator('article.fiche-bristol')).toBeVisible();

  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(page.getByText('2 / 3')).toBeVisible();
  await expect(page.getByText('Il se donne à connaître.')).toBeVisible();
});
