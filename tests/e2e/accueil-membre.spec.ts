import { expect, test } from '@playwright/test';
import { GROUPE, MEMBRES, UTILISATEUR, semerSession } from './fixtures';

/**
 * Accueillir quelqu'un ne marchait pas, et ne le disait pas.
 *
 * Les règles interdisaient de réécrire la date d'entrée ; l'application la
 * datait justement en accueillant. L'écriture était refusée, la copie locale
 * partait quand même, et le rechargement suivant ramenait la demande en
 * attente — « ça part, ça revient ». Aucun message.
 */
test('cellule : l’animateur accueille une demande, et elle tient', async ({ page }) => {
  await semerSession(page);
  await page.addInitScript(
    ({ groupeId, membres }) => {
      localStorage.setItem(
        `lf.members.${groupeId}`,
        JSON.stringify([
          ...membres,
          {
            uid: 'e2e-nouveau',
            groupId: groupeId,
            displayName: 'Kossi',
            email: 'kossi@example.test',
            role: 'membre',
            status: 'en_attente',
            joinedAt: 1_700_000_000_000,
            preparedSteps: [],
            personalStep: 1,
            requestMessage: 'Arrivé·e avec le code d’invitation.',
          },
        ])
      );
    },
    { groupeId: GROUPE.id, membres: MEMBRES }
  );

  await page.goto('/groupes');
  await expect(page.getByRole('heading', { name: /frappe.* à la porte/ })).toBeVisible();
  await expect(page.getByText('Kossi').first()).toBeVisible();

  await page.getByRole('button', { name: 'Accueillir' }).click();

  // La demande disparaît, et Kossi est désormais des membres actifs.
  await expect(page.getByRole('heading', { name: /frappe.* à la porte/ })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        ({ groupeId }) => {
          const membres = JSON.parse(localStorage.getItem(`lf.members.${groupeId}`) || '[]');
          return membres.find((m: { uid: string }) => m.uid === 'e2e-nouveau')?.status;
        },
        { groupeId: GROUPE.id }
      )
    )
    .toBe('actif');

  void UTILISATEUR;
});

/**
 * Le nombre de membres était un compteur tenu à la main : incrémenté à
 * l'admission, décrémenté au départ, et oublié par la suppression de compte.
 * Chaque admission refusée l'augmentait aussi — « ça part, ça revient », six
 * fois, et le groupe d'une seule personne se déclarait complet.
 *
 * Il se recompte désormais sur la liste des membres, qui seule dit vrai.
 */
test('cellule : un compteur qui a dérivé se répare et n’empêche plus d’accueillir', async ({ page }) => {
  await semerSession(page);
  await page.addInitScript(
    ({ groupeId, membres }) => {
      const groupes = JSON.parse(localStorage.getItem('lf.groups') || '[]');
      localStorage.setItem(
        'lf.groups',
        JSON.stringify(
          groupes.map((g: { id: string }) =>
            // Six membres annoncés, un seul dans la liste.
            g.id === groupeId ? { ...g, membersCount: 6, capacity: 6 } : g
          )
        )
      );
      localStorage.setItem(
        `lf.members.${groupeId}`,
        JSON.stringify([
          membres[0],
          {
            uid: 'e2e-kodjo',
            groupId: groupeId,
            displayName: 'Kodjo',
            email: 'kodjo@example.test',
            role: 'membre',
            status: 'en_attente',
            joinedAt: 1_700_000_000_000,
            preparedSteps: [],
            personalStep: 1,
          },
        ])
      );
    },
    { groupeId: GROUPE.id, membres: MEMBRES }
  );

  await page.goto('/groupes');
  await page.getByRole('button', { name: 'Accueillir' }).click();

  await expect(page.getByText('Le groupe est complet', { exact: false })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        ({ groupeId }) => {
          const membres = JSON.parse(localStorage.getItem(`lf.members.${groupeId}`) || '[]');
          return membres.find((m: { uid: string }) => m.uid === 'e2e-kodjo')?.status;
        },
        { groupeId: GROUPE.id }
      )
    )
    .toBe('actif');
});
