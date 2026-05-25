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
      primary: "#6366f1", // Indigo
      secondary: "#14b8a6", // Teal
      accent: "#8b5cf6", // Violet
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1f2937",
      textSecondary: "#6b7280",
    },
  },
  {
    name: "dark" as ThemeType,
    label: "Dark",
    colors: {
      primary: "#6366f1", // Indigo
      secondary: "#14b8a6", // Teal
      accent: "#8b5cf6", // Violet
      background: "#1f2937",
      surface: "#111827",
      text: "#e2e8f0",
      textSecondary: "#94a3b8",
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
