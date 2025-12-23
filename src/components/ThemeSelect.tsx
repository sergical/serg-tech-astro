"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeSelectProps {
  initialTheme?: string;
}

export default function ThemeSelect({ initialTheme }: ThemeSelectProps) {
  const [mode, setMode] = useState<ThemeMode>(
    (initialTheme as ThemeMode) || "system"
  );

  const getSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const applyTheme = (themeMode: ThemeMode) => {
    const resolvedTheme = themeMode === "system" ? getSystemTheme() : themeMode;
    document.documentElement.className = resolvedTheme;
  };

  useEffect(() => {
    // Apply theme on mount
    applyTheme(mode);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  const handleThemeChange = async (newMode: ThemeMode) => {
    setMode(newMode);
    applyTheme(newMode);

    try {
      await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newMode }),
      });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const themes: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <SunIcon className="h-4 w-4" />, label: "Light" },
    { value: "dark", icon: <MoonIcon className="h-4 w-4" />, label: "Dark" },
    { value: "system", icon: <MonitorIcon className="h-4 w-4" />, label: "System" },
  ];

  return (
    <div className="flex items-center gap-1">
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => handleThemeChange(theme.value)}
          className={`p-1.5 rounded transition-colors ${
            mode === theme.value
              ? "text-foreground bg-foreground/10"
              : "text-foreground/40 hover:text-foreground"
          }`}
          aria-label={theme.label}
          title={theme.label}
        >
          {theme.icon}
        </button>
      ))}
    </div>
  );
}
