import { encodeFunctionData, parseUnits } from "viem";
import { generateStealthAddress, generateStealthMetaAddress } from "./generate";
import {
  saveTransactionRecord,
  type TransactionRecord,
} from "../fileverse/client";
import { parseIntent, type DeFiIntent, type X402Response } from "../ai/x402-client";
import { TOKENS, type TokenSymbol } from "../web3/contracts";
import type { TransactionPreview } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StealthTransactionParams = {
  userAddress: string;
  message: string;
  ensName?: string;
};

export type StealthTransactionResult = {
  intent: DeFiIntent;
  stealthAddress: string;
  ephemeralPubKey: string;
  estimatedOutput: string;
  gasFee: string;
  route: string;
  policyCheck: {
    passed: boolean;
    dailyLimit: string;
    spent: string;
    remaining: string;
  };
};

// ---------------------------------------------------------------------------
// ERC-20 transfer ABI fragment (for encoding calldata)
// ---------------------------------------------------------------------------

const ERC20_TRANSFER_ABI = [
  {
    type: "function" as const,
    name: "transfer",
    inputs: [
      { name: "to", type: "address" as const },
      { name: "amount", type: "uint256" as const },
    ],
    outputs: [{ name: "", type: "bool" as const }],
    stateMutability: "nonpayable" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveTokenDecimals(symbol: string): number {
  const upper = symbol.toUpperCase() as TokenSymbol;
  if (upper in TOKENS) return TOKENS[upper].decimals;
  // Sensible default for unknown tokens
  return 18;
}

function resolveTokenAddress(symbol: string): `0x${string}` | null {
  const upper = symbol.toUpperCase() as TokenSymbol;
  if (upper in TOKENS) return TOKENS[upper].address;
  return null;
}

function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateEphemeralKey(): string {
  return `0x${generateRandomHex(32)}`;
}

// ---------------------------------------------------------------------------
// Mock policy check (hardcoded for hackathon)
// ---------------------------------------------------------------------------

function runPolicyCheck(
  _userAddress: string,
  _intent: DeFiIntent,
): StealthTransactionResult["policyCheck"] {
  return {
    passed: true,
    dailyLimit: "$5,000",
    spent: "$1,200",
    remaining: "$3,800",
  };
}

// ---------------------------------------------------------------------------
// Step 1: Parse user intent via AI
// ---------------------------------------------------------------------------

export async function parseUserIntent(message: string): Promise<DeFiIntent> {
  const response: X402Response = await parseIntent(message);
  return response.intent;
}

// ---------------------------------------------------------------------------
// Step 2: Generate stealth address & prepare transaction preview
// ---------------------------------------------------------------------------

export async function prepareStealthTransaction(
  params: StealthTransactionParams,
): Promise<StealthTransactionResult> {
  // 1. Parse intent from natural language
  const x402 = await parseIntent(params.message);
  const intent = x402.intent;

  // 2. Generate a fresh stealth meta-address and derive a one-time stealth address
  const meta = generateStealthMetaAddress();
  const ephemeralKey = generateEphemeralKey();
  const { stealthAddress, ephemeralPubKey } = await generateStealthAddress(
    meta.metaAddress,
    ephemeralKey,
  );

  // 3. Run policy check
  const policyCheck = runPolicyCheck(params.userAddress, intent);

  return {
    intent,
    stealthAddress,
    ephemeralPubKey,
    estimatedOutput: x402.estimatedOutput ?? intent.amount ?? "0",
    gasFee: x402.gasFee ?? "~$0.50",
    route: x402.route ?? "Direct Transfer (Stealth)",
    policyCheck,
  };
}

// ---------------------------------------------------------------------------
// Step 3: Build transaction calldata
// ---------------------------------------------------------------------------

export async function buildTransaction(
  result: StealthTransactionResult,
  _userAddress: string,
): Promise<{
  to: string;
  data: `0x${string}`;
  value: bigint;
}> {
  const { intent, stealthAddress } = result;
  const fromToken = intent.fromToken ?? "ETH";
  const amount = intent.amount ?? "0";

  // Native ETH transfer (swap/send)
  if (fromToken.toUpperCase() === "ETH") {
    const decimals = resolveTokenDecimals("ETH");
    const value = parseUnits(amount, decimals);

    return {
      to: stealthAddress,
      data: "0x",
      value,
    };
  }

  // ERC-20 transfer
  const tokenAddress = resolveTokenAddress(fromToken);

  if (!tokenAddress) {
    // Fallback: treat as native transfer if token address is unknown
    return {
      to: stealthAddress,
      data: "0x",
      value: parseUnits(amount, 18),
    };
  }

  const decimals = resolveTokenDecimals(fromToken);
  const parsedAmount = parseUnits(amount, decimals);

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [stealthAddress as `0x${string}`, parsedAmount],
  });

  return {
    to: tokenAddress,
    data,
    value: BigInt(0),
  };
}

// ---------------------------------------------------------------------------
// Step 4: Record transaction to Fileverse
// ---------------------------------------------------------------------------

export async function recordTransaction(
  result: StealthTransactionResult,
  txHash: string,
  userAddress: string,
): Promise<{ docId: string }> {
  const record: TransactionRecord = {
    id: `${userAddress.slice(2, 10)}-${Date.now()}`,
    timestamp: Date.now(),
    action: result.intent.action,
    tokens: {
      from: result.intent.fromToken ?? "ETH",
      to: result.intent.toToken ?? result.intent.fromToken ?? "ETH",
    },
    amount: result.intent.amount ?? "0",
    stealthAddress: result.stealthAddress,
    txHash,
    status: "confirmed",
  };

  return saveTransactionRecord(record);
}

// ---------------------------------------------------------------------------
// Full flow: parse -> prepare -> build
// (user signs externally, then calls recordTransaction)
// ---------------------------------------------------------------------------

export async function executeFullFlow(
  params: StealthTransactionParams,
): Promise<{
  prepared: StealthTransactionResult;
  unsignedTx: { to: string; data: `0x${string}`; value: bigint };
}> {
  const prepared = await prepareStealthTransaction(params);
  const unsignedTx = await buildTransaction(prepared, params.userAddress);

  return { prepared, unsignedTx };
}

// ---------------------------------------------------------------------------
// Convert StealthTransactionResult to TransactionPreview (for UI)
// ---------------------------------------------------------------------------

export function toTransactionPreview(
  result: StealthTransactionResult,
): TransactionPreview {
  const fromToken = result.intent.fromToken ?? "ETH";
  const toToken = result.intent.toToken ?? fromToken;

  return {
    action: result.intent.action.charAt(0).toUpperCase() + result.intent.action.slice(1),
    fromToken,
    toToken,
    amount: result.intent.amount ?? "0",
    estimatedOutput: result.estimatedOutput,
    route: result.route,
    gasFee: result.gasFee,
    stealthAddress: result.stealthAddress,
    policyCheck: result.policyCheck,
  };
}
