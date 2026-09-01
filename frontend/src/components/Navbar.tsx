// FILE: frontend/src/components/Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const NAV_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "News & Media", href: "/news" },
  { label: "Fixtures & Results", href: "/fixtures" },
  { label: "Tables", href: "/tables" },
  { label: "First Team Squad", href: "/squad" },
  { label: "Stats Matrix", href: "/stats" },
  { label: "History & Legends", href: "/history", badge: "1878" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-carbon/95 backdrop-blur-md border-b border-brand-border">
      {/* Top Heritage Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-gold" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo / Badge */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-crimson to-brand-red flex items-center justify-center shadow-lg border border-brand-red/40 group-hover:scale-105 transition-transform">
              <span className="font-display text-xl font-bold text-white tracking-tighter">
                UTD
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-wider text-white group-hover:text-brand-red transition-colors leading-none">
                THE UNITED DATA
              </span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5">
                Official Club Analytics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "text-white bg-brand-slate border border-brand-border shadow-inner"
                      : "text-gray-400 hover:text-white hover:bg-brand-carbon/60"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-gold/15 text-brand-gold rounded border border-brand-gold/30">
                        {link.badge}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-red rounded-full shadow-[0_0_8px_#DA291C]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-brand-slate border border-brand-border focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-slate border-b border-brand-border px-4 pt-2 pb-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider ${
                  isActive
                    ? "text-white bg-brand-red/20 border border-brand-red/30 text-brand-red"
                    : "text-gray-300 hover:text-white hover:bg-brand-carbon"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-gold/15 text-brand-gold rounded border border-brand-gold/30">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}