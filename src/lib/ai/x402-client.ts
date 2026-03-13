// Client for HeyElsa x402 pay-per-call API
// Docs: https://x402.heyelsa.ai/docs

export type DeFiAction = "swap" | "send" | "bridge" | "lend" | "portfolio";

export type DeFiIntent = {
  action: DeFiAction;
  fromToken?: string;
  toToken?: string;
  amount?: string;
  recipient?: string;
  chain?: string;
};

export type X402Response = {
  intent: DeFiIntent;
  route?: string;
  estimatedOutput?: string;
  gasFee?: string;
  confidence: number;
};

export type PortfolioToken = {
  symbol: string;
  balance: string;
  usdValue: string;
};

export type PortfolioResponse = {
  tokens: PortfolioToken[];
};

export type SwapResult = {
  txHash: string;
};

// ---------------------------------------------------------------------------
// Internal proxy base URL
// ---------------------------------------------------------------------------
const API_BASE = "/api/x402";

// ---------------------------------------------------------------------------
// Mock data used when the API proxy is unreachable or in dev mode
// ---------------------------------------------------------------------------

/** Known token symbols for regex extraction */
const KNOWN_TOKENS = [
  "ETH",
  "USDC",
  "cbBTC",
  "WBTC",
  "BTC",
  "DAI",
  "USDT",
  "WETH",
  "MATIC",
  "ARB",
  "OP",
] as const;

/** Chain names for bridge intent extraction */
const KNOWN_CHAINS = [
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "mainnet",
] as const;

/**
 * Extract an amount and token symbol from a natural language message.
 * Handles patterns like: "0.5 ETH", "100 USDC", "$500", "2.5 cbBTC"
 */
function extractAmountAndToken(message: string): {
  amount: string | null;
  token: string | null;
} {
  // Pattern: "$500" or "$ 500" -- dollar amount (no token, infer USDC)
  const dollarMatch = message.match(/\$\s?([\d,]+(?:\.\d+)?)/);
  if (dollarMatch) {
    return {
      amount: dollarMatch[1].replace(/,/g, ""),
      token: "USDC",
    };
  }

  // Pattern: "0.5 ETH", "100 USDC", "2.5 cbBTC" (amount followed by token)
  const tokenPattern = KNOWN_TOKENS.join("|");
  const amountTokenRegex = new RegExp(
    `(\\d+(?:[.,]\\d+)?)\\s*(${tokenPattern})`,
    "i",
  );
  const amountTokenMatch = message.match(amountTokenRegex);
  if (amountTokenMatch) {
    return {
      amount: amountTokenMatch[1].replace(/,/g, ""),
      token: normalizeToken(amountTokenMatch[2]),
    };
  }

  // Pattern: "ETH 0.5" (token followed by amount)
  const tokenAmountRegex = new RegExp(
    `(${tokenPattern})\\s+(\\d+(?:[.,]\\d+)?)`,
    "i",
  );
  const tokenAmountMatch = message.match(tokenAmountRegex);
  if (tokenAmountMatch) {
    return {
      amount: tokenAmountMatch[2].replace(/,/g, ""),
      token: normalizeToken(tokenAmountMatch[1]),
    };
  }

  return { amount: null, token: null };
}

/** Normalize token aliases to canonical symbols */
function normalizeToken(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper === "BTC" || upper === "BITCOIN") return "cbBTC";
  if (upper === "CBBTC") return "cbBTC";
  return upper;
}

/**
 * Extract the "to" token in a swap context.
 * Looks for "for USDC", "to ETH", "into USDC", etc.
 */
function extractToToken(message: string): string | null {
  const tokenPattern = KNOWN_TOKENS.join("|");
  const toTokenRegex = new RegExp(
    `(?:for|to|into)\\s+(${tokenPattern})`,
    "i",
  );
  const match = message.match(toTokenRegex);
  if (match) return normalizeToken(match[1]);
  return null;
}

/**
 * Extract a recipient from the message.
 * Supports ENS names (*.eth) and 0x addresses.
 */
function extractRecipient(message: string): string | null {
  // ENS name: "to vitalik.eth", "vitalik.eth"
  const ensMatch = message.match(/(?:to\s+)?([a-zA-Z0-9-]+\.eth)\b/);
  if (ensMatch) return ensMatch[1];

  // 0x address
  const addressMatch = message.match(/(0x[a-fA-F0-9]{40})/);
  if (addressMatch) return addressMatch[1];

  return null;
}

/**
 * Extract a destination chain for bridge intents.
 */
function extractDestinationChain(message: string): string | null {
  const lower = message.toLowerCase();
  const chainPattern = KNOWN_CHAINS.join("|");
  // Look for "to <chain>" pattern
  const toChainRegex = new RegExp(`to\\s+(${chainPattern})`, "i");
  const match = lower.match(toChainRegex);
  if (match) return match[1].toLowerCase();

  // Look for "on <chain>" pattern
  const onChainRegex = new RegExp(`on\\s+(${chainPattern})`, "i");
  const onMatch = lower.match(onChainRegex);
  if (onMatch) return onMatch[1].toLowerCase();

  return null;
}

function mockParseIntent(message: string): X402Response {
  const lower = message.toLowerCase();
  const { amount: extractedAmount, token: extractedToken } =
    extractAmountAndToken(message);
  const recipient = extractRecipient(message);
  const toToken = extractToToken(message);
  const destChain = extractDestinationChain(message);

  // --- Swap ---
  if (lower.includes("swap")) {
    const fromToken = extractedToken ?? "ETH";
    const resolvedToToken = toToken ?? (fromToken === "ETH" ? "USDC" : "USDC");
    const amount = extractedAmount ?? "1.0";

    return {
      intent: {
        action: "swap",
        fromToken,
        toToken: resolvedToToken,
        amount,
        chain: destChain ?? "base",
      },
      route: `${fromToken} -> ${resolvedToToken} via Uniswap V3`,
      estimatedOutput: `~ ${resolvedToToken}`,
      gasFee: "0.0012 ETH",
      confidence: 0.92,
    };
  }

  // --- Send / Transfer ---
  if (lower.includes("send") || lower.includes("transfer")) {
    const fromToken = extractedToken ?? "ETH";
    const amount = extractedAmount ?? "1.0";

    return {
      intent: {
        action: "send",
        fromToken,
        amount,
        recipient: recipient ?? undefined,
        chain: destChain ?? "base",
      },
      route: "Direct transfer",
      estimatedOutput: `${amount} ${fromToken}`,
      gasFee: "0.0003 ETH",
      confidence: 0.95,
    };
  }

  // --- Bridge ---
  if (lower.includes("bridge")) {
    const fromToken = extractedToken ?? "ETH";
    const amount = extractedAmount ?? "1.0";
    const chain = destChain ?? "arbitrum";

    return {
      intent: {
        action: "bridge",
        fromToken,
        amount,
        chain,
      },
      route: `Base -> ${chain.charAt(0).toUpperCase() + chain.slice(1)} via Across`,
      estimatedOutput: `~${amount} ${fromToken}`,
      gasFee: "0.002 ETH",
      confidence: 0.88,
    };
  }

  // --- Lend / Deposit ---
  if (lower.includes("lend") || lower.includes("deposit")) {
    const fromToken = extractedToken ?? "USDC";
    const amount = extractedAmount ?? "1000";

    return {
      intent: {
        action: "lend",
        fromToken,
        amount,
        chain: destChain ?? "base",
      },
      route: `${fromToken} -> Aave V3 Base`,
      estimatedOutput: "4.2% APY",
      gasFee: "0.0008 ETH",
      confidence: 0.9,
    };
  }

  // Default: portfolio query
  return {
    intent: { action: "portfolio" },
    confidence: 0.85,
  };
}

const MOCK_PORTFOLIO: PortfolioResponse = {
  tokens: [
    { symbol: "ETH", balance: "2.45", usdValue: "5,902.50" },
    { symbol: "USDC", balance: "3,200.00", usdValue: "3,200.00" },
    { symbol: "cbBTC", balance: "0.15", usdValue: "14,475.00" },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function parseIntent(message: string): Promise<X402Response> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "parseIntent", message }),
    });

    if (!res.ok) {
      console.warn(`[x402] parseIntent proxy returned ${res.status}, using mock`);
      return mockParseIntent(message);
    }

    return (await res.json()) as X402Response;
  } catch {
    console.warn("[x402] parseIntent fetch failed, using mock");
    return mockParseIntent(message);
  }
}

export async function executeSwap(intent: DeFiIntent): Promise<SwapResult> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "executeSwap", intent }),
    });

    if (!res.ok) {
      console.warn(`[x402] executeSwap proxy returned ${res.status}, using mock`);
      return { txHash: `0x${"a".repeat(64)}` };
    }

    return (await res.json()) as SwapResult;
  } catch {
    console.warn("[x402] executeSwap fetch failed, using mock");
    return { txHash: `0x${"a".repeat(64)}` };
  }
}

export async function getPortfolio(address: string): Promise<PortfolioResponse> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPortfolio", address }),
    });

    if (!res.ok) {
      console.warn(`[x402] getPortfolio proxy returned ${res.status}, using mock`);
      return MOCK_PORTFOLIO;
    }

    return (await res.json()) as PortfolioResponse;
  } catch {
    console.warn("[x402] getPortfolio fetch failed, using mock");
    return MOCK_PORTFOLIO;
  }
}
