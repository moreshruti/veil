"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, VeilAgentABI } from "@/lib/web3/contracts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentData = {
  owner: string;
  ensName: string;
  active: boolean;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const STORAGE_PREFIX = "veil_agent_";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function isContractDeployed(): boolean {
  return CONTRACTS.veilAgent.address !== ZERO_ADDRESS;
}

function loadAgentFromStorage(address: string): AgentData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${address.toLowerCase()}`);
    return raw ? (JSON.parse(raw) as AgentData) : null;
  } catch {
    return null;
  }
}

function saveAgentToStorage(address: string, agent: AgentData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${address.toLowerCase()}`,
      JSON.stringify(agent),
    );
  } catch {
    // Storage full or unavailable -- silent fail
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVeilAgent() {
  const { address } = useAccount();
  const deployed = isContractDeployed();

  // -- On-chain reads (only fire when contract is deployed) -----------------

  const {
    data: onChainAgent,
    refetch: refetchAgent,
    isLoading: isReadLoading,
  } = useReadContract({
    address: CONTRACTS.veilAgent.address,
    abi: VeilAgentABI,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: {
      enabled: deployed && !!address,
    },
  });

  // -- On-chain write -------------------------------------------------------

  const {
    writeContractAsync,
    isPending: isWritePending,
  } = useWriteContract();

  // -- Local state ----------------------------------------------------------

  const [localAgent, setLocalAgent] = useState<AgentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate local fallback from localStorage on mount / address change
  useEffect(() => {
    if (!deployed && address) {
      setLocalAgent(loadAgentFromStorage(address));
    }
  }, [deployed, address]);

  // -- Derived agent data ---------------------------------------------------

  const agent: AgentData | null = (() => {
    if (deployed && onChainAgent) {
      // onChainAgent is a tuple: [owner, ensName, active, createdAt]
      const [owner, ensName, active, createdAt] = onChainAgent as [
        string,
        string,
        boolean,
        bigint,
      ];
      // Empty owner means no agent registered
      if (owner === ZERO_ADDRESS) return null;
      return {
        owner,
        ensName,
        active,
        createdAt: Number(createdAt),
      };
    }
    return localAgent;
  })();

  // -- Actions --------------------------------------------------------------

  const createAgent = useCallback(
    async (ensName: string) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }
      setError(null);

      if (deployed) {
        try {
          await writeContractAsync({
            address: CONTRACTS.veilAgent.address,
            abi: VeilAgentABI,
            functionName: "createAgent",
            args: [ensName],
          });
          await refetchAgent();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to create agent on-chain";
          setError(msg);
          throw err;
        }
      } else {
        // localStorage fallback
        const newAgent: AgentData = {
          owner: address,
          ensName,
          active: true,
          createdAt: Math.floor(Date.now() / 1000),
        };
        saveAgentToStorage(address, newAgent);
        setLocalAgent(newAgent);
      }
    },
    [address, deployed, writeContractAsync, refetchAgent],
  );

  const getAgent = useCallback(
    (targetAddress: string): AgentData | null => {
      // For the connected user, return the already-loaded data
      if (address && targetAddress.toLowerCase() === address.toLowerCase()) {
        return agent;
      }
      // For other addresses, try localStorage (on-chain reads for arbitrary
      // addresses would need a separate useReadContract call)
      return loadAgentFromStorage(targetAddress);
    },
    [address, agent],
  );

  const isAgentActive = useCallback(
    (targetAddress: string): boolean => {
      const data = getAgent(targetAddress);
      return data?.active ?? false;
    },
    [getAgent],
  );

  return {
    agent,
    createAgent,
    getAgent,
    isAgentActive,
    isLoading: isReadLoading || isWritePending,
    error,
  };
}
