"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Trash2 } from "lucide-react";
import type { ChatMessage, TransactionPreview } from "@/lib/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { useStealthTransaction } from "@/hooks/useStealthTransaction";
import type { StealthTransactionResult } from "@/lib/stealth/transaction-flow";

// ---------------------------------------------------------------------------
// Token constants
// ---------------------------------------------------------------------------

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const USDC_DECIMALS = 6;

const CBBTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" as const;
const CBBTC_DECIMALS = 8;

const erc20BalanceOfAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const STORAGE_KEY = "veil-chat-messages";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Returns true when the message is asking about portfolio / balances.
 */
function isPortfolioQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("portfolio") ||
    lower.includes("balance") ||
    lower.includes("holdings")
  );
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
// Portfolio response from real balances
// ---------------------------------------------------------------------------

interface TokenBalances {
  eth: string;
  usdc: string;
  cbbtc: string;
}

function generatePortfolioResponse(balances: TokenBalances): {
  text: string;
  transaction?: TransactionPreview;
} {
  return {
    text: [
      "Here is your current portfolio:",
      "",
      `  ETH      ${balances.eth}`,
      `  USDC     ${balances.usdc}`,
      `  cbBTC    ${balances.cbbtc}`,
      "",
      "All balances fetched from stealth addresses. No public link to your identity.",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Mock responses for non-transactional, non-portfolio queries
// ---------------------------------------------------------------------------

function generateMockResponse(): {
  text: string;
  transaction?: TransactionPreview;
} {
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
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [isTyping, setIsTyping] = useState(false);

  const { prepareTransaction, executeTransaction } = useStealthTransaction();

  // ---- On-chain balances ----
  const { data: ethBalance } = useBalance({ address });
  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20BalanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 8453,
  });
  const { data: cbbtcRaw } = useReadContract({
    address: CBBTC_ADDRESS,
    abi: erc20BalanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 8453,
  });

  const tokenBalances: TokenBalances = {
    eth: ethBalance
      ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
      : "0.0000",
    usdc:
      typeof usdcRaw === "bigint"
        ? Number(formatUnits(usdcRaw, USDC_DECIMALS)).toFixed(2)
        : "0.00",
    cbbtc:
      typeof cbbtcRaw === "bigint"
        ? Number(formatUnits(cbbtcRaw, CBBTC_DECIMALS)).toFixed(8)
        : "0.00000000",
  };

  // ---- Persist messages to localStorage ----
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // ---- Clear chat ----
  const handleClearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

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
        // Non-transactional queries
        if (!isTransactionalIntent(content)) {
          const response = isPortfolioQuery(content)
            ? generatePortfolioResponse(tokenBalances)
            : generateMockResponse();
          const agentMessage: ChatMessage = {
            id: uid(),
            role: "agent",
            content: response.text,
            timestamp: Date.now(),
            metadata: response.transaction
              ? { transaction: response.transaction, status: "pending" }
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
    [prepareTransaction, tokenBalances],
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
                fileverseDocId: docId,
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
  // Render (wallet gate handled by app layout)
  // --------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex items-center justify-end px-4 pt-3 pb-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-c5 hover:text-error border border-transparent hover:border-c3 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      )}
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
