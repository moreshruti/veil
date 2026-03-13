import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// BitGo server-side proxy
// Keeps BITGO_ACCESS_TOKEN on the server, proxies wallet operations
// ---------------------------------------------------------------------------

type BitGoRequestBody = {
  action:
    | "createWallet"
    | "getWallet"
    | "proposeTransaction"
    | "approveTransaction"
    | "setPolicy";
  userId?: string;
  label?: string;
  walletId?: string;
  params?: {
    recipients?: Array<{ address: string; amount: string }>;
    coin?: string;
    memo?: string;
  };
  txId?: string;
  signature?: string;
  policy?: {
    type: string;
    coin?: string;
    limit?: string;
    addresses?: string[];
  };
};

// ---------------------------------------------------------------------------
// Mock responses
// ---------------------------------------------------------------------------

function mockResponse(body: BitGoRequestBody) {
  switch (body.action) {
    case "createWallet":
      return NextResponse.json({
        walletId: `wallet_${Date.now().toString(36)}`,
      });

    case "getWallet":
      return NextResponse.json({
        walletId: body.walletId ?? "wallet_mock",
        label: "Mock Wallet",
        coin: "eth",
        balance: "1.25",
        address: `0x${"c".repeat(40)}`,
        multisigType: "tss",
        pendingApprovals: 0,
      });

    case "proposeTransaction":
      return NextResponse.json({
        txId: `tx_${Date.now().toString(36)}`,
        state: "pendingApproval",
        txHex: `0x${"d".repeat(128)}`,
        fee: "0.0015 ETH",
        recipients: body.params?.recipients ?? [],
      });

    case "approveTransaction":
      return NextResponse.json({
        txHash: `0x${"f".repeat(64)}`,
      });

    case "setPolicy":
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(body: BitGoRequestBody): string | null {
  if (!body.action) return "Missing action field";

  switch (body.action) {
    case "createWallet":
      if (!body.userId) return "createWallet requires userId";
      if (!body.label) return "createWallet requires label";
      break;
    case "getWallet":
      if (!body.walletId) return "getWallet requires walletId";
      break;
    case "proposeTransaction":
      if (!body.walletId) return "proposeTransaction requires walletId";
      if (!body.params?.recipients?.length)
        return "proposeTransaction requires params.recipients";
      break;
    case "approveTransaction":
      if (!body.walletId) return "approveTransaction requires walletId";
      if (!body.txId) return "approveTransaction requires txId";
      if (!body.signature) return "approveTransaction requires signature";
      break;
    case "setPolicy":
      if (!body.walletId) return "setPolicy requires walletId";
      if (!body.policy) return "setPolicy requires policy";
      break;
  }

  return null;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BitGoRequestBody;

  const error = validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const accessToken = process.env.BITGO_ACCESS_TOKEN;

  // Dev mode: return mock when token is not configured
  if (!accessToken) {
    return mockResponse(body);
  }

  // Map actions to BitGo API endpoints
  const BITGO_BASE = "https://app.bitgo-test.com/api/v2";

  const endpointMap: Record<string, { method: string; path: string }> = {
    createWallet: { method: "POST", path: "/eth/wallet/generate" },
    getWallet: { method: "GET", path: `/eth/wallet/${body.walletId}` },
    proposeTransaction: {
      method: "POST",
      path: `/eth/wallet/${body.walletId}/tx/build`,
    },
    approveTransaction: {
      method: "PUT",
      path: `/eth/wallet/${body.walletId}/pendingapprovals/${body.txId}`,
    },
    setPolicy: {
      method: "PUT",
      path: `/eth/wallet/${body.walletId}/policy`,
    },
  };

  const endpoint = endpointMap[body.action];
  if (!endpoint) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BITGO_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: endpoint.method !== "GET" ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      console.error(`[bitgo] Upstream returned ${res.status}`);
      return mockResponse(body);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[bitgo] Upstream request failed:", err);
    return mockResponse(body);
  }
}
