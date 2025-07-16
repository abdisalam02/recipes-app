"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconMoon, IconSun, IconColorSwatch } from "@tabler/icons-react";
import { ThemeType } from "./NavbarWrapper";

// Define a simpler list of themes to cycle through
const popularThemes: Array<{
  name: ThemeType;
  label: string;
  icon: React.ReactNode;
}> = [
  { name: "light", label: "Light", icon: <IconSun size={16} /> },
  { name: "dark", label: "Dark", icon: <IconMoon size={16} /> },
  { name: "cupcake", label: "Cupcake", icon: <IconColorSwatch size={16} /> },
  {
    name: "synthwave",
    label: "Synthwave",
    icon: <IconColorSwatch size={16} />,
  },
  { name: "retro", label: "Retro", icon: <IconColorSwatch size={16} /> },
  {
    name: "cyberpunk",
    label: "Cyberpunk",
    icon: <IconColorSwatch size={16} />,
  },
  { name: "dracula", label: "Dracula", icon: <IconColorSwatch size={16} /> },
  { name: "night", label: "Night", icon: <IconColorSwatch size={16} /> },
];

interface NavbarProps {
  currentTheme: string;
  changeTheme: (theme: string) => void;
  children?: React.ReactNode;
}

export default function Navbar({
  currentTheme,
  changeTheme,
  children,
}: NavbarProps) {
  // Get current theme info
  const getCurrentThemeInfo = () => {
    return (
      popularThemes.find((t) => t.name === currentTheme) || popularThemes[0]
    );
  };

  // Toggle to next theme in the list
  const toggleToNextTheme = () => {
    const currentIndex = popularThemes.findIndex(
      (t) => t.name === currentTheme
    );
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

        {/* Theme Toggle Button */}
        <div className="flex-none">
          <button
            onClick={toggleToNextTheme}
            className="btn btn-ghost flex items-center gap-2"
          >
            {getCurrentThemeInfo().icon}
            <span className="hidden sm:inline">
              {getCurrentThemeInfo().label}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
