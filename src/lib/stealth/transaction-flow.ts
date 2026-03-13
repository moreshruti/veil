import { encodeFunctionData, parseUnits } from "viem";
import { generateStealthAddress, generateStealthMetaAddress } from "./generate";
import {
  saveTransactionRecord,
  type TransactionRecord,
} from "../fileverse/client";
import { parseIntent, type DeFiIntent, type X402Response } from "../ai/x402-client";
import { TOKENS, type TokenSymbol } from "../web3/contracts";
import { appendBuilderCode } from "../web3/builder-code";
import { resolveENSToAddress, isENSName } from "../ens/resolve";
import { proposeTransaction as bitgoPropose } from "../bitgo/client";
import { announceStealthPayment } from "@/hooks/useStealthRegistry";
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
  resolvedRecipient?: string;
  policyCheck: {
    passed: boolean;
    dailyLimit: string;
    spent: string;
    remaining: string;
  };
  /** BitGo transaction proposal ID -- used to approve the tx after wallet signing */
  bitgoProposalId?: string;
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
// Policy check with localStorage-backed daily limit tracking
// ---------------------------------------------------------------------------

const DEFAULT_DAILY_LIMIT = 5000; // USD
const STORAGE_KEY_POLICY = "veil_policy_settings";
const STORAGE_KEY_SPENDING = "veil_daily_spending";

type DailySpendingRecord = {
  date: string; // ISO date string (YYYY-MM-DD)
  totalUsd: number;
};

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDailyLimit(): number {
  if (typeof window === "undefined") return DEFAULT_DAILY_LIMIT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POLICY);
    if (raw) {
      const settings = JSON.parse(raw);
      if (typeof settings.dailyLimit === "number" && settings.dailyLimit > 0) {
        return settings.dailyLimit;
      }
    }
  } catch {
    // Corrupted localStorage -- fall through to default
  }
  return DEFAULT_DAILY_LIMIT;
}

function getDailySpending(): DailySpendingRecord {
  const today = getTodayDateString();
  if (typeof window === "undefined") return { date: today, totalUsd: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPENDING);
    if (raw) {
      const record: DailySpendingRecord = JSON.parse(raw);
      // Reset if the stored date is not today
      if (record.date === today) return record;
    }
  } catch {
    // Corrupted -- fall through to fresh record
  }
  return { date: today, totalUsd: 0 };
}

function saveDailySpending(record: DailySpendingRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SPENDING, JSON.stringify(record));
  } catch {
    // Storage full or unavailable -- silent fail
  }
}

/**
 * Rough USD estimate for a given token amount.
 * Uses hardcoded prices -- good enough for policy gating in a hackathon.
 */
function estimateUsdValue(amount: string, token: string): number {
  const parsed = parseFloat(amount);
  if (Number.isNaN(parsed)) return 0;

  const prices: Record<string, number> = {
    ETH: 2400,
    WETH: 2400,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    cbBTC: 96500,
    WBTC: 96500,
  };

  const price = prices[token.toUpperCase()] ?? 0;
  return parsed * price;
}

function runPolicyCheck(
  _userAddress: string,
  intent: DeFiIntent,
): StealthTransactionResult["policyCheck"] {
  const dailyLimit = getDailyLimit();
  const spending = getDailySpending();
  const txUsd = estimateUsdValue(intent.amount ?? "0", intent.fromToken ?? "ETH");
  const newTotal = spending.totalUsd + txUsd;
  const passed = newTotal <= dailyLimit;

  // Persist the updated spending if the check passes
  if (passed) {
    saveDailySpending({ date: spending.date, totalUsd: newTotal });
  }

  const formatUsd = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return {
    passed,
    dailyLimit: formatUsd(dailyLimit),
    spent: formatUsd(newTotal),
    remaining: formatUsd(Math.max(0, dailyLimit - newTotal)),
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

  // 2. Resolve ENS name if recipient looks like one
  let resolvedRecipient: string | undefined;
  if (intent.recipient && isENSName(intent.recipient)) {
    const resolved = await resolveENSToAddress(intent.recipient);
    if (resolved) {
      resolvedRecipient = resolved;
    }
  }

  // 3. Generate a fresh stealth meta-address and derive a one-time stealth address
  const meta = generateStealthMetaAddress();
  const ephemeralKey = generateEphemeralKey();
  const { stealthAddress, ephemeralPubKey } = await generateStealthAddress(
    meta.metaAddress,
    ephemeralKey,
  );

  // 4. Run local policy check
  const policyCheck = runPolicyCheck(params.userAddress, intent);

  // 5. Propose transaction through BitGo for multi-sig policy validation
  //    The client falls back to mocks when BITGO_ACCESS_TOKEN is unset,
  //    so this always resolves without breaking the flow.
  let bitgoProposalId: string | undefined;

  if (policyCheck.passed) {
    const recipient = resolvedRecipient ?? stealthAddress;
    const proposal = await bitgoPropose(params.userAddress, {
      recipients: [{ address: recipient, amount: intent.amount ?? "0" }],
      coin: (intent.fromToken ?? "ETH").toLowerCase(),
      memo: `veil:stealth:${stealthAddress}`,
    });

    bitgoProposalId = proposal.txId;

    // If BitGo's policy engine rejected the proposal, override the local check
    if (proposal.state === "rejected") {
      policyCheck.passed = false;
    }
  }

  return {
    intent,
    stealthAddress,
    ephemeralPubKey,
    estimatedOutput: x402.estimatedOutput ?? intent.amount ?? "0",
    gasFee: x402.gasFee ?? "~$0.50",
    route: x402.route ?? "Direct Transfer (Stealth)",
    resolvedRecipient,
    policyCheck,
    bitgoProposalId,
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

  // Use the resolved ENS recipient if available, otherwise fall back to stealth address
  const recipient = result.resolvedRecipient ?? stealthAddress;

  // Native ETH transfer (swap/send)
  if (fromToken.toUpperCase() === "ETH") {
    const decimals = resolveTokenDecimals("ETH");
    const value = parseUnits(amount, decimals);

    return {
      to: recipient,
      data: appendBuilderCode("0x"),
      value,
    };
  }

  // ERC-20 transfer
  const tokenAddress = resolveTokenAddress(fromToken);

  if (!tokenAddress) {
    // Fallback: treat as native transfer if token address is unknown
    return {
      to: recipient,
      data: appendBuilderCode("0x"),
      value: parseUnits(amount, 18),
    };
  }

  const decimals = resolveTokenDecimals(fromToken);
  const parsedAmount = parseUnits(amount, decimals);

  const calldata = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [recipient as `0x${string}`, parsedAmount],
  });

  return {
    to: tokenAddress,
    data: appendBuilderCode(calldata),
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

  const saved = await saveTransactionRecord(record);

  // Announce stealth payment to the registry (non-blocking).
  // Wrapped in try/catch so a registry failure never breaks the tx flow.
  try {
    await announceStealthPayment(
      result.stealthAddress,
      result.ephemeralPubKey,
      `0x${Buffer.from(txHash).toString("hex")}`,
    );
  } catch {
    // Registry announcement is best-effort -- silent fail
  }

  return saved;
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
