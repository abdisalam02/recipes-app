"use client";

import Link from "next/link";
import { IconMoon, IconSun, IconChefHat, IconHome, IconPlus, IconHeart, IconRobot, IconFlame, IconCalendarEvent } from "@tabler/icons-react";
import { ThemeType, useTheme } from "./contexts/ThemeContext";

interface NavbarProps {
  currentTheme: ThemeType;
  changeTheme: (theme: ThemeType) => void;
}

export default function Navbar({ currentTheme, changeTheme }: NavbarProps) {
  const { themes } = useTheme();
  const currentThemeInfo = themes.find((t) => t.name === currentTheme) || themes[0];
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    changeTheme(isDark ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 z-50 bg-base-100/95 border-b border-base-300/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-base-content hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary shadow-sm shadow-primary/30">
              <IconChefHat size={20} className="text-primary-content" />
            </div>
            <span className="hidden sm:inline">Recipes<span className="text-primary">App</span></span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Desktop navigation links */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium">
              {[
                { href: "/", icon: IconHome, label: "Home" },
                { href: "/recipes/add", icon: IconPlus, label: "Add" },
                { href: "/favorites", icon: IconHeart, label: "Favorites" },
                { href: "/tinder", icon: IconFlame, label: "Tinder" },
                { href: "/AI", icon: IconRobot, label: "AI" },
                { href: "/daily-recipes", icon: IconCalendarEvent, label: "Daily" },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-2 rounded-xl text-base-content/70 hover:text-base-content hover:bg-base-200 transition-all flex items-center gap-1.5"
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 border border-base-300 text-base-content transition-all duration-200 hover:scale-105"
              title={isDark ? "Switch to Light" : "Switch to Dark"}
            >
              <span className="text-base">{isDark ? <IconSun size={18} /> : <IconMoon size={18} />}</span>
              <span className="hidden sm:inline font-medium text-sm">{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
