"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    void api("/api/preferences", { method: "PUT", json: { darkMode: next === "dark" } }).catch(() => undefined);
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
