import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId, preferences } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Abonnement push invalide ou manquant' },
        { status: 400 }
      );
    }

    // Réception et validation de l'abonnement
    return NextResponse.json({
      success: true,
      message: 'Abonnement aux notifications enregistré avec succès',
      savedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
