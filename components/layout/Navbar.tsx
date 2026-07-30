"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

type Props = {
  variant?: "landing" | "app";
};

export function Navbar({ variant = "landing" }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/find-jobs", label: "Find Jobs" },
    { href: "/profile", label: "Profile" },
  ];

  const ctaLabel = variant === "landing" ? "Start For Free" : "Sign Out";

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-border">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Logo />

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-text-dark hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-overlay transition-colors"
        >
          {ctaLabel}
        </button>
      </div>
    </header>
  );
}
