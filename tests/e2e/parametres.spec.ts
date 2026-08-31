import { expect, test } from '@playwright/test';
import { GROUPE, UTILISATEUR, semerSession } from './fixtures';

/**
 * Le nom n'était modifiable nulle part.
 *
 * À l'inscription par e-mail il est déduit de l'adresse — la partie avant
 * l'arobase — et c'est ce nom-là que la cellule voit dans sa liste de
 * membres. Ce contrôle vérifie qu'on peut le corriger, et surtout que la
 * correction descend jusqu'à la ligne d'adhésion : se renommer pour soi seul
 * ne servirait à rien.
 */
test('réglages : corriger son nom le change aussi pour le groupe', async ({ page }) => {
  await semerSession(page, { avecGroupe: true });
  await page.goto('/parametres');

  const champ = page.getByLabel('Nom affiché');
  await expect(champ).toHaveValue(UTILISATEUR.displayName);

  await champ.fill('Alice de Lomé');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('button', { name: /Enregistré/ })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        ({ groupeId, uid }) => {
          const membres = JSON.parse(localStorage.getItem(`lf.members.${groupeId}`) || '[]');
          return membres.find((m: { uid: string }) => m.uid === uid)?.displayName;
        },
        { groupeId: GROUPE.id, uid: UTILISATEUR.uid }
      )
    )
    .toBe('Alice de Lomé');
});

test('réglages : les trois domaines tiennent sur la même page', async ({ page }) => {
  await semerSession(page);
  await page.goto('/parametres');

  await expect(page.getByRole('heading', { name: 'Mon nom' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mes rappels' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mesure d’usage anonyme' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supprimer mon compte' })).toBeVisible();
});

test('réglages : l’ancienne adresse de confidentialité mène toujours quelque part', async ({ page }) => {
  await semerSession(page);
  await page.goto('/parametres/confidentialite');
  await expect(page.getByRole('heading', { name: 'Mes réglages' })).toBeVisible();
});
