"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: Array<{
    name: ThemeType;
    label: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
    };
  }>;
}

const themes = [
  {
    name: "light" as ThemeType,
    label: "Light",
    colors: {
      primary: "#7C83FD", // neo-indigo
      secondary: "#FFD369", // neo-mustard
      accent: "#9FBB73", // neo-sage
      background: "#FDF8F5", // neo-cream
      surface: "#FFFFFF",
      text: "#111827",
      textSecondary: "#374151",
    },
  },
  {
    name: "dark" as ThemeType,
    label: "Dark",
    colors: {
      primary: "#A78BFA", // neo-purple
      secondary: "#FFD369", // neo-mustard
      accent: "#9FBB73", // neo-sage
      background: "#1E1E24", // neo-dark
      surface: "#2D2D34", // neo-charcoal
      text: "#ffffff",
      textSecondary: "#d1d5db",
    },
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>("light");

  // Load theme from localStorage on mount — only allow light/dark
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as ThemeType;
    const validTheme = storedTheme === "dark" ? "dark" : "light";
    setThemeState(validTheme);
    document.documentElement.setAttribute("data-theme", validTheme);
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const value = {
    theme,
    setTheme,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
