"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

import SentryIcon from "@/icons/SentryIcon";
import { MoonIcon, SunIcon } from "lucide-react";

interface ThemeSelectProps {
  initialTheme?: string;
}

export default function ThemeSelect({
  initialTheme = "light",
}: ThemeSelectProps) {
  const themes = useMemo(
    () => [
      {
        value: "light",
        label: "Light",
        icon: <SunIcon className="h-4 w-4" />,
      },
      {
        value: "dark",
        label: "Dark",
        icon: <MoonIcon className="h-4 w-4" />,
      },
      {
        value: "sentry",
        label: "Sentry",
        icon: <SentryIcon className="h-4 w-4" />,
      },
    ],
    []
  );

  const [theme, setTheme] = useState<string>(initialTheme);

  useEffect(() => {
    // Save to localStorage for persistence
    localStorage.setItem("theme", initialTheme);
  }, [initialTheme]);

  const handleThemeChange = async (newTheme: string) => {
    try {
      // Update server-side cookie
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (response.ok) {
        // Update local state
        setTheme(newTheme);

        // Update document class
        document.documentElement.className = newTheme;

        // Save to localStorage for persistence
        localStorage.setItem("theme", newTheme);
      }
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className="w-[130px] h-8">
        <SelectValue placeholder="Select theme">
          <div className="flex items-center gap-2">
            <span>{themes.find((t) => t.value === theme)?.icon}</span>
            <span>{themes.find((t) => t.value === theme)?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {themes.map((themeOption) => (
          <SelectItem key={themeOption.value} value={themeOption.value}>
            <div className="flex items-center gap-2">
              <span>{themeOption.icon}</span>
              <span>{themeOption.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
