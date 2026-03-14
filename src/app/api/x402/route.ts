import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// HeyElsa x402 server-side proxy
// Handles x402 payment flow: 402 status -> pay -> retry
// ---------------------------------------------------------------------------

type X402RequestBody = {
  action: "parseIntent" | "executeSwap" | "getPortfolio";
  message?: string;
  intent?: {
    action: string;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    recipient?: string;
    chain?: string;
  };
  address?: string;
};

// ---------------------------------------------------------------------------
// Mock responses for dev / when env vars are not configured
// ---------------------------------------------------------------------------

function mockResponse(body: X402RequestBody) {
  switch (body.action) {
    case "parseIntent": {
      const msg = (body.message ?? "").toLowerCase();

      if (
        msg.includes("swap") &&
        (msg.includes("btc") || msg.includes("bitcoin") || msg.includes("cbbtc"))
      ) {
        return NextResponse.json({
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
        });
      }

      if (msg.includes("swap")) {
        return NextResponse.json({
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
        });
      }

      if (msg.includes("send") || msg.includes("transfer")) {
        return NextResponse.json({
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
        });
      }

      return NextResponse.json({
        intent: { action: "portfolio" },
        confidence: 0.85,
      });
    }

    case "executeSwap":
      return NextResponse.json({
        txHash: `0x${"b".repeat(64)}`,
      });

    case "getPortfolio":
      return NextResponse.json({
        tokens: [
          { symbol: "ETH", balance: "2.45", usdValue: "5,902.50" },
          { symbol: "USDC", balance: "3,200.00", usdValue: "3,200.00" },
          { symbol: "cbBTC", balance: "0.15", usdValue: "14,475.00" },
        ],
      });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// x402 payment flow helper
// ---------------------------------------------------------------------------

async function fetchWithX402(
  endpoint: string,
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  let res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // x402 payment flow: if we get 402, extract payment details and retry
  if (res.status === 402) {
    const paymentInfo = await res.json();
    const paymentReceipt = paymentInfo.receipt ?? paymentInfo.paymentReceipt;

    if (paymentReceipt) {
      headers["X-Payment-Receipt"] = paymentReceipt;
      res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = (await request.json()) as X402RequestBody;

  if (!body.action) {
    return NextResponse.json({ error: "Missing action field" }, { status: 400 });
  }

  const endpoint = process.env.HEYELSA_X402_ENDPOINT;
  const apiKey = process.env.HEYELSA_API_KEY;

  // Dev mode: return mock when env vars are not configured
  if (!endpoint || !apiKey) {
    const res = mockResponse(body);
    res.headers.set("X-Veil-Source", "mock");
    return res;
  }

  try {
    const res = await fetchWithX402(endpoint, apiKey, {
      action: body.action,
      message: body.message,
      intent: body.intent,
      address: body.address,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(`[x402] Upstream returned ${res.status}: ${errorText}`);
      return NextResponse.json(
        { error: "Upstream service error", status: res.status, detail: errorText },
        { status: 502, headers: { "X-Veil-Source": "live" } },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "X-Veil-Source": "live" },
    });
  } catch (error) {
    console.error("[x402] Upstream request failed:", error);
    return NextResponse.json(
      { error: "Upstream request failed", detail: String(error) },
      { status: 502, headers: { "X-Veil-Source": "live" } },
    );
  }
}
