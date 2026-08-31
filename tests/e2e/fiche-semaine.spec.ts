import { expect, test } from '@playwright/test';
import { UTILISATEUR, semerSession } from './fixtures';

/**
 * On prépare sa fiche jour après jour, dans les temps à part. Puis, avant la
 * rencontre, on ouvre la fiche pour se relire — et elle était vide : les
 * réponses des temps vivent sous d'autres clés que celles de cette page et
 * n'y apparaissaient nulle part. Quatre jours de travail pour ne rien
 * retrouver.
 */
test('fiche : la semaine préparée se retrouve avant la rencontre', async ({ page }) => {
  await semerSession(page);
  await page.addInitScript(
    ({ uid }) => {
      localStorage.setItem(
        `lesfondements_prog_${uid}`,
        JSON.stringify({
          1: {
            completed: false,
            lastUpdated: Date.now(),
            answers: {
              'q:f1-s1-q1': 'Dieu se nomme lui-même, il ne se laisse pas définir.',
              'q:f1-s1-q4': 'Je veux le laisser régner sur mes journées.',
              'q:f1-s2-q1': 'Son amour ne dépend pas de ce que je produis.',
            },
          },
        })
      );
    },
    { uid: UTILISATEUR.uid }
  );

  await page.goto('/fiches/1');
  await page.getByRole('button', { name: 'Résumé et partage' }).click();

  await expect(page.getByRole('heading', { name: 'Ce que vous avez écrit cette semaine' })).toBeVisible();
  await expect(page.getByText('Dieu se nomme lui-même, il ne se laisse pas définir.')).toBeVisible();
  await expect(page.getByText('Son amour ne dépend pas de ce que je produis.')).toBeVisible();

  // Regroupées par jour, sous le titre du temps où elles ont été écrites.
  await expect(page.getByText('3 notes · 2 jours')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dieu règne' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rouvrir ce temps' }).first()).toBeVisible();

  // Les questions du livret disent à quoi elles servent.
  await expect(page.getByText('Ce dont vous parlerez à la rencontre').first()).toBeVisible();

  // Le compteur ne mélange plus les deux jeux : sept questions du livret,
  // aucune travaillée — les trois notes ne sont pas de celles-là.
  await expect(page.getByText('0 / 7 questions travaillée')).toBeVisible();
});

/**
 * L'immersion en plein écran de la fiche entière était une troisième porte
 * vers le même contenu, vers laquelle rien ne menait. Une adresse gardée en
 * favori retombe sur la fiche, sans rien perdre : ce sont les mêmes réponses.
 */
test('fiche : l’ancienne adresse d’immersion retombe sur la fiche', async ({ page }) => {
  await semerSession(page);
  await page.goto('/fiches/1?immersion=1');
  await expect(page.getByRole('button', { name: 'Résumé et partage' })).toBeVisible();
  await expect(page.locator('.immersion-bureau')).toHaveCount(0);
});
