"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Send,
  GitBranch,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Shield,
} from "lucide-react";

export type TransactionStatus = "confirmed" | "pending" | "failed";
export type TransactionAction = "swap" | "send" | "bridge";

export interface HistoryTransaction {
  id: string;
  timestamp: number;
  action: TransactionAction;
  fromToken: string;
  toToken: string;
  amount: string;
  outputAmount: string;
  stealthAddress: string;
  fullStealthAddress: string;
  txHash: string;
  status: TransactionStatus;
  fileverseDocId: string;
  policyCheckPassed: boolean;
}

const ACTION_ICONS: Record<TransactionAction, typeof ArrowLeftRight> = {
  swap: ArrowLeftRight,
  send: Send,
  bridge: GitBranch,
};

const ACTION_LABELS: Record<TransactionAction, string> = {
  swap: "Swap",
  send: "Send",
  bridge: "Bridge",
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  confirmed: "text-success border-success",
  pending: "text-warning border-warning",
  failed: "text-error border-error",
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatFullDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface HistoryItemProps {
  transaction: HistoryTransaction;
}

export function HistoryItem({ transaction }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const Icon = ACTION_ICONS[transaction.action];

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(transaction.fullStealthAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(transaction.txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="bg-c2 border border-c3 font-mono transition-colors duration-150 hover:border-c4">
      {/* Top row -- always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer"
      >
        {/* Action icon */}
        <div className="shrink-0 w-8 h-8 border border-c3 flex items-center justify-center">
          <Icon size={14} className="text-c9" />
        </div>

        {/* Action + date */}
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-xs text-c11 uppercase tracking-widest">
            {ACTION_LABELS[transaction.action]}
          </span>
          <span className="text-[10px] text-c5">{formatDate(transaction.timestamp)}</span>
        </div>

        {/* Amount */}
        <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-xs text-c12 tabular-nums">{transaction.amount}</span>
          <span className="text-[10px] text-c7 tabular-nums">
            {transaction.outputAmount}
          </span>
        </div>

        {/* Status badge */}
        <span
          className={clsx(
            "text-[10px] uppercase tracking-widest px-2 py-0.5 border shrink-0",
            STATUS_STYLES[transaction.status]
          )}
        >
          {transaction.status}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={clsx(
            "text-c5 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-c3 px-4 py-3 space-y-2.5">
          {/* From / To tokens */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">From</span>
            <span className="text-c9">{transaction.fromToken}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">To</span>
            <span className="text-c9">{transaction.toToken}</span>
          </div>

          {/* Stealth address */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">Stealth Address</span>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-c9 hover:text-c12 transition-colors cursor-pointer"
            >
              <span className="tabular-nums">{transaction.stealthAddress}</span>
              {copiedAddress ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          {/* Tx hash */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">Tx Hash</span>
            <div className="flex items-center gap-1.5">
              <a
                href={`https://basescan.org/tx/${transaction.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <span className="tabular-nums">
                  {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-6)}
                </span>
                <ExternalLink size={10} />
              </a>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-c5 hover:text-c12 transition-colors cursor-pointer"
              >
                {copiedHash ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          {/* Fileverse doc */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">Fileverse Record</span>
            <a
              href={`https://portal.fileverse.io/#/doc/${transaction.fileverseDocId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <span>{transaction.fileverseDocId}</span>
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Full timestamp */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5">Timestamp</span>
            <span className="text-c9">{formatFullDate(transaction.timestamp)}</span>
          </div>

          {/* Policy check */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-c5 flex items-center gap-1">
              <Shield size={12} />
              Policy Check
            </span>
            <span
              className={clsx(
                "text-[10px] uppercase tracking-widest",
                transaction.policyCheckPassed ? "text-success" : "text-error"
              )}
            >
              {transaction.policyCheckPassed ? "PASSED" : "FAILED"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
