"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import clsx from "clsx";
import Link from "next/link";
import {
  MessageSquare,
  History,
  Settings,
  ArrowLeft,
  Plus,
  PanelLeftClose,
  PanelLeft,
  ShieldOff,
} from "lucide-react";
import { WalletInfo } from "@/components/wallet/WalletInfo";
import { WalletButton } from "@/components/wallet/WalletButton";

const NAV_ITEMS = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

function ConnectGate() {
  const { isConnected } = useAccount();
  if (isConnected) return null;
  return (
    <div className="mt-2">
      <WalletButton />
    </div>
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(false);
  const { isConnected } = useAccount();

  return (
    <div className="flex h-screen overflow-hidden bg-c1">
      {/* Sidebar */}
      <aside
        className={clsx(
          "shrink-0 flex flex-col border-r border-c3 bg-c1 transition-all duration-200 overflow-hidden",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo + Collapse toggle */}
        <div className={clsx(
          "flex items-center h-14 border-b border-c3",
          collapsed ? "justify-center" : "justify-between px-4"
        )}>
          {!collapsed && (
            <span className="font-semibold text-c12 font-mono text-base tracking-tight">
              Veil
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="text-c5 hover:text-c12 transition-colors cursor-pointer p-1"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 py-3">
          <Link
            href="/chat"
            className={clsx(
              "flex items-center gap-2 py-2.5",
              "bg-c2 border border-c3 text-c9 font-mono text-xs",
              "hover:border-c4 hover:text-c12 transition-colors",
              collapsed ? "justify-center px-2.5" : "px-3"
            )}
          >
            <Plus size={18} />
            {!collapsed && <span>New Chat</span>}
          </Link>
        </div>

        {/* Wallet */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <WalletInfo />
            <ConnectGate />
          </div>
        )}
        {collapsed && (
          <div className="px-3 pb-3 flex justify-center">
            <WalletButton compact />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 py-2.5",
                "text-sm font-mono text-c7",
                "hover:text-c12 hover:bg-c2 transition-colors",
                collapsed ? "justify-center px-0" : "px-3"
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Back to Home */}
        <div className="px-3 py-3 border-t border-c3">
          <Link
            href="/"
            className={clsx(
              "flex items-center gap-2 py-2",
              "text-xs font-mono text-c5",
              "hover:text-c12 transition-colors",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <ArrowLeft size={18} />
            {!collapsed && <span>Back to Home</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isConnected ? (
          children
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            <ShieldOff size={48} className="text-c5" />
            <div className="text-center">
              <h2 className="font-mono text-lg text-c12 mb-2">
                Connect your wallet
              </h2>
              <p className="font-mono text-sm text-c7 max-w-sm">
                Veil requires a wallet connection to operate. Your keys, your
                privacy, your agent.
              </p>
            </div>
            <WalletButton />
          </div>
        )}
      </main>
    </div>
  );
}
