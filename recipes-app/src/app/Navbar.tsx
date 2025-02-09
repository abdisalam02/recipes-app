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
} from '@tabler/icons-react';

// Update the props interface to include colorScheme and toggleColorScheme.
interface NavbarProps {
  colorScheme: 'light' | 'dark';
  toggleColorScheme: () => void;
}

export default function Navbar({ colorScheme, toggleColorScheme }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Ensure the document element reflects the current theme
    document.documentElement.setAttribute('data-theme', colorScheme);
  }, [colorScheme]);

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
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-56"
              >
                <li>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <IconHome size={16} /> Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recipes/add"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <IconPlus size={16} /> Add Recipe
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <IconHeart size={16} /> Favorites
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tinder"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-pink-500 animate-pulse"
                  >
                    <IconFlame size={16} /> Tinder
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      toggleColorScheme();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    Toggle Theme
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
              <button onClick={toggleColorScheme} className="btn btn-ghost">
                Toggle Theme
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
