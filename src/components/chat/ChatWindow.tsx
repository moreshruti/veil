"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { StealthIllustration } from "@/components/ui/StealthIllustration";

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onApprove?: (messageId: string) => void;
  onReject?: (messageId: string) => void;
  onPromptClick?: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Swap 2 ETH for USDC privately",
  "Swap 0.1 BTC privately",
  "Check my portfolio",
  "Send 100 USDC to vitalik.eth",
] as const;

export function ChatWindow({
  messages,
  isTyping,
  onApprove,
  onReject,
  onPromptClick,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
          <StealthIllustration size={220} />

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-mono text-c7 max-w-xs leading-relaxed">
              Start a conversation. Tell Veil what you need.
            </p>
            <p className="text-[11px] font-mono text-c4">
              Private swaps, stealth transfers, portfolio checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptClick?.(prompt)}
                className={clsx(
                  "px-3 py-2 text-xs font-mono text-c7",
                  "bg-c2 border border-c3",
                  "hover:border-c5 hover:text-c12 hover:bg-c3/50",
                  "transition-all duration-200",
                  "cursor-pointer"
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
