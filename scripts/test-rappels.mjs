import assert from 'node:assert/strict';
import {
  dejaServi,
  fuseauIanaValide,
  heureLocale,
  jourLocal,
  marquerServi,
  prochaineRencontre,
} from '../src/lib/rappels.ts';

assert.equal(fuseauIanaValide('Africa/Lome'), true);
assert.equal(fuseauIanaValide('Europe/Paris'), true);
assert.equal(fuseauIanaValide('UTC+2 inventé'), false);

const passageHeureEte = new Date('2026-03-29T00:30:00Z');
assert.equal(jourLocal(passageHeureEte, 'Europe/Paris'), '2026-03-29');
assert.equal(heureLocale(passageHeureEte, 'Europe/Paris'), '01:30');
assert.equal(heureLocale(new Date('2026-03-29T01:30:00Z'), 'Europe/Paris'), '03:30');

const paris = prochaineRencontre(
  {
    groupId: 'paris', groupName: 'Paris', currentStep: 4,
    rhythm: 'hebdomadaire', weekday: 0, time: '09:00', timezone: 'Europe/Paris',
    nextMeetingDate: '2026-03-29',
  },
  new Date('2026-03-28T12:00:00Z')
);
assert.equal(paris?.toISOString(), '2026-03-29T07:00:00.000Z');

const bimensuel = prochaineRencontre(
  {
    groupId: 'lome', groupName: 'Lomé', currentStep: 2,
    rhythm: 'bimensuel', weekday: 2, time: '19:00', timezone: 'Africa/Lome',
    firstMeetingDate: '2026-09-01',
  },
  new Date('2026-09-08T08:00:00Z')
);
assert.equal(bimensuel?.toISOString(), '2026-09-15T19:00:00.000Z');

const abonnement = {
  endpoint: 'https://push.example.test/1', keys: { p256dh: 'a', auth: 'b' }, uid: 'u1',
  preferences: { goutteDeRosee: true, heureMatin: '07:30', rappel48h: true, jourDeRencontre: true, vieDeGroupe: true },
  timezone: 'Africa/Lome', inscritLe: 1, evenementsDepuis: 1, dedup: {},
};
const marque = marquerServi(abonnement, ['rosee:2026-08-27'], 2);
assert.equal(dejaServi(marque, 'rosee:2026-08-27'), true);
assert.equal(dejaServi(marque, 'rosee:2026-08-28'), false);

console.log('Moteur de rappels vérifié : IANA, changement d’heure, cadence bimensuelle et déduplication.');
