import assert from 'node:assert/strict';

const demandes: string[] = [];
let syntheseNavigateur = 0;
let audiosJoues = 0;

class FausseRequete {
  constructor(public url: string) {}
}

class FauxAudio {
  playbackRate = 1;
  volume = 1;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onpause: (() => void) | null = null;

  constructor(public src: string) {}

  play(): Promise<void> {
    audiosJoues += 1;
    queueMicrotask(() => {
      this.onplay?.();
      queueMicrotask(() => this.onended?.());
    });
    return Promise.resolve();
  }

  pause(): void {
    this.onpause?.();
  }
}

const synthese = {
  cancel: () => {},
  getVoices: () => [],
  speak: () => {
    syntheseNavigateur += 1;
  },
};

Object.assign(globalThis, {
  window: { crypto: globalThis.crypto, speechSynthesis: synthese },
  Audio: FauxAudio,
  Request: FausseRequete,
  caches: {
    open: async () => ({
      match: async () => null,
      put: async () => {},
    }),
  },
  fetch: async (_entree: RequestInfo | URL, initialisation?: RequestInit) => {
    const corps = JSON.parse(String(initialisation?.body)) as { texte: string };
    demandes.push(corps.texte);
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  },
});

const { lireAVoixHaute } = await import('../src/lib/ambiance');
const texte = Array.from(
  { length: 36 },
  (_, index) => `Étape ${index + 1}. Prends le temps d’écouter cette phrase avant de poursuivre.`
).join(' ');

await new Promise<void>((resolve, reject) => {
  const demarree = lireAVoixHaute(texte, {
    genre: 'masculin',
    repliNavigateur: false,
    onFin: resolve,
    onErreur: () => reject(new Error('la voix studio ne devait pas échouer')),
  });
  if (!demarree) reject(new Error('la lecture devait démarrer'));
});

assert.ok(demandes.length > 1, 'le long texte doit produire plusieurs demandes studio');
assert.ok(demandes.every((demande) => demande.length <= 1_200));
assert.equal(audiosJoues, demandes.length, 'chaque morceau studio doit être joué une fois');
assert.equal(syntheseNavigateur, 0, 'la voix système ne doit jamais parler dans l’immersion');

console.log('Lecture voix vérifiée : studio enchaîné, limite respectée, aucun repli robotique.');
