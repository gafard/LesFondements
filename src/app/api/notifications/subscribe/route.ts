import { NextRequest, NextResponse } from 'next/server';
import { verifierFirebaseToken } from '@/lib/firebaseToken';

export async function POST(req: NextRequest) {
  try {
    await verifierFirebaseToken(req);
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Abonnement push invalide ou manquant' },
        { status: 400 }
      );
    }

    // Les préférences restent pour l'instant sur l'appareil. On ne prétend
    // plus les avoir enregistrées sur un serveur tant qu'un ordonnanceur
    // durable n'est pas branché.
    return NextResponse.json({
      success: true,
      persisted: false,
      message: 'Appareil vérifié ; préférences conservées localement',
      savedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const status = errorMsg === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentification requise' : errorMsg }, { status });
  }
}
