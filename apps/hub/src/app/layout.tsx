import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { profile } from '@/data/profile';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: `${profile.name} – ${profile.headline}`,
    template: `%s – ${profile.name}`,
  },
  description: profile.pitch,
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} – ${profile.headline}`,
    description: profile.pitch,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} – ${profile.headline}`,
    description: profile.pitch,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
