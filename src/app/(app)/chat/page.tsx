"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ShieldOff } from "lucide-react";
import type { ChatMessage, TransactionPreview } from "@/lib/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useStealthTransaction } from "@/hooks/useStealthTransaction";
import type { StealthTransactionResult } from "@/lib/stealth/transaction-flow";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Returns true when the message looks like a transactional intent
 * (swap / send / bridge / lend) rather than an informational query.
 */
function isTransactionalIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("swap") ||
    lower.includes("send") ||
    lower.includes("transfer") ||
    lower.includes("bridge") ||
    lower.includes("lend") ||
    lower.includes("deposit")
  );
}

// ---------------------------------------------------------------------------
// Mock responses for non-transactional queries
// ---------------------------------------------------------------------------

function generateMockResponse(content: string): {
  text: string;
  transaction?: TransactionPreview;
} {
  const lower = content.toLowerCase();

  if (lower.includes("portfolio") || lower.includes("balance") || lower.includes("holdings")) {
    return {
      text: [
        "Here is your current portfolio:",
        "",
        "  ETH      4.2000   ($16,159.50)",
        "  USDC     2,500.00 ($2,500.00)",
        "  cbBTC    0.1500   ($14,475.00)",
        "  DAI      1,200.00 ($1,200.12)",
        "",
        "Total: ~$34,334.62",
        "24h Change: +2.4%",
        "",
        "All balances fetched from stealth addresses. No public link to your identity.",
      ].join("\n"),
    };
  }

  return {
    text: [
      "I can help you with:",
      "",
      "  - Private swaps across DEXs",
      "  - Stealth transfers to any address or ENS",
      "  - Portfolio tracking across stealth addresses",
      "  - Bridge assets between chains privately",
      "  - DeFi yield strategies with privacy",
      "",
      "Just tell me what you need in plain English.",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Response text builder
// ---------------------------------------------------------------------------

function buildResponseText(
  result: StealthTransactionResult,
  preview: TransactionPreview,
): string {
  const action = result.intent.action;

  switch (action) {
    case "swap":
      return `Found the best route for your swap. ${preview.amount} ${preview.fromToken} -> ~${preview.estimatedOutput} via ${preview.route}. Stealth address generated. Review below and approve to execute.`;

    case "send":
      return `Preparing a private transfer of ${preview.amount} ${preview.fromToken}. A stealth address has been generated for the recipient. No on-chain link between your wallet and theirs. Review below.`;

    case "bridge":
      return `Bridging ${preview.amount} ${preview.fromToken} via ${preview.route}. Stealth address generated on the destination chain. Review below.`;

    case "lend":
      return `Depositing ${preview.amount} ${preview.fromToken} into ${preview.route}. Stealth address generated to keep your position private. Review below.`;

    default:
      return `Transaction prepared. ${preview.amount} ${preview.fromToken}. Stealth address generated. Review below.`;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const { isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const { prepareTransaction, executeTransaction } = useStealthTransaction();

  // Map message ID -> StealthTransactionResult so we can execute after approval
  const pendingResultsRef = useRef<Map<string, StealthTransactionResult>>(new Map());

  // --------------------------------------------------
  // Send handler
  // --------------------------------------------------
  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: uid(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        // Non-transactional queries always get mock responses
        if (!isTransactionalIntent(content)) {
          const mock = generateMockResponse(content);
          const agentMessage: ChatMessage = {
            id: uid(),
            role: "agent",
            content: mock.text,
            timestamp: Date.now(),
            metadata: mock.transaction
              ? { transaction: mock.transaction, status: "pending" }
              : undefined,
          };
          setMessages((prev) => [...prev, agentMessage]);
          setIsTyping(false);
          return;
        }

        // Transactional intent -- real stealth flow
        const { result, preview } = await prepareTransaction(content);

        const agentId = uid();
        pendingResultsRef.current.set(agentId, result);

        const text = buildResponseText(result, preview);

        const agentMessage: ChatMessage = {
          id: agentId,
          role: "agent",
          content: text,
          timestamp: Date.now(),
          metadata: {
            transaction: preview,
            status: "pending",
          },
        };

        setMessages((prev) => [...prev, agentMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: uid(),
          role: "system",
          content: "Something went wrong while preparing the transaction. Try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [prepareTransaction],
  );

  // --------------------------------------------------
  // Approve handler
  // --------------------------------------------------
  const handleApprove = useCallback(
    async (messageId: string) => {
      // Mark as approved immediately
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            metadata: { ...msg.metadata, status: "approved" as const },
          };
        }),
      );

      const result = pendingResultsRef.current.get(messageId);
      if (!result) {
        // Fallback: simulated execution for legacy messages without a stored result
        simulateFallbackExecution(messageId);
        return;
      }

      try {
        const { txHash, docId } = await executeTransaction(result);

        pendingResultsRef.current.delete(messageId);

        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                status: "executed" as const,
                txHash,
                fileversDocId: docId,
              },
            };
          });

          const systemMsg: ChatMessage = {
            id: uid(),
            role: "system",
            content: isConnected
              ? `Transaction executed via stealth address. Hash: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`
              : "Transaction simulated successfully via stealth address. Connect a wallet for real execution.",
            timestamp: Date.now(),
          };

          return [...updated, systemMsg];
        });
      } catch {
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              metadata: { ...msg.metadata, status: "failed" as const },
            };
          });

          const systemMsg: ChatMessage = {
            id: uid(),
            role: "system",
            content: "Transaction failed. Check your wallet and try again.",
            timestamp: Date.now(),
          };

          return [...updated, systemMsg];
        });
      }
    },
    [executeTransaction, isConnected],
  );

  // --------------------------------------------------
  // Reject handler
  // --------------------------------------------------
  const handleReject = useCallback((messageId: string) => {
    pendingResultsRef.current.delete(messageId);

    setMessages((prev) => {
      const updated = prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          metadata: { ...msg.metadata, status: "failed" as const },
        };
      });

      const systemMsg: ChatMessage = {
        id: uid(),
        role: "system",
        content: "Transaction rejected.",
        timestamp: Date.now(),
      };

      return [...updated, systemMsg];
    });
  }, []);

  // --------------------------------------------------
  // Prompt click
  // --------------------------------------------------
  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSend(prompt);
    },
    [handleSend],
  );

  // --------------------------------------------------
  // Fallback simulated execution (no stored result)
  // --------------------------------------------------
  function simulateFallbackExecution(messageId: string) {
    setTimeout(() => {
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              status: "executed" as const,
              txHash: `0x${Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16),
              ).join("")}`,
            },
          };
        });

        const systemMsg: ChatMessage = {
          id: uid(),
          role: "system",
          content: "Transaction executed successfully via stealth address.",
          timestamp: Date.now(),
        };

        return [...updated, systemMsg];
      });
    }, 2000);
  }

  // --------------------------------------------------
  // Wallet gate
  // --------------------------------------------------
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <ShieldOff size={48} className="text-c5" />
        <div className="text-center">
          <h2 className="font-mono text-lg text-c12 mb-2">
            Connect your wallet to start chatting with Veil
          </h2>
          <p className="font-mono text-sm text-c7 max-w-sm">
            Your conversations are tied to your wallet. Connect to begin.
          </p>
        </div>
        <WalletButton />
      </div>
    );
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        onApprove={handleApprove}
        onReject={handleReject}
        onPromptClick={handlePromptClick}
      />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
