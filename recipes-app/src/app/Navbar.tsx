'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconHome,
  IconPlus,
  IconHeart,
  IconFlame,
  IconMenu,
  IconX,
  IconRobot,
  IconPalette,
  IconChevronDown,
  IconMoon,
  IconSun,
  IconColorSwatch
} from '@tabler/icons-react';
import { ThemeType } from './NavbarWrapper';

// Define a simpler list of themes to cycle through
const popularThemes: Array<{name: ThemeType, label: string, icon: React.ReactNode}> = [
  { name: 'light', label: 'Light', icon: <IconSun size={16} /> },
  { name: 'dark', label: 'Dark', icon: <IconMoon size={16} /> },
  { name: 'cupcake', label: 'Cupcake', icon: <IconColorSwatch size={16} /> },
  { name: 'synthwave', label: 'Synthwave', icon: <IconColorSwatch size={16} /> },
  { name: 'retro', label: 'Retro', icon: <IconColorSwatch size={16} /> },
  { name: 'cyberpunk', label: 'Cyberpunk', icon: <IconColorSwatch size={16} /> },
  { name: 'dracula', label: 'Dracula', icon: <IconColorSwatch size={16} /> },
  { name: 'night', label: 'Night', icon: <IconColorSwatch size={16} /> },
];

interface NavbarProps {
  currentTheme: ThemeType;
  changeTheme: (theme: ThemeType) => void;
}

export default function Navbar({ currentTheme, changeTheme }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Get current theme info
  const getCurrentThemeInfo = () => {
    return popularThemes.find(t => t.name === currentTheme) || popularThemes[0];
  };
  
  // Toggle to next theme in the list
  const toggleToNextTheme = () => {
    const currentIndex = popularThemes.findIndex(t => t.name === currentTheme);
    const nextIndex = (currentIndex + 1) % popularThemes.length;
    changeTheme(popularThemes[nextIndex].name);
  };

  return (
    <nav className="navbar bg-base-100 shadow py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo / Brand */}
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost normal-case text-xl">
            Recipes App
          </Link>
        </div>
        <div className="flex-none">
          {/* Mobile Dropdown – Visible on small screens */}
          <div className="dropdown dropdown-end lg:hidden">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-circle text-2xl"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <IconX size={28} /> : <IconMenu size={28} />}
            </label>
            {mobileOpen && (
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-72"
              >
                <li>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg py-2"
                  >
                    <IconHome size={18} /> Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recipes/add"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg py-2"
                  >
                    <IconPlus size={18} /> Add Recipe
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg py-2"
                  >
                    <IconHeart size={18} /> Favorites
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tinder"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg py-2 text-pink-500 animate-pulse"
                  >
                    <IconFlame size={18} /> Tinder
                  </Link>
                </li>
                <li>
                  <Link
                    href="/AI"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg py-2"
                  >
                    <IconRobot size={18} /> AI Recipes
                  </Link>
                </li>
                
                {/* Simple Theme Toggle */}
                <li className="mt-4">
                  <button 
                    className="flex items-center justify-between gap-3 text-lg py-2"
                    onClick={() => {
                      toggleToNextTheme();
                      // Don't close the mobile menu so user can see theme change
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <IconPalette size={18} /> 
                      <span>Toggle Theme</span>
                    </div>
                    <div className="badge badge-primary">
                      {getCurrentThemeInfo().label}
                    </div>
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Desktop Menu – Visible on large screens */}
          <ul className="menu menu-horizontal p-0 hidden lg:flex items-center gap-4">
            <li>
              <Link href="/" className="flex items-center gap-2">
                <IconHome size={16} /> Home
              </Link>
            </li>
            <li>
              <Link href="/recipes/add" className="flex items-center gap-2">
                <IconPlus size={16} /> Add Recipe
              </Link>
            </li>
            <li>
              <Link href="/favorites" className="flex items-center gap-2">
                <IconHeart size={16} /> Favorites
              </Link>
            </li>
            <li>
              <Link
                href="/tinder"
                className="flex items-center gap-2 text-pink-500 transition-all hover:scale-110 hover:text-pink-700"
              >
                <IconFlame size={16} /> Tinder
              </Link>
            </li>
            <li>
              <Link href="/AI" className="flex items-center gap-2">
                <IconRobot size={16} /> AI Recipes
              </Link>
            </li>
            
            {/* Simple Theme Toggle for Desktop */}
            <li>
              <button 
                onClick={toggleToNextTheme} 
                className="btn btn-ghost flex items-center gap-2"
              >
                {getCurrentThemeInfo().icon}
                {getCurrentThemeInfo().label}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
