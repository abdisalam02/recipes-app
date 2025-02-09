'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';  // Ensure the path is correct
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-scheme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('color-scheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        <title>Recipes App</title>
      </head>
      <body className="bg-base-200">
        <Navbar colorScheme={theme} toggleColorScheme={toggleTheme} />
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
