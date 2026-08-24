'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#efe7d8', color: '#07162b', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <section style={{ maxWidth: 520, background: '#fffdf7', border: '1px solid #ded6c8', borderRadius: 28, padding: 32, textAlign: 'center', boxShadow: '0 18px 50px rgba(11,29,56,.16)' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, margin: 0 }}>Le bureau doit être rouvert</p>
            <p style={{ lineHeight: 1.6, color: '#2a4472' }}>Une erreur générale a interrompu l’application. Les pages conservées sur votre appareil ne sont pas effacées.</p>
            <button onClick={reset} style={{ border: 0, borderRadius: 999, background: '#f6c453', color: '#07162b', fontWeight: 800, padding: '12px 22px', cursor: 'pointer' }}>Rouvrir l’application</button>
          </section>
        </main>
      </body>
    </html>
  );
}
