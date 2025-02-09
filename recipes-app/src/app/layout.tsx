'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';  // Your DaisyUI-based Navbar component
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // State for theme; we support "light" and "dark" (DaisyUI will use these)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // On mount, check if a theme was saved in localStorage and set it.
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-scheme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Toggle between light and dark themes.
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
        {/* Navbar using our DaisyUI-based Navbar component */}
        <Navbar colorScheme={theme} toggleColorScheme={toggleTheme} />

        {/* Main content */}
        <main className="min-h-screen container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="footer p-4 bg-base-300 text-base-content">
          <div className="items-center grid-flow-col">
            <p>&copy; {new Date().getFullYear()} Recipes App. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
