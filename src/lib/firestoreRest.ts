import 'server-only';

type ValeurFirestore = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  mapValue?: { fields?: Record<string, ValeurFirestore> };
  arrayValue?: { values?: ValeurFirestore[] };
};

interface DocumentFirestore {
  fields?: Record<string, ValeurFirestore>;
}

function decoder(valeur: ValeurFirestore): unknown {
  if ('nullValue' in valeur) return null;
  if ('booleanValue' in valeur) return valeur.booleanValue;
  if ('integerValue' in valeur) return Number(valeur.integerValue);
  if ('doubleValue' in valeur) return valeur.doubleValue;
  if ('timestampValue' in valeur) return valeur.timestampValue;
  if ('stringValue' in valeur) return valeur.stringValue;
  if ('arrayValue' in valeur) return (valeur.arrayValue?.values ?? []).map(decoder);
  if ('mapValue' in valeur) return decoderChamps(valeur.mapValue?.fields ?? {});
  return undefined;
}

function decoderChamps(champs: Record<string, ValeurFirestore>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(champs).map(([cle, valeur]) => [cle, decoder(valeur)]));
}

/**
 * Lit Firestore avec le jeton de l'utilisateur. La requête passe donc par les
 * mêmes règles que l'application et ne donne aucun privilège serveur caché.
 */
export async function lireDocumentFirestore<T>(
  token: string,
  ...segments: string[]
): Promise<T | null> {
  const projet = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projet || !segments.length) return null;
  const chemin = segments.map(encodeURIComponent).join('/');
  const reponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projet)}/databases/(default)/documents/${chemin}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error('FORBIDDEN');
  const document = (await reponse.json()) as DocumentFirestore;
  return decoderChamps(document.fields ?? {}) as T;
}

export async function verifierMembreActif(
  token: string,
  groupId: string,
  uid: string
): Promise<{ role: string }> {
  const membre = await lireDocumentFirestore<{ uid?: string; status?: string; role?: string }>(
    token,
    'groups',
    groupId,
    'members',
    uid
  );
  if (!membre || membre.uid !== uid || membre.status !== 'actif') throw new Error('FORBIDDEN');
  return { role: membre.role ?? 'membre' };
}
