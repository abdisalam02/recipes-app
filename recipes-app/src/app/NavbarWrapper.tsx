// src/app/NavbarWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';

export default function NavbarWrapper() {
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

  return <Navbar colorScheme={theme} toggleColorScheme={toggleTheme} />;
}
