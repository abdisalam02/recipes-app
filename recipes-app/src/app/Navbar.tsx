"use client";

import Link from "next/link";
import {
  IconMoon,
  IconSun,
  IconColorSwatch,
  IconPalette,
  IconSparkles,
  IconFlame,
  IconStar,
  IconMoon2,
  IconChefHat,
} from "@tabler/icons-react";
import { ThemeType, useTheme } from "./contexts/ThemeContext";

// Define theme icons for better visual representation
const getThemeIcon = (themeName: ThemeType) => {
  switch (themeName) {
    case "light":
      return <IconSun size={16} />;
    case "dark":
      return <IconMoon size={16} />;
    case "cupcake":
      return <IconStar size={16} />;
    case "synthwave":
      return <IconSparkles size={16} />;
    case "retro":
      return <IconColorSwatch size={16} />;
    case "cyberpunk":
      return <IconFlame size={16} />;
    case "dracula":
      return <IconMoon2 size={16} />;
    case "night":
      return <IconMoon size={16} />;
    default:
      return <IconPalette size={16} />;
  }
};

interface NavbarProps {
  currentTheme: ThemeType;
  changeTheme: (theme: ThemeType) => void;
}

export default function Navbar({ currentTheme, changeTheme }: NavbarProps) {
  const { themes } = useTheme();

  // Get current theme info
  const getCurrentThemeInfo = () => {
    return themes.find((t) => t.name === currentTheme) || themes[0];
  };

  // Toggle to next theme in the list
  const toggleToNextTheme = () => {
    const currentIndex = themes.findIndex((t) => t.name === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex].name);
  };

  const currentThemeInfo = getCurrentThemeInfo();

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: `${currentThemeInfo.colors.background}f0`, // Add transparency
        borderBottom: `1px solid ${currentThemeInfo.colors.primary}20`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl transition-colors duration-200 hover:opacity-80"
            style={{ color: currentThemeInfo.colors.text }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${currentThemeInfo.colors.primary}, ${currentThemeInfo.colors.secondary})`,
              }}
            >
              <IconChefHat size={18} className="text-white" />
            </div>
            Recipes App
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleToNextTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `${currentThemeInfo.colors.primary}15`,
              border: `1px solid ${currentThemeInfo.colors.primary}30`,
              color: currentThemeInfo.colors.text,
            }}
          >
            <div
              className="p-1 rounded-lg"
              style={{
                backgroundColor: `${currentThemeInfo.colors.primary}20`,
              }}
            >
              {getThemeIcon(currentTheme)}
            </div>
            <span className="hidden sm:inline font-medium">
              {currentThemeInfo.label}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
