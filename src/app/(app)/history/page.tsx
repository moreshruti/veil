"use client";

import { useState } from "react";
import clsx from "clsx";
import { HistoryList } from "@/components/chat/HistoryList";
import type {
  HistoryTransaction,
  TransactionAction,
} from "@/components/chat/HistoryItem";

/* --------------------------------------------------------------------------
   MOCK DATA
   -------------------------------------------------------------------------- */

const MOCK_TRANSACTIONS: HistoryTransaction[] = [
  {
    id: "1",
    timestamp: Date.now() - 3_600_000,
    action: "swap",
    fromToken: "ETH",
    toToken: "USDC",
    amount: "2.5 ETH",
    outputAmount: "4,250 USDC",
    stealthAddress: "0x7a3b...f91e",
    fullStealthAddress:
      "0x7a3b4c8d9e2f1a0b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6ef91e",
    txHash:
      "0xabc123def456789012345678901234567890abcdef1234567890abcdef456789",
    status: "confirmed",
    fileversDocId: "fv_doc_001",
    policyCheckPassed: true,
  },
  {
    id: "2",
    timestamp: Date.now() - 7_200_000,
    action: "send",
    fromToken: "USDC",
    toToken: "USDC",
    amount: "1,000 USDC",
    outputAmount: "1,000 USDC",
    stealthAddress: "0x9c2d...a3b7",
    fullStealthAddress:
      "0x9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a3b7",
    txHash:
      "0xdef789abc123456789012345678901234567890abcdef1234567890abc123456",
    status: "confirmed",
    fileversDocId: "fv_doc_002",
    policyCheckPassed: true,
  },
  {
    id: "3",
    timestamp: Date.now() - 14_400_000,
    action: "bridge",
    fromToken: "ETH",
    toToken: "ETH",
    amount: "1.0 ETH",
    outputAmount: "0.998 ETH",
    stealthAddress: "0x5e1f...c8d2",
    fullStealthAddress:
      "0x5e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c8d2",
    txHash:
      "0x456789def123abc789012345678901234567890abcdef1234567890def789abc",
    status: "pending",
    fileversDocId: "fv_doc_003",
    policyCheckPassed: true,
  },
  {
    id: "4",
    timestamp: Date.now() - 43_200_000,
    action: "swap",
    fromToken: "USDC",
    toToken: "DAI",
    amount: "5,000 USDC",
    outputAmount: "4,998 DAI",
    stealthAddress: "0x3a4b...e7f1",
    fullStealthAddress:
      "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e7f1",
    txHash:
      "0x789abcdef123456789012345678901234567890abcdef1234567890789abcdef",
    status: "confirmed",
    fileversDocId: "fv_doc_004",
    policyCheckPassed: true,
  },
  {
    id: "5",
    timestamp: Date.now() - 86_400_000,
    action: "send",
    fromToken: "ETH",
    toToken: "ETH",
    amount: "0.5 ETH",
    outputAmount: "0.5 ETH",
    stealthAddress: "0x8b9c...d2e3",
    fullStealthAddress:
      "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6d2e3",
    txHash:
      "0xabcdef123456789012345678901234567890abcdef1234567890abcdef123456",
    status: "failed",
    fileversDocId: "fv_doc_005",
    policyCheckPassed: false,
  },
  {
    id: "6",
    timestamp: Date.now() - 172_800_000,
    action: "swap",
    fromToken: "cbBTC",
    toToken: "USDC",
    amount: "0.5 cbBTC",
    outputAmount: "48,250 USDC",
    stealthAddress: "0x1d2e...f4a5",
    fullStealthAddress:
      "0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9f4a5",
    txHash:
      "0x123456789abcdef012345678901234567890abcdef1234567890123456789abc",
    status: "confirmed",
    fileversDocId: "fv_doc_006",
    policyCheckPassed: true,
  },
  {
    id: "8",
    timestamp: Date.now() - 345_600_000,
    action: "swap",
    fromToken: "ETH",
    toToken: "cbBTC",
    amount: "5.0 ETH",
    outputAmount: "0.199 cbBTC",
    stealthAddress: "0x2e3f...b5c6",
    fullStealthAddress:
      "0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b5c6",
    txHash:
      "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    status: "confirmed",
    fileversDocId: "fv_doc_008",
    policyCheckPassed: true,
  },
  {
    id: "7",
    timestamp: Date.now() - 259_200_000,
    action: "bridge",
    fromToken: "USDC",
    toToken: "USDC",
    amount: "2,500 USDC",
    outputAmount: "2,497 USDC",
    stealthAddress: "0x7a3b...f91e",
    fullStealthAddress:
      "0x7a3b4c8d9e2f1a0b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6ef91e",
    txHash:
      "0xfedcba987654321009876543210fedcba987654321009876543210fedcba9876",
    status: "confirmed",
    fileversDocId: "fv_doc_007",
    policyCheckPassed: true,
  },
];

/* --------------------------------------------------------------------------
   FILTER TYPES
   -------------------------------------------------------------------------- */

type FilterTab = "all" | TransactionAction;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "swap", label: "Swaps" },
  { key: "send", label: "Sends" },
  { key: "bridge", label: "Bridges" },
];

/* --------------------------------------------------------------------------
   STATS
   -------------------------------------------------------------------------- */

function computeStats(txs: HistoryTransaction[]) {
  const uniqueAddresses = new Set(txs.map((tx) => tx.fullStealthAddress));

  return {
    total: txs.length,
    volume: `${txs.length} ops`,
    uniqueAddresses: uniqueAddresses.size,
  };
}

/* --------------------------------------------------------------------------
   PAGE
   -------------------------------------------------------------------------- */

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered =
    activeFilter === "all"
      ? MOCK_TRANSACTIONS
      : MOCK_TRANSACTIONS.filter((tx) => tx.action === activeFilter);

  const stats = computeStats(MOCK_TRANSACTIONS);

  return (
    <div className="container-narrow py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-pixel text-c11 tracking-tight">
          Transaction History
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
          Encrypted records from Fileverse
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 border border-c3">
        <div className="px-4 py-3 border-r border-c3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
            Transactions
          </p>
          <p className="text-lg text-c12 font-mono tabular-nums mt-1">
            {stats.total}
          </p>
        </div>
        <div className="px-4 py-3 border-r border-c3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
            Total Volume
          </p>
          <p className="text-lg text-c12 font-mono tabular-nums mt-1">
            {stats.volume}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
            Stealth Addrs
          </p>
          <p className="text-lg text-c12 font-mono tabular-nums mt-1">
            {stats.uniqueAddresses}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border border-c3 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={clsx(
              "px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer",
              activeFilter === tab.key
                ? "bg-c3 text-c12"
                : "text-c5 hover:text-c9 hover:bg-c2"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <HistoryList transactions={filtered} />
    </div>
  );
}
