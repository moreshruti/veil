"use client";

import { useState, useCallback } from "react";
import clsx from "clsx";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/wallet/WalletButton";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
] as const;

function smoothScroll(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function NavbarCTA() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/chat"
          className={clsx(
            "inline-flex items-center justify-center",
            "h-9 px-4 text-sm",
            "font-medium font-mono",
            "transition-all duration-150 ease-out",
            "cursor-pointer select-none",
            "bg-zinc-200 text-zinc-950",
            "border border-zinc-400/50",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.2)]",
            "hover:bg-zinc-100 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-1px_0_0_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.15)]"
          )}
        >
          Open App
        </Link>
        <WalletButton />
      </div>
    );
  }

  return <WalletButton />;
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      smoothScroll(href);
      setMobileOpen(false);
    },
    []
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-c1/80 backdrop-blur-xl border-b border-c3">
      <div className="max-w-[960px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="font-semibold text-c12 font-mono text-base tracking-tight">
          Veil
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-mono text-c9 transition-colors duration-150 hover:text-c12"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <NavbarCTA />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-c9 hover:text-c12 transition-colors cursor-pointer"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-c1/95 backdrop-blur-xl border-b border-c3">
          <div className="max-w-[960px] mx-auto px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-mono text-c9 py-2 transition-colors duration-150 hover:text-c12"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-c3">
              <NavbarCTA />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
