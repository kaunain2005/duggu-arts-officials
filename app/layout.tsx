import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Duggu Arts Official - Handmade Flowers & Crafts',
    template: '%s | Duggu Arts Official',
  },
  description:
    'Beautiful handmade pipe-cleaner flowers, bouquets, and personalized gifts. Custom orders welcome.',
  keywords: [
    'handmade flowers',
    'pipe cleaner flowers',
    'bouquets',
    'custom gifts',
    'personalized gifts',
  ],
  authors: [{ name: 'Duggu Arts Official' }],
  creator: 'Duggu Arts Official',
  publisher: 'Duggu Arts Official',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dugguarts.com',
    siteName: 'Duggu Arts Official',
    title: 'Duggu Arts Official - Handmade Flowers & Crafts',
    description: 'Beautiful handmade pipe-cleaner flowers, bouquets, and personalized gifts.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Duggu Arts Official - Handmade Flowers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duggu Arts Official - Handmade Flowers & Crafts',
    description: 'Beautiful handmade pipe-cleaner flowers, bouquets, and personalized gifts.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: pink)', color: '#fef7f7' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
