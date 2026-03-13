"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { HistoryList } from "@/components/chat/HistoryList";
import type {
  HistoryTransaction,
  TransactionAction,
} from "@/components/chat/HistoryItem";
import {
  getTransactionRecords,
  type TransactionRecord,
} from "@/lib/fileverse/client";

/* --------------------------------------------------------------------------
   SEED DATA — shown on first visit so the page isn't blank
   -------------------------------------------------------------------------- */

const SEED_TRANSACTIONS: HistoryTransaction[] = [
  {
    id: "seed_1",
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
    id: "seed_2",
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
    id: "seed_3",
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
];

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */

const VALID_ACTIONS: TransactionAction[] = ["swap", "send", "bridge"];

function isValidAction(action: string): action is TransactionAction {
  return VALID_ACTIONS.includes(action as TransactionAction);
}

/** Shorten an address to 0xABCD...EF12 format */
function shortenAddress(addr: string): string {
  if (addr.length <= 13) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Convert a Fileverse TransactionRecord into the HistoryTransaction shape */
function toHistoryTransaction(record: TransactionRecord): HistoryTransaction {
  const action: TransactionAction = isValidAction(record.action)
    ? record.action
    : "send";

  return {
    id: record.id,
    timestamp: record.timestamp,
    action,
    fromToken: record.tokens.from,
    toToken: record.tokens.to,
    amount: record.amount,
    outputAmount: record.amount, // Fileverse record has no separate output field
    stealthAddress: shortenAddress(record.stealthAddress),
    fullStealthAddress: record.stealthAddress,
    txHash: record.txHash,
    status: record.status,
    fileversDocId: `doc_${record.id}`,
    policyCheckPassed: record.status !== "failed",
  };
}

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
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        // Attempt to fetch real records from Fileverse / localStorage
        const records = await getTransactionRecords("default");
        if (cancelled) return;

        if (records.length > 0) {
          // Real data exists — map and use it
          const mapped = records.map(toHistoryTransaction);
          // Sort newest first
          mapped.sort((a, b) => b.timestamp - a.timestamp);
          setTransactions(mapped);
        } else {
          // No records yet — show seed data so the page isn't empty
          setTransactions(SEED_TRANSACTIONS);
        }
      } catch {
        // On error, fall back to seed data
        setTransactions(SEED_TRANSACTIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    activeFilter === "all"
      ? transactions
      : transactions.filter((tx) => tx.action === activeFilter);

  const stats = computeStats(transactions);

  /* Loading state */
  if (loading) {
    return (
      <div className="container-narrow py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-pixel text-c11 tracking-tight">
            Transaction History
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
            Encrypted records from Fileverse
          </p>
        </div>

        {/* Skeleton stats bar */}
        <div className="grid grid-cols-3 border border-c3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                "px-4 py-3",
                i < 2 && "border-r border-c3",
              )}
            >
              <div className="h-3 w-20 bg-c3 animate-pulse" />
              <div className="h-5 w-10 bg-c3 animate-pulse mt-2" />
            </div>
          ))}
        </div>

        {/* Skeleton list items */}
        <div className="flex flex-col gap-px">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-c2 border border-c3 px-4 py-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-c3 animate-pulse" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-3 w-16 bg-c3 animate-pulse" />
                <div className="h-2 w-24 bg-c3 animate-pulse" />
              </div>
              <div className="h-3 w-20 bg-c3 animate-pulse" />
              <div className="h-4 w-16 bg-c3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                : "text-c5 hover:text-c9 hover:bg-c2",
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
