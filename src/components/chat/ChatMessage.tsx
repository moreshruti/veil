"use client";

import clsx from "clsx";
import { CheckCircle, ExternalLink } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { TransactionCard } from "./TransactionCard";

interface ChatMessageProps {
  message: ChatMessageType;
  onApprove?: (messageId: string) => void;
  onReject?: (messageId: string) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ChatMessageBubble({
  message,
  onApprove,
  onReject,
}: ChatMessageProps) {
  const { role, content, timestamp, metadata } = message;

  if (role === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-c5 font-mono italic">{content}</span>
      </div>
    );
  }

  const isUser = role === "user";
  const isExecuted = metadata?.status === "executed";

  return (
    <div
      className={clsx(
        "flex flex-col gap-1 max-w-[85%] md:max-w-[70%]",
        isUser ? "self-end items-end" : "self-start items-start"
      )}
    >
      {/* Bubble */}
      <div
        className={clsx(
          "px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser && "bg-c3 text-c12",
          !isUser && "bg-c2 border border-c3 text-c11"
        )}
      >
        {content}
      </div>

      {/* Transaction card (agent messages only) */}
      {!isUser && metadata?.transaction && (
        <TransactionCard
          transaction={metadata.transaction}
          status={metadata.status}
          onApprove={onApprove ? () => onApprove(message.id) : undefined}
          onReject={onReject ? () => onReject(message.id) : undefined}
        />
      )}

      {/* Executed badge + tx hash */}
      {isExecuted && metadata?.txHash && (
        <div className="flex items-center gap-1.5 mt-1">
          <CheckCircle size={12} className="text-success" />
          <a
            href={`https://basescan.org/tx/${metadata.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-success hover:underline"
          >
            {metadata.txHash.slice(0, 10)}...{metadata.txHash.slice(-6)}
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* Timestamp */}
      <span className="text-[10px] text-c5 font-mono">
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
