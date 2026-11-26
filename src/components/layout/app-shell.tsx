"use client";

import {
  Bookmark,
  Brain,
  CalendarClock,
  Flame,
  Home,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export type ShellUser = { name: string; role: "USER" | "ADMIN"; darkMode: boolean };

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/for-you", label: "For You", icon: Sparkles },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/discover", label: "Discover", icon: Lightbulb },
  { href: "/on-this-day", label: "On This Day", icon: CalendarClock },
  { href: "/trivia", label: "Trivia", icon: Brain },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

const MOBILE_NAV = ["/", "/for-you", "/discover", "/trivia", "/profile"];

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const nav = user.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin", icon: LayoutDashboard }] : NAV;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Apply the saved profile preference on a fresh device (no local theme chosen yet).
  useEffect(() => {
    if (!localStorage.getItem("theme")) setTheme(user.darkMode ? "dark" : "light");
  }, [user.darkMode, setTheme]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-border/60 px-4 py-6 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-3">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-400 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
            D
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">DailySphere</span>
        </Link>
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isActive(href) && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-8">
          <Link href="/" className="font-heading text-lg font-semibold lg:hidden">DailySphere</Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu name={user.name} isAdmin={user.role === "ADMIN"} />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-8 lg:pb-12">{children}</main>
      </div>

      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl px-2 py-2 lg:hidden">
        {nav
          .filter((n) => MOBILE_NAV.includes(n.href))
          .map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted-foreground",
                isActive(href) && "text-primary",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
