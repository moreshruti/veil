import { ArrowUpRight } from "lucide-react";

const LINKS = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Docs", href: "#" },
  { label: "X", href: "https://x.com" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-c3 bg-c1">
      <div className="max-w-[960px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-c12 font-mono text-base tracking-tight">
              Veil
            </span>
            <span className="text-xs font-mono text-c8 uppercase tracking-widest">
              ETHMumbai 2026
            </span>
            <p className="text-sm font-mono text-c9 max-w-xs leading-relaxed mt-1">
              Your finances should be private by default.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-3 md:items-end">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-mono text-c9 transition-colors duration-150 hover:text-c12"
              >
                {link.label}
                <ArrowUpRight size={14} className="text-c7" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-c3">
        <div className="max-w-[960px] mx-auto px-6 py-4">
          <p className="text-xs font-mono text-c7">
            {new Date().getFullYear()} Veil. Built for ETHMumbai.
          </p>
        </div>
      </div>
    </footer>
  );
}
