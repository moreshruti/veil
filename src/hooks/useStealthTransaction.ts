"use client";

import { useState, useCallback } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import {
  prepareStealthTransaction,
  buildTransaction,
  recordTransaction,
  toTransactionPreview,
  type StealthTransactionResult,
} from "@/lib/stealth/transaction-flow";
import { approveTransaction as bitgoApprove } from "@/lib/bitgo/client";
import type { TransactionPreview } from "@/lib/types";

// ---------------------------------------------------------------------------
// Simulated tx hash generator (used when wallet is not connected)
// ---------------------------------------------------------------------------

function simulatedTxHash(): string {
  const hex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `0x${hex}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStealthTransaction() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StealthTransactionResult | null>(null);

  // --------------------------------------------------
  // Step A: Prepare (parse intent + stealth address)
  // --------------------------------------------------
  const prepareTransaction = useCallback(
    async (
      message: string,
    ): Promise<{
      result: StealthTransactionResult;
      preview: TransactionPreview;
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        const userAddress = address ?? "0x0000000000000000000000000000000000000000";

        const result = await prepareStealthTransaction({
          userAddress,
          message,
        });

        setLastResult(result);
        const preview = toTransactionPreview(result);

        return { result, preview };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to prepare transaction";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address],
  );

  // --------------------------------------------------
  // Step B: Execute (sign + broadcast or simulate)
  // --------------------------------------------------
  const executeTransaction = useCallback(
    async (
      result: StealthTransactionResult,
    ): Promise<{ txHash: string; docId: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const userAddress = address ?? "0x0000000000000000000000000000000000000000";
        let txHash: string;

        if (isConnected && address) {
          // Build actual calldata and send via wallet
          const unsignedTx = await buildTransaction(result, address);

          txHash = await sendTransactionAsync({
            to: unsignedTx.to as `0x${string}`,
            data: unsignedTx.data,
            value: unsignedTx.value,
          });
        } else {
          // Simulated execution when no wallet is connected
          // Adds a small delay to mimic on-chain confirmation
          await new Promise((resolve) => setTimeout(resolve, 1500));
          txHash = simulatedTxHash();
        }

        // Complete BitGo approval flow if a proposal was created during preparation.
        // The client falls back to mocks when BITGO_ACCESS_TOKEN is unset.
        if (result.bitgoProposalId) {
          await bitgoApprove(userAddress, result.bitgoProposalId, txHash);
        }

        // Record to Fileverse
        const { docId } = await recordTransaction(result, txHash, userAddress);

        return { txHash, docId };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction execution failed";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, sendTransactionAsync],
  );

  return {
    prepareTransaction,
    executeTransaction,
    isLoading,
    error,
    lastResult,
  };
}
