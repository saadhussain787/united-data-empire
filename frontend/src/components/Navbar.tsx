"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
  { label: "Analytics", href: "/analytics" },
  { label: "History & Legends", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl bg-[#08090d]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl py-2" 
          : "top-0 left-0 w-full bg-transparent py-4"
      }`}
    >
      {/* Top Heritage Ribbon - Hidden when scrolled */}
      {!isScrolled && <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-gold" />}
      
      {/* Micro-Border Light Catcher */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo / Badge */}
        <div className="flex-shrink-0 flex items-center">
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
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-1 lg:gap-2" onMouseLeave={() => setHoveredPath(null)}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const showPill = hoveredPath ? hoveredPath === link.href : isActive;

            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredPath(link.href)}
                className={`relative px-4 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200`}
              >
                {showPill && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/40 border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)] backdrop-blur-md rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center space-x-1.5 ${isActive || hoveredPath === link.href ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-gray-400"}`}>
                  <span>{link.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: The 1878 Badge & Mobile Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-shrink-0 items-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/30 tracking-widest">
              EST. 1878
            </span>
          </div>

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