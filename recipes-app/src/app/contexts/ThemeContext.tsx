"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType =
  | "light"
  | "dark"
  | "cupcake"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "dracula"
  | "night";

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
      primary: "#f97316",
      secondary: "#ec4899",
      accent: "#10b981",
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
      primary: "#f97316",
      secondary: "#ec4899",
      accent: "#10b981",
      background: "#1f2937",
      surface: "#111827",
      text: "#e2e8f0",
      textSecondary: "#94a3b8",
    },
  },
  {
    name: "cupcake" as ThemeType,
    label: "Cupcake",
    colors: {
      primary: "#a855f7",
      secondary: "#ec4899",
      accent: "#f97316",
      background: "#faf0ff",
      surface: "#f0e6ff",
      text: "#7c2d92",
      textSecondary: "#c084fc",
    },
  },
  {
    name: "synthwave" as ThemeType,
    label: "Synthwave",
    colors: {
      primary: "#ff73ff",
      secondary: "#bd93f9",
      accent: "#8b93ff",
      background: "#100b45",
      surface: "#1a0f5e",
      text: "#ff73ff",
      textSecondary: "#bd93f9",
    },
  },
  {
    name: "retro" as ThemeType,
    label: "Retro",
    colors: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fbbf24",
      background: "#fef3c7",
      surface: "#fde68a",
      text: "#9a3412",
      textSecondary: "#ea580c",
    },
  },
  {
    name: "cyberpunk" as ThemeType,
    label: "Cyberpunk",
    colors: {
      primary: "#ffff00",
      secondary: "#00ffff",
      accent: "#ff00ff",
      background: "#000000",
      surface: "#1a1a00",
      text: "#ffff00",
      textSecondary: "#cccc00",
    },
  },
  {
    name: "dracula" as ThemeType,
    label: "Dracula",
    colors: {
      primary: "#8be9fd",
      secondary: "#bd93f9",
      accent: "#ff79c6",
      background: "#282a36",
      surface: "#1e1f29",
      text: "#8be9fd",
      textSecondary: "#6272a4",
    },
  },
  {
    name: "night" as ThemeType,
    label: "Night",
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#0f172a",
      surface: "#1e293b",
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

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as ThemeType;
    if (storedTheme && themes.find((t) => t.name === storedTheme)) {
      setThemeState(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    }
  }, []);

  // Handle theme change
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
