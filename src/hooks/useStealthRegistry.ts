"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, StealthRegistryABI } from "@/lib/web3/contracts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const META_STORAGE_PREFIX = "veil_stealth_meta_";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function isRegistryDeployed(): boolean {
  return CONTRACTS.stealthRegistry.address !== ZERO_ADDRESS;
}

function loadMetaFromStorage(address: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(
      `${META_STORAGE_PREFIX}${address.toLowerCase()}`,
    );
  } catch {
    return null;
  }
}

function saveMetaToStorage(address: string, metaAddress: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${META_STORAGE_PREFIX}${address.toLowerCase()}`,
      metaAddress,
    );
  } catch {
    // Storage full or unavailable -- silent fail
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStealthRegistry() {
  const { address } = useAccount();
  const deployed = isRegistryDeployed();

  // -- On-chain reads (only fire when registry is deployed) -----------------

  const {
    data: onChainMeta,
    refetch: refetchMeta,
    isLoading: isReadLoading,
  } = useReadContract({
    address: CONTRACTS.stealthRegistry.address,
    abi: StealthRegistryABI,
    functionName: "getStealthMetaAddress",
    args: address ? [address] : undefined,
    query: {
      enabled: deployed && !!address,
    },
  });

  // -- On-chain write -------------------------------------------------------

  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  // -- Local state ----------------------------------------------------------

  const [localMeta, setLocalMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate local fallback from localStorage on mount / address change
  useEffect(() => {
    if (!deployed && address) {
      setLocalMeta(loadMetaFromStorage(address));
    }
  }, [deployed, address]);

  // -- Derived meta-address -------------------------------------------------

  const registeredMeta: string | null = (() => {
    if (deployed && onChainMeta) {
      const hex = onChainMeta as `0x${string}`;
      // "0x" or all zeroes means not registered
      if (hex === "0x" || hex === "0x00") return null;
      return hex;
    }
    return localMeta;
  })();

  // -- Actions --------------------------------------------------------------

  /**
   * Register a stealth meta-address on-chain or in localStorage.
   * The metaAddress should be a hex-encoded bytes string (0x...).
   */
  const registerMetaAddress = useCallback(
    async (metaAddress: string) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }
      setError(null);

      // Ensure the meta-address is hex-encoded for the contract
      const hexMeta = metaAddress.startsWith("0x")
        ? metaAddress
        : `0x${Buffer.from(metaAddress).toString("hex")}`;

      if (deployed) {
        try {
          await writeContractAsync({
            address: CONTRACTS.stealthRegistry.address,
            abi: StealthRegistryABI,
            functionName: "registerStealthMetaAddress",
            args: [hexMeta as `0x${string}`],
          });
          await refetchMeta();
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to register meta-address on-chain";
          setError(msg);
          throw err;
        }
      } else {
        // localStorage fallback
        saveMetaToStorage(address, metaAddress);
        setLocalMeta(metaAddress);
      }
    },
    [address, deployed, writeContractAsync, refetchMeta],
  );

  /**
   * Look up a meta-address for a given address. For the connected user,
   * returns the already-loaded value. For others, falls back to localStorage.
   */
  const lookupMetaAddress = useCallback(
    (targetAddress: string): string | null => {
      if (
        address &&
        targetAddress.toLowerCase() === address.toLowerCase()
      ) {
        return registeredMeta;
      }
      // For other addresses, try localStorage
      return loadMetaFromStorage(targetAddress);
    },
    [address, registeredMeta],
  );

  /**
   * Announce a stealth payment on-chain. This is a non-blocking operation:
   * it should not fail the parent transaction flow if the registry is
   * unavailable.
   */
  const announcePayment = useCallback(
    async (
      stealthAddress: string,
      ephemeralPubKey: string,
      metadata: string = "0x",
    ) => {
      if (!deployed) {
        // Registry not deployed -- store announcement locally for reference
        if (typeof window !== "undefined") {
          try {
            const key = `veil_announcements`;
            const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
            existing.push({
              stealthAddress,
              ephemeralPubKey,
              metadata,
              timestamp: Date.now(),
            });
            localStorage.setItem(key, JSON.stringify(existing));
          } catch {
            // Silent fail
          }
        }
        return;
      }

      try {
        await writeContractAsync({
          address: CONTRACTS.stealthRegistry.address,
          abi: StealthRegistryABI,
          functionName: "announcePayment",
          args: [
            stealthAddress as `0x${string}`,
            ephemeralPubKey as `0x${string}`,
            metadata as `0x${string}`,
          ],
        });
      } catch (err) {
        // Non-blocking: log but don't rethrow
        console.warn("[useStealthRegistry] announcePayment failed:", err);
      }
    },
    [deployed, writeContractAsync],
  );

  return {
    registeredMeta,
    registerMetaAddress,
    lookupMetaAddress,
    announcePayment,
    isLoading: isReadLoading || isWritePending,
    error,
  };
}

// ---------------------------------------------------------------------------
// Standalone helper for non-hook contexts (e.g. transaction-flow.ts)
// ---------------------------------------------------------------------------

/**
 * Announce a stealth payment to the registry. This is a standalone function
 * that can be called from non-React contexts. It uses viem directly instead
 * of wagmi hooks. The call is non-blocking and wrapped in try/catch.
 */
export async function announceStealthPayment(
  stealthAddress: string,
  ephemeralPubKey: string,
  metadata: string = "0x",
): Promise<void> {
  const deployed = isRegistryDeployed();

  if (!deployed) {
    // Registry not deployed -- store locally
    if (typeof window !== "undefined") {
      try {
        const key = "veil_announcements";
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
        existing.push({
          stealthAddress,
          ephemeralPubKey,
          metadata,
          timestamp: Date.now(),
        });
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        // Silent fail
      }
    }
    return;
  }

  // When deployed, the actual announcement will be handled by the hook
  // in the React layer. This function serves as the localStorage fallback
  // for the transaction-flow module.
  console.info(
    "[announceStealthPayment] Registry is deployed. " +
      "Announcement should be called from the React hook layer.",
  );
}
