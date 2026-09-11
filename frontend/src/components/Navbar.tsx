"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2, Calendar, Users, Trophy, Newspaper, ArrowRightLeft, Shield, Menu, X } from "lucide-react";

export interface SubLink {
  label: string;
  href: string;
  icon: React.FC<any>;
  description: string;
}

export interface NavItem {
  label: string;
  href?: string;
  badge?: string;
  subLinks?: SubLink[];
  isDataHub?: boolean;
}

const NAV_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { 
    label: "Club",
    subLinks: [
      { label: "News & Media", href: "/news", icon: Newspaper, description: "Latest updates and press releases" },
      { label: "History & Legends", href: "/history", icon: Shield, description: "Our rich heritage and iconic figures" },
    ]
  },
  { 
    label: "Matches",
    subLinks: [
      { label: "Fixtures & Results", href: "/fixtures", icon: Calendar, description: "Upcoming games and past scores" },
      { label: "Tables", href: "/tables", icon: Trophy, description: "Current league standings" },
    ]
  },
  { 
    label: "Team",
    subLinks: [
      { label: "First Team Squad", href: "/squad", icon: Users, description: "Player profiles and statistics" },
      { label: "Manager", href: "/manager", icon: Shield, description: "Managerial records and tactics" },
      { label: "Transfers", href: "/transfers", icon: ArrowRightLeft, description: "Financial ledgers and player moves" },
    ]
  },
  { 
    label: "Data Hub", 
    href: "/analytics", 
    isDataHub: true,
    badge: "PRO"
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Mobile accordion state
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

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
      onMouseLeave={() => setHoveredCategory(null)}
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
        <nav className="hidden lg:flex flex-1 justify-center items-center gap-2 xl:gap-4">
          {NAV_LINKS.map((link) => {
            const isHovered = hoveredCategory === link.label;
            
            // Check if active (if it's a direct link or if one of its sublinks matches the pathname)
            const isActive = link.href 
              ? pathname === link.href 
              : link.subLinks?.some(sub => pathname === sub.href);

            if (link.isDataHub) {
              return (
                <Link
                  key={link.label}
                  href={link.href!}
                  onMouseEnter={() => setHoveredCategory(link.label)}
                  className="relative group px-5 py-2 rounded-full overflow-hidden ml-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-brand-gold/20 border border-brand-gold/40 group-hover:border-brand-gold/80 transition-colors rounded-full" />
                  <div className="relative z-10 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-brand-gold" />
                    <span className="text-[13px] font-bold uppercase tracking-widest text-white group-hover:text-brand-gold transition-colors">
                      {link.label}
                    </span>
                    {link.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-gold/20 text-brand-gold rounded border border-brand-gold/30">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setHoveredCategory(link.label)}
              >
                {link.href ? (
                  <Link href={link.href} className="block px-4 py-2">
                    <NavLabel label={link.label} isActive={isActive} isHovered={isHovered} />
                  </Link>
                ) : (
                  <button className="px-4 py-2 flex items-center gap-1.5">
                    <NavLabel label={link.label} isActive={isActive} isHovered={isHovered} />
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isHovered ? "rotate-180 text-white" : "text-gray-500"}`} />
                  </button>
                )}

                {/* Desktop Dropdown Mega Menu */}
                {link.subLinks && (
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-72 bg-[#0d0e14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 z-50"
                      >
                        {/* Invisible bridge to prevent hover loss */}
                        <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />
                        
                        <div className="grid grid-cols-1 gap-1">
                          {link.subLinks.map((subLink) => {
                            const isSubActive = pathname === subLink.href;
                            const Icon = subLink.icon;
                            return (
                              <Link
                                key={subLink.label}
                                href={subLink.href}
                                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group ${
                                  isSubActive ? "bg-white/10" : "hover:bg-white/5"
                                }`}
                                onClick={() => setHoveredCategory(null)}
                              >
                                <div className={`p-2 rounded-lg ${isSubActive ? "bg-white/15 text-white" : "bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10"} transition-colors`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-bold tracking-wide ${isSubActive ? "text-white" : "text-gray-200 group-hover:text-white"}`}>
                                    {subLink.label}
                                  </span>
                                  <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                    {subLink.description}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: The 1878 Badge & Mobile Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-shrink-0 items-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/30 tracking-widest">
              EST. 1878
            </span>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0d0e14]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-2 pb-6 mt-4 shadow-2xl overflow-hidden"
          >
            <div className="space-y-2 mt-4">
              {NAV_LINKS.map((link) => {
                const isExpanded = expandedMobileCategory === link.label;
                const isDirectLinkActive = link.href && pathname === link.href;
                
                if (link.isDataHub) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href!}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-900/20 to-brand-gold/10 border border-brand-gold/30 mt-4"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart2 className="w-5 h-5 text-brand-gold" />
                        <span className="font-bold text-white tracking-widest uppercase">{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-gold/20 text-brand-gold rounded border border-brand-gold/30">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                }

                if (link.href && !link.subLinks) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block p-4 rounded-xl font-bold tracking-widest uppercase transition-colors ${
                        isDirectLinkActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <div key={link.label} className="rounded-xl overflow-hidden bg-white/5">
                    <button
                      onClick={() => setExpandedMobileCategory(isExpanded ? null : link.label)}
                      className="w-full flex items-center justify-between p-4 font-bold tracking-widest uppercase text-gray-300"
                    >
                      {link.label}
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180 text-white" : "text-gray-500"}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-black/20"
                        >
                          {link.subLinks?.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            const Icon = sub.icon;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-4 pl-6 transition-colors ${
                                  isSubActive ? "text-white bg-white/5 border-l-2 border-brand-red" : "text-gray-400 hover:text-gray-200"
                                }`}
                              >
                                <Icon className="w-5 h-5 opacity-70" />
                                <span className="text-sm font-semibold tracking-wider">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Helper component for the animated hover label
function NavLabel({ label, isActive, isHovered }: { label: string, isActive: boolean, isHovered: boolean }) {
  return (
    <div className="relative">
      {isHovered && (
        <motion.div
          layoutId="navbar-pill"
          className="absolute -inset-x-3 -inset-y-2 bg-gradient-to-r from-red-600/20 to-red-900/40 border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)] backdrop-blur-md rounded-full -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className={`relative z-10 text-[12px] md:text-[13px] font-bold uppercase tracking-widest transition-colors duration-200 ${
        isActive || isHovered ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-gray-400"
      }`}>
        {label}
      </span>
    </div>
  );
}