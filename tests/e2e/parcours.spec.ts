import { expect, test } from '@playwright/test';
import { UTILISATEUR, semerSession } from './fixtures';

test.beforeEach(async ({ page }) => {
  await semerSession(page);
});

test('fiche 1 : Parole, réponse, prière, mémorisation et vie restent un seul chemin', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=1&section=0&moment=meditation');

  await expect(page.getByText('1 / 2')).toBeVisible();
  await page.locator('textarea').first().fill('Dieu règne même lorsque je ne maîtrise pas la situation.');
  await page.getByRole('button', { name: 'Suivante' }).click();
  await page.locator('textarea').first().fill('Je veux lui confier ce que je ne contrôle pas.');

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: 'Parle à Dieu à partir de tes découvertes' })).toBeVisible();
  await expect(page.getByText('Dieu règne même lorsque je ne maîtrise pas la situation.')).toBeVisible();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('La Parole que je garde', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Parole suivante' }).click();
  await page.getByRole('button', { name: /^Ps 46:11/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByText('Vivre cette Parole', { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder('Je veux me souvenir de ce verset lorsque…').fill(
    'Je commencerai à m’inquiéter avant ma réunion.'
  );
  await page.getByPlaceholder('Quand ce moment arrivera, je veux…').fill(
    'M’arrêter et revenir à cette Parole.'
  );
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'J’ai préparé' }).click();
  await expect(page.getByRole('heading', { name: 'La Parole est semée.' })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate((uid) => {
        const donnees = JSON.parse(localStorage.getItem(`lesfondements_prog_${uid}`) || '{}');
        return {
          termine: donnees['1']?.answers?.['temps-apart:0'],
          verset: donnees['1']?.answers?.['verset-choisi:f1-s1'],
        };
      }, UTILISATEUR.uid)
    )
    .toEqual({ termine: '1', verset: 'Ps 46:11' });
});

test('une fiche guidée montre toujours le texte original avant la facilitation', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=2&section=0&moment=bloc');
  await expect(page.getByText('Texte original du livret', { exact: true })).toBeVisible();
  await expect(page.getByText('Le péché', { exact: true }).first()).toBeVisible();

  await page.goto('/aujourdhui?fiche=2&section=0&moment=meditation');
  await expect(page.getByText('1 / 2')).toBeVisible();
  await expect(page.getByRole('button', { name: /Approfondir librement/ })).toBeVisible();
});

test('fiche 7 : les blessures ouvrent vers un accompagnement libre et sûr', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=7&section=3&moment=accompagnement');
  await expect(page.getByRole('heading', { name: 'Ce chemin peut être vécu accompagné' })).toBeVisible();
  await expect(page.getByText('Tu choisis librement ce que tu souhaites partager.')).toBeVisible();
  await expect(page.getByText('Tes notes restent privées', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir ma cellule' })).toBeVisible();
});

test('fiche 8 : aucun autodiagnostic spirituel n’est proposé seul', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=8&section=1&moment=accompagnement');
  await expect(page.getByRole('heading', { name: 'Ne reste pas seul pour poser un diagnostic' })).toBeVisible();
  await expect(page.getByText('elle ne peut ni identifier une cause spirituelle ni conclure à ta place', { exact: false })).toBeVisible();
  await expect(page.getByText('Aucune pression, aucune introspection forcée', { exact: false })).toBeVisible();

  await page.goto('/aujourdhui?fiche=8&section=1&moment=meditation');
  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(page.getByLabel('Que se passe-t-il concrètement avant, pendant et après cette situation ?')).toBeVisible();
  await expect(page.getByText('ouvrir cette porte ou créer ce lien', { exact: false })).toHaveCount(0);
});

test('fiche 9 : ce qui est perçu reste explicitement à discerner', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=9&section=3&moment=meditation');
  await page.getByRole('button', { name: 'Suivante' }).click();
  await expect(
    page.getByLabel(/Note ensuite ce que tu as perçu comme une pensée à discerner/)
  ).toBeVisible();
  await expect(page.getByText('jamais comme une parole de Dieu déjà certaine', { exact: false })).toBeVisible();
});

test('les anciennes fiches très directives utilisent une invitation ouverte', async ({ page }) => {
  await page.goto('/aujourdhui?fiche=17&section=0&moment=meditation');
  await expect(page.getByLabel('Qu’est-ce qui retient ton attention ?')).toBeVisible();
  await expect(page.getByText('pouvoir intrusif de la Bible', { exact: false })).toHaveCount(0);
  await expect(page.getByText('1 / 2')).toBeVisible();
});

test('tableau de bord : le carnet, la Parole et l’enveloppe de cellule sont visibles', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText(/Cahier d.*étude de la semaine/i)).toBeVisible();
  await expect(page.getByText('La Parole que je garde', { exact: true })).toBeVisible();
  await expect(page.getByText('L’enveloppe de ma cellule', { exact: true })).toBeVisible();
  await expect(page.getByText('Jeudi à 19:00 · Africa/Lome')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir ma cellule' })).toBeVisible();
});
