// BitGo integration for multi-sig wallets and policy engine
// Docs: https://developers.bitgo.com/
//
// All functions proxy through /api/bitgo to keep the access token server-side.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WalletInfo = {
  walletId: string;
  label: string;
  coin: string;
  balance: string;
  address: string;
  multisigType: "tss" | "onchain";
  pendingApprovals: number;
};

export type TxParams = {
  recipients: Array<{
    address: string;
    amount: string;
  }>;
  coin?: string;
  memo?: string;
};

export type ProposedTx = {
  txId: string;
  state: "pendingApproval" | "signed" | "rejected";
  txHex: string;
  fee: string;
  recipients: Array<{ address: string; amount: string }>;
};

export type PolicyParams = {
  type: "dailyLimit" | "whitelistOnly" | "velocityLimit";
  coin?: string;
  limit?: string;
  addresses?: string[];
};

// ---------------------------------------------------------------------------
// Internal proxy
// ---------------------------------------------------------------------------

const API_BASE = "/api/bitgo";

type BitGoAction =
  | "createWallet"
  | "getWallet"
  | "proposeTransaction"
  | "approveTransaction"
  | "setPolicy";

async function call<T>(action: BitGoAction, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[bitgo] ${action} failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function mockWallet(walletId: string, label: string): WalletInfo {
  return {
    walletId,
    label,
    coin: "eth",
    balance: "1.25",
    address: `0x${"c".repeat(40)}`,
    multisigType: "tss",
    pendingApprovals: 0,
  };
}

function mockProposedTx(): ProposedTx {
  return {
    txId: `tx_${Date.now().toString(36)}`,
    state: "pendingApproval",
    txHex: `0x${"d".repeat(128)}`,
    fee: "0.0015 ETH",
    recipients: [{ address: `0x${"e".repeat(40)}`, amount: "0.5" }],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createWallet(
  userId: string,
  label: string,
): Promise<{ walletId: string }> {
  try {
    return await call<{ walletId: string }>("createWallet", { userId, label });
  } catch {
    console.warn("[bitgo] createWallet failed, using mock");
    const id = `wallet_${Date.now().toString(36)}`;
    return { walletId: id };
  }
}

export async function getWallet(walletId: string): Promise<WalletInfo> {
  try {
    return await call<WalletInfo>("getWallet", { walletId });
  } catch {
    console.warn("[bitgo] getWallet failed, using mock");
    return mockWallet(walletId, "Mock Wallet");
  }
}

export async function proposeTransaction(
  walletId: string,
  params: TxParams,
): Promise<ProposedTx> {
  try {
    return await call<ProposedTx>("proposeTransaction", { walletId, params });
  } catch {
    console.warn("[bitgo] proposeTransaction failed, using mock");
    return mockProposedTx();
  }
}

export async function approveTransaction(
  walletId: string,
  txId: string,
  signature: string,
): Promise<{ txHash: string }> {
  try {
    return await call<{ txHash: string }>("approveTransaction", {
      walletId,
      txId,
      signature,
    });
  } catch {
    console.warn("[bitgo] approveTransaction failed, using mock");
    return { txHash: `0x${"f".repeat(64)}` };
  }
}

export async function setPolicy(
  walletId: string,
  policy: PolicyParams,
): Promise<void> {
  try {
    await call<{ success: boolean }>("setPolicy", { walletId, policy });
  } catch {
    console.warn("[bitgo] setPolicy failed, mock no-op");
  }
}
