"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-md border border-border bg-surface ${className}`}
        aria-hidden="true"
      />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getLabel = () => {
    if (theme === "system") return "System theme (auto)";
    return resolvedTheme === "dark" ? "Dark theme" : "Light theme";
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${getLabel()}. Click to cycle.`}
      aria-label={`Current theme: ${getLabel()}. Click to switch theme.`}
      className={`inline-flex items-center justify-center p-2 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-secondary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${className}`}
    >
      {theme === "system" ? (
        <Laptop className="size-4 text-muted-foreground" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="size-4 text-primary" />
      ) : (
        <Sun className="size-4 text-primary" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
