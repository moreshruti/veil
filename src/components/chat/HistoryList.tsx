"use client";

import { HistoryItem, type HistoryTransaction } from "./HistoryItem";

interface HistoryListProps {
  transactions: HistoryTransaction[];
}

export function HistoryList({ transactions }: HistoryListProps) {
  if (transactions.length === 0) {
    return (
      <div className="border border-c3 bg-c2 px-6 py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border border-c3 flex items-center justify-center">
          <span className="text-c5 text-lg font-mono">/</span>
        </div>
        <p className="text-sm text-c7 font-mono text-center">
          No transactions yet.
        </p>
        <p className="text-xs text-c5 font-mono text-center">
          Start a conversation with Veil.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px">
      {transactions.map((tx) => (
        <HistoryItem key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
