"use client";

import { useState } from "react";
import clsx from "clsx";
import { Copy, Check, ArrowRight, Shield, Fuel } from "lucide-react";
import type { TransactionPreview } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface TransactionCardProps {
  transaction: TransactionPreview;
  status?: "pending" | "approved" | "executed" | "failed";
  onApprove?: () => void;
  onReject?: () => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseLimitValue(value: string): number {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

export function TransactionCard({
  transaction,
  status = "pending",
  onApprove,
  onReject,
}: TransactionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.stealthAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const spent = parseLimitValue(transaction.policyCheck.spent);
  const limit = parseLimitValue(transaction.policyCheck.dailyLimit);
  const progressPercent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className="bg-c2 border border-c3 font-mono w-full max-w-md mt-2">
      {/* Header */}
      <div className="px-4 py-3 border-b border-c3 flex items-center justify-between">
        <span className="text-xs text-c5 uppercase tracking-widest">
          Transaction Preview
        </span>
        <span
          className={clsx(
            "text-[10px] uppercase tracking-widest px-2 py-0.5 border",
            status === "pending" && "text-warning border-warning",
            status === "approved" && "text-accent border-accent",
            status === "executed" && "text-success border-success",
            status === "failed" && "text-error border-error"
          )}
        >
          {status}
        </span>
      </div>

      {/* Action + Tokens */}
      <div className="px-4 py-3 border-b border-c3">
        <p className="text-c11 text-sm font-semibold uppercase">
          {transaction.action}
        </p>
        <div className="flex items-center gap-2 mt-2 text-c12 text-sm">
          <span>
            {transaction.amount} {transaction.fromToken}
          </span>
          <ArrowRight size={14} className="text-c5" />
          <span>
            ~{transaction.estimatedOutput} {transaction.toToken}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 border-b border-c3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-c5">Route</span>
          <span className="text-c9">{transaction.route}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-c5 flex items-center gap-1">
            <Fuel size={12} />
            Gas Fee
          </span>
          <span className="text-c9">{transaction.gasFee}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-c5">Stealth Address</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-c9 hover:text-c12 transition-colors cursor-pointer"
          >
            <span>{truncateAddress(transaction.stealthAddress)}</span>
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Policy Check */}
      <div className="px-4 py-3 border-b border-c3">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield
            size={12}
            className={clsx(
              transaction.policyCheck.passed ? "text-success" : "text-error"
            )}
          />
          <span className="text-xs text-c5 uppercase tracking-widest">
            Policy Check
          </span>
          <span
            className={clsx(
              "text-[10px] ml-auto",
              transaction.policyCheck.passed ? "text-success" : "text-error"
            )}
          >
            {transaction.policyCheck.passed ? "PASSED" : "FAILED"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-c3 mb-1.5">
          <div
            className={clsx(
              "h-full transition-all duration-300",
              progressPercent > 80 ? "bg-warning" : "bg-accent"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-c5">
          <span>
            Spent: {transaction.policyCheck.spent} / {transaction.policyCheck.dailyLimit}
          </span>
          <span>Remaining: {transaction.policyCheck.remaining}</span>
        </div>
      </div>

      {/* Action buttons */}
      {status === "pending" && (
        <div className="px-4 py-3 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={onApprove}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
