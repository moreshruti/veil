"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    fileverseDocId: `doc_${record.id}`,
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
        const records = await getTransactionRecords();
        if (cancelled) return;

        // Map and sort newest first
        const mapped = records
          .map(toHistoryTransaction)
          .sort((a, b) => b.timestamp - a.timestamp);

        setTransactions(mapped);
      } catch {
        // On error, show empty state
        setTransactions([]);
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

  /* Empty state */
  if (transactions.length === 0) {
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

        <div className="border border-c3 bg-c2 px-6 py-16 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border border-c3 flex items-center justify-center">
            <span className="text-c5 text-lg font-mono">/</span>
          </div>
          <p className="text-sm text-c7 font-mono text-center">
            No transactions yet.
          </p>
          <Link
            href="/chat"
            className="text-xs font-mono uppercase tracking-widest text-accent hover:underline transition-colors"
          >
            Start a conversation with Veil
          </Link>
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
