import 'server-only';

/** Vérifie un jeton Firebase sans embarquer de compte de service dans le Worker. */
export async function verifierFirebaseToken(request: Request): Promise<{ uid: string; email?: string }> {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!token || !apiKey) throw new Error('UNAUTHENTICATED');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      cache: 'no-store',
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = data.users?.[0];
  if (!response.ok || !user?.localId) throw new Error('UNAUTHENTICATED');
  return { uid: user.localId, email: user.email };
}
