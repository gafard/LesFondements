import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ParcoursProvider } from '@/lib/ParcoursContext';
import ClientTools from '@/components/ClientTools';
import MesureProduit from '@/components/MesureProduit';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://parcours.lesfondements.workers.dev'),
  title: {
    default: 'Les Fondements — Une foi enracinée',
    template: '%s | Les Fondements',
  },
  description: 'Un parcours de discipleship numérique en 20 étapes, vécu personnellement et en petit groupe.',
  applicationName: 'Les Fondements',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // Installée sur iOS, l'application s'ouvre sans la barre de Safari.
  appleWebApp: {
    capable: true,
    title: 'Les Fondements',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  keywords: ['discipleship', 'formation chrétienne', 'petits groupes', 'parcours biblique'],
  openGraph: {
    title: 'Les Fondements — Une foi enracinée. Une vie transformée.',
    description: '20 semaines pour apprendre, partager, pratiquer et transmettre.',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Les Fondements' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Les Fondements',
    description: 'Une foi enracinée. Une vie transformée.',
    images: ['/og.jpg'],
  },
};

/**
 * `viewportFit: 'cover'` laisse le contenu passer sous l'encoche et la barre
 * d'accueil ; les marges de sécurité sont reprises dans la coque, via
 * `env(safe-area-inset-*)`. Sans cela, une application installée sur iPhone
 * affiche deux bandes noires et trahit immédiatement la page web.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f3e9' },
    { media: '(prefers-color-scheme: dark)', color: '#07162b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        {/*
          Chrome n'émet « beforeinstallprompt » qu'une fois, peu après le
          chargement — souvent avant que React n'ait hydraté, et bien avant
          qu'un composant chargé paresseusement ne s'abonne. L'événement était
          donc manqué, et le centre annonçait « installation impossible »
          alors qu'elle l'était. On l'attrape ici, au plus tôt, et
          `application.ts` vient le chercher quand il démarre.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__lfInvite=e;});",
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ParcoursProvider>
            {children}
            <ClientTools />
            <MesureProduit />
          </ParcoursProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
