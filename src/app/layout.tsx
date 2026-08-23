import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import BibleReader from '@/components/BibleReader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Les Fondements — Une foi enracinée',
    template: '%s | Les Fondements',
  },
  description: 'Un parcours de discipleship numérique en 20 étapes, vécu personnellement et en petit groupe.',
  applicationName: 'Les Fondements',
  keywords: ['discipleship', 'formation chrétienne', 'petits groupes', 'parcours biblique'],
  openGraph: {
    title: 'Les Fondements — Une foi enracinée. Une vie transformée.',
    description: '20 semaines pour apprendre, partager, pratiquer et transmettre.',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Les Fondements' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Les Fondements',
    description: 'Une foi enracinée. Une vie transformée.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <BibleReader />
        </AuthProvider>
      </body>
    </html>
  );
}
