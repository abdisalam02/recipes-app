// src/app/NavbarWrapper.tsx
"use client";

import Navbar from "./Navbar";
import { useTheme } from "./contexts/ThemeContext";

export default function NavbarWrapper() {
  const { theme, setTheme } = useTheme();

  return <Navbar currentTheme={theme} changeTheme={setTheme} />;
}
