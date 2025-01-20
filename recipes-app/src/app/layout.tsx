"use client";
import { MantineProvider, createTheme, Button } from "@mantine/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBook2, IconSun, IconMoon } from "@tabler/icons-react";
import '@mantine/core/styles.css'; // Make sure you are importing Mantine styles
import './globals.css'; // Your global CSS file
import 'normalize.css'; // Import Normalize.css for consistent styles across browsers

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
  // Initialize color scheme from localStorage or default to 'light'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  
  // Load saved color scheme on mount
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
          theme={theme} // Pass theme separately
          defaultColorScheme={colorScheme} // Set default color scheme
        >
          <nav className="navbar">
            <div className="navbar-content">
              <Link href="/" className="nav-logo">
                <IconBook2 size={24} />
                <span>Recipes App</span>
              </Link>
              <div className="nav-links">
                <Link href="/" className="nav-link">Home</Link>
                <Link href="/recipes/add" className="nav-link">Add Recipe</Link>
                <Link href="/favorites" className="nav-link">Favorites</Link>
                <Button 
                  variant="subtle"
                  onClick={toggleColorScheme}
                  ml="md"
                  leftSection={colorScheme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                >
                  {colorScheme === 'light' ? 'Dark' : 'Light'}
                </Button>
              </div>
            </div>
          </nav>
          <main>
            {children}
          </main>
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} Recipes App. All rights reserved.</p>
          </footer>
        </MantineProvider>
      </body>
    </html>
  );
}
