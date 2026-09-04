import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: {
    default: 'HVAC Parts Storefront',
    template: '%s – HVAC Parts Storefront',
  },
  description:
    'Browse and order HVAC parts: furnaces, filters, thermostats, motors, and controls. Live inventory backed by a Node.js GraphQL API.',
  openGraph: {
    title: 'HVAC Parts Storefront',
    description:
      'Browse and order HVAC parts: furnaces, filters, thermostats, motors, and controls.',
    type: 'website',
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/60 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
            HVAC Parts Storefront demo · Built with Next.js 15 and Zustand
          </div>
        </footer>
      </body>
    </html>
  );
}