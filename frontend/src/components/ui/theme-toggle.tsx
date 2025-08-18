"use client";

import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return null;
}
