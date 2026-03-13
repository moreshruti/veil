"use client";

import { useState, useRef, useEffect } from "react";
import {
  useAccount,
  useEnsName,
  useEnsAvatar,
  useDisconnect,
} from "wagmi";
import { mainnet, base, baseSepolia } from "wagmi/chains";
import { useModal } from "connectkit";
import { Copy, ExternalLink, LogOut, ChevronDown, Wallet } from "lucide-react";
import clsx from "clsx";
import { formatAddress } from "@/lib/ens/resolve";
import type { Address } from "viem";

function NetworkBadge({ chainId }: { chainId: number | undefined }) {
  const isBase = chainId === base.id || chainId === baseSepolia.id;
  const label =
    chainId === base.id
      ? "Base"
      : chainId === baseSepolia.id
        ? "Sepolia"
        : "Wrong Network";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5",
        "font-mono text-[10px] uppercase tracking-widest",
        "border",
        isBase
          ? "border-success/30 text-success"
          : "border-error/30 text-error"
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5",
          isBase ? "bg-success" : "bg-error"
        )}
      />
      {label}
    </span>
  );
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: mainnet.id,
  });
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isConnected || !address) {
    if (compact) {
      return (
        <button
          onClick={() => setOpen(true)}
          className={clsx(
            "inline-flex items-center justify-center",
            "w-8 h-8",
            "transition-all duration-150 ease-out",
            "cursor-pointer select-none",
            "bg-zinc-200 text-zinc-950",
            "border border-zinc-400/50",
            "hover:bg-zinc-100"
          )}
          aria-label="Connect Wallet"
        >
          <Wallet size={14} />
        </button>
      );
    }
    return (
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center justify-center",
          "h-9 px-4 text-sm gap-2",
          "font-medium font-mono",
          "transition-all duration-150 ease-out",
          "cursor-pointer select-none",
          "bg-zinc-200 text-zinc-950",
          "border border-zinc-400/50",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.2)]",
          "hover:bg-zinc-100 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-1px_0_0_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.15)]",
          "active:bg-zinc-300 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"
        )}
      >
        Connect Wallet
      </button>
    );
  }

  const displayName = formatAddress(address, ensName ?? undefined);

  if (compact) {
    return (
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={clsx(
          "inline-flex items-center justify-center",
          "w-8 h-8",
          "bg-c2 border border-c3",
          "transition-all duration-150 ease-out",
          "cursor-pointer select-none",
          "hover:bg-c3 hover:border-c4"
        )}
        aria-label={displayName}
      >
        {ensAvatar ? (
          <img src={ensAvatar} alt={displayName} className="w-5 h-5 object-cover" />
        ) : (
          <span className="w-5 h-5 bg-accent/20 border border-accent/40" />
        )}
      </button>
    );
  }

  function handleCopy() {
    if (address) navigator.clipboard.writeText(address);
    setDropdownOpen(false);
  }

  function handleBaseScan() {
    const baseUrl =
      chain?.id === baseSepolia.id
        ? "https://sepolia.basescan.org"
        : "https://basescan.org";
    window.open(`${baseUrl}/address/${address}`, "_blank");
    setDropdownOpen(false);
  }

  function handleDisconnect() {
    disconnect();
    setDropdownOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={clsx(
          "inline-flex items-center gap-2",
          "h-9 px-3",
          "font-mono text-sm text-c12",
          "bg-c2 border border-c3",
          "transition-all duration-150 ease-out",
          "cursor-pointer select-none",
          "hover:bg-c3 hover:border-c4"
        )}
      >
        {ensAvatar ? (
          <img
            src={ensAvatar}
            alt={displayName}
            className="w-5 h-5 object-cover"
          />
        ) : (
          <span className="w-5 h-5 bg-accent/20 border border-accent/40" />
        )}
        <span className="max-w-[120px] truncate">{displayName}</span>
        <NetworkBadge chainId={chain?.id} />
        <ChevronDown
          size={14}
          className={clsx(
            "text-c7 transition-transform duration-150",
            dropdownOpen && "rotate-180"
          )}
        />
      </button>

      {dropdownOpen && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-1 z-50",
            "w-56 py-1",
            "bg-c2 border border-c3",
            "shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          )}
        >
          <button
            onClick={handleCopy}
            className={clsx(
              "w-full flex items-center gap-2.5 px-3 py-2",
              "font-mono text-xs text-c9",
              "transition-colors duration-100",
              "hover:bg-c3 hover:text-c12",
              "cursor-pointer"
            )}
          >
            <Copy size={14} />
            Copy Address
          </button>
          <button
            onClick={handleBaseScan}
            className={clsx(
              "w-full flex items-center gap-2.5 px-3 py-2",
              "font-mono text-xs text-c9",
              "transition-colors duration-100",
              "hover:bg-c3 hover:text-c12",
              "cursor-pointer"
            )}
          >
            <ExternalLink size={14} />
            View on BaseScan
          </button>
          <div className="my-1 border-t border-c3" />
          <button
            onClick={handleDisconnect}
            className={clsx(
              "w-full flex items-center gap-2.5 px-3 py-2",
              "font-mono text-xs text-error",
              "transition-colors duration-100",
              "hover:bg-error/10",
              "cursor-pointer"
            )}
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
