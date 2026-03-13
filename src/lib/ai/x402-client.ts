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

function mockParseIntent(message: string): X402Response {
  const lower = message.toLowerCase();

  if (
    lower.includes("swap") &&
    (lower.includes("btc") || lower.includes("bitcoin") || lower.includes("cbbtc"))
  ) {
    return {
      intent: {
        action: "swap",
        fromToken: "cbBTC",
        toToken: "USDC",
        amount: "0.5",
        chain: "base",
      },
      route: "cbBTC -> USDC via Uniswap V3",
      estimatedOutput: "48,250.00 USDC",
      gasFee: "0.0012 ETH",
      confidence: 0.91,
    };
  }

  if (lower.includes("swap")) {
    return {
      intent: {
        action: "swap",
        fromToken: "ETH",
        toToken: "USDC",
        amount: "1.0",
        chain: "base",
      },
      route: "ETH -> USDC via Uniswap V3",
      estimatedOutput: "2,410.50 USDC",
      gasFee: "0.0012 ETH",
      confidence: 0.92,
    };
  }

  if (lower.includes("send") || lower.includes("transfer")) {
    return {
      intent: {
        action: "send",
        fromToken: "USDC",
        amount: "500",
        chain: "base",
      },
      route: "Direct transfer",
      estimatedOutput: "500 USDC",
      gasFee: "0.0003 ETH",
      confidence: 0.95,
    };
  }

  if (lower.includes("bridge")) {
    return {
      intent: {
        action: "bridge",
        fromToken: "ETH",
        amount: "0.5",
        chain: "ethereum",
      },
      route: "Ethereum -> Base via Across",
      estimatedOutput: "0.499 ETH",
      gasFee: "0.002 ETH",
      confidence: 0.88,
    };
  }

  if (lower.includes("lend") || lower.includes("deposit")) {
    return {
      intent: {
        action: "lend",
        fromToken: "USDC",
        amount: "1000",
        chain: "base",
      },
      route: "USDC -> Aave V3 Base",
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
