import assert from 'node:assert/strict';

let maintenant = 0;
let prochainId = 1;
const animations = new Map<number, FrameRequestCallback>();

Object.defineProperty(globalThis, 'performance', {
  configurable: true,
  value: { now: () => maintenant },
});
Object.assign(globalThis, {
  window: {},
  requestAnimationFrame: (rappel: FrameRequestCallback) => {
    const id = prochainId++;
    animations.set(id, rappel);
    return id;
  },
  cancelAnimationFrame: (id: number) => animations.delete(id),
});

class FauxAudio {
  static dernier: FauxAudio | null = null;
  loop = false;
  volume = 1;
  currentTime = 0;
  constructor(public src: string) {
    FauxAudio.dernier = this;
  }
  play() {
    return Promise.resolve();
  }
  pause() {}
}
Object.assign(globalThis, { Audio: FauxAudio });

function avancer(ms: number) {
  maintenant += ms;
  const rappels = [...animations.values()];
  animations.clear();
  rappels.forEach((rappel) => rappel(maintenant));
}

const { activerDuckingVoix, arreterAmbiance, jouerAmbiance } = await import('../src/lib/ambiance');

await jouerAmbiance('emotional-piano', 1);
const audio = FauxAudio.dernier;
assert.ok(audio);
assert.equal(audio.volume, 0, 'entrée musicale silencieuse');
avancer(600);
assert.ok(audio.volume > 0 && audio.volume < 0.14, 'entrée progressive');
avancer(600);
assert.equal(audio.volume, 0.14, 'volume musical nominal');

const voixA = Symbol('voix-a');
const voixB = Symbol('voix-b');
activerDuckingVoix(true, voixA);
avancer(300);
assert.ok(Math.abs(audio.volume - 0.0308) < 0.0001, 'la musique descend à 22 % sous la voix');

activerDuckingVoix(true, voixB);
activerDuckingVoix(false, voixA);
avancer(1_200);
assert.ok(Math.abs(audio.volume - 0.0308) < 0.0001, 'une seconde voix maintient le ducking');

activerDuckingVoix(false, voixB);
avancer(1_200);
assert.ok(Math.abs(audio.volume - 0.14) < 0.0001, 'la musique remonte après la dernière voix');

await arreterAmbiance();
await Promise.all([jouerAmbiance('lieu-saint-presence'), jouerAmbiance('selah-repos')]);
assert.equal(FauxAudio.dernier?.src, '/audio/ambiances/selah-repos.mp3', 'la dernière sélection musicale gagne');
await arreterAmbiance();
console.log('Ducking vérifié : fondu, chevauchement des voix et restauration du volume.');

