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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base-100 border-b-3 border-base-content">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 font-black text-xl text-base-content hover:-translate-y-1 hover:translate-x-1 transition-transform">
            <div className="w-10 h-10 border-3 border-base-content shadow-neo-sm rounded-xl flex items-center justify-center bg-primary">
              <IconChefHat size={22} className="text-base-content" stroke={2.5} />
            </div>
            <span className="hidden sm:inline">RECIPES<span className="text-primary font-black">APP</span></span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Desktop navigation links */}
            <div className="hidden md:flex items-center gap-2 text-sm font-bold">
              {[
                { href: "/", icon: IconHome, label: "Home", bg: "bg-primary" },
                { href: "/recipes/add", icon: IconPlus, label: "Add", bg: "bg-secondary" },
                { href: "/favorites", icon: IconHeart, label: "Favorites", bg: "bg-accent" },
                { href: "/tinder", icon: IconFlame, label: "Tinder", bg: "bg-base-300" },
                { href: "/AI", icon: IconRobot, label: "AI", bg: "bg-primary" },
                { href: "/daily-recipes", icon: IconCalendarEvent, label: "Daily", bg: "bg-secondary" },
              ].map(({ href, icon: Icon, label, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-xl text-base-content border-3 border-transparent hover:border-base-content hover:${bg} hover:shadow-neo-sm transition-all flex items-center gap-1.5`}
                >
                  <Icon size={18} stroke={2.5} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="neo-button flex items-center gap-2 px-4 py-2 bg-secondary text-base-content hover:bg-accent"
              title={isDark ? "Switch to Light" : "Switch to Dark"}
            >
              <span className="text-base">{isDark ? <IconSun size={20} stroke={2.5} /> : <IconMoon size={20} stroke={2.5} />}</span>
              <span className="hidden sm:inline font-bold text-sm">{isDark ? "LIGHT" : "DARK"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
