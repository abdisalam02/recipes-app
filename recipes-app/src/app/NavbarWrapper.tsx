// src/app/NavbarWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Link from 'next/link';

// Define available themes
export type ThemeType = 'light' | 'dark' | 'cupcake' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter';

export default function NavbarWrapper() {
  const [theme, setTheme] = useState<ThemeType>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType;
    if (storedTheme && storedTheme !== theme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  }, [theme]);

  // Handle theme change
  const changeTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return <Navbar currentTheme={theme} changeTheme={changeTheme} />;
}
