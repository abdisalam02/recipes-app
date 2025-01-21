'use client';

import { MantineProvider, createTheme } from "@mantine/core";
import { useState, useEffect } from "react";
import Link from "next/link";
import { IconSun, IconMoon } from "@tabler/icons-react";
import '@mantine/core/styles.css';
import './globals.css';
import Navbar from "./Navbar";  // Import Navbar Component

const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'blue',
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedScheme = localStorage.getItem('color-scheme');
    if (savedScheme === 'dark' || savedScheme === 'light') {
      setColorScheme(savedScheme);
      document.documentElement.setAttribute('data-mantine-color-scheme', savedScheme);
    }
  }, []);

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
    localStorage.setItem('color-scheme', newScheme);
    document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);
  };

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <MantineProvider 
          theme={theme} 
          defaultColorScheme={colorScheme}  // Use defaultColorScheme instead of colorScheme
        >
          <Navbar colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} /> {/* Navbar added here */}
          
          {/* Main Content */}
          <main>
            {children}
          </main>
          
          {/* Footer */}
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} Recipes App. All rights reserved.</p>
          </footer>
        </MantineProvider>
      </body>
    </html>
  );
}
