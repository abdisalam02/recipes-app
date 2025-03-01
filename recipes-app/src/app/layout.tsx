// src/app/layout.tsx
import './globals.css';
import NavbarWrapper from './NavbarWrapper'; // Client component

export const metadata = {
  title: 'Your PWA App',
  description: 'An awesome Progressive Web App built with Next.js',
  themeColor: '#000000',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
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
