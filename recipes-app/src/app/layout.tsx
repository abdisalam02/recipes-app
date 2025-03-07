// src/app/layout.tsx
import './globals.css';
import NavbarWrapper from './NavbarWrapper'; // Client component
import { Metadata } from 'next';
import { registerServiceWorker } from './worker';

// Register service worker
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

export const metadata: Metadata = {
  title: 'Recipe App',
  description: 'Your personal recipe collection',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    { rel: 'shortcut icon', url: '/favicon.ico' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Recipe App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Recipe App" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-base-200">
        <NavbarWrapper />
        <main className="min-h-screen container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="footer p-4 bg-base-300 text-base-content">
          <div className="items-center grid-flow-col">
            <p>&copy; {new Date().getFullYear()} Recipes App. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
