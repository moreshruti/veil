// Fileverse integration for E2E encrypted document storage
// Docs: https://docs.fileverse.io/
//
// For the hackathon demo this uses an in-memory store backed by the
// /api/fileverse route. The client also maintains a localStorage mirror
// so data persists across page reloads in the browser.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransactionRecord = {
  id: string;
  timestamp: number;
  action: string;
  tokens: { from: string; to: string };
  amount: string;
  stealthAddress: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
};

// ---------------------------------------------------------------------------
// localStorage helpers (browser-only fallback)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "veil_tx_records";

function readLocal(): TransactionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TransactionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(records: TransactionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Silently fail if storage is full
  }
}

// ---------------------------------------------------------------------------
// API proxy base
// ---------------------------------------------------------------------------

const API_BASE = "/api/fileverse";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function saveTransactionRecord(
  record: TransactionRecord,
): Promise<{ docId: string }> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = (await res.json()) as { docId: string };

    // Mirror to localStorage
    const local = readLocal();
    local.push(record);
    writeLocal(local);

    return data;
  } catch {
    console.warn("[fileverse] saveTransactionRecord API failed, using localStorage");
    const docId = `doc_${record.id}`;
    const local = readLocal();
    local.push(record);
    writeLocal(local);
    return { docId };
  }
}

export async function getTransactionRecords(
  userId: string,
): Promise<TransactionRecord[]> {
  try {
    const res = await fetch(`${API_BASE}?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    return (await res.json()) as TransactionRecord[];
  } catch {
    console.warn("[fileverse] getTransactionRecords API failed, using localStorage");
    return readLocal();
  }
}

export async function getTransactionRecord(
  docId: string,
): Promise<TransactionRecord | null> {
  try {
    const res = await fetch(`${API_BASE}?docId=${encodeURIComponent(docId)}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    return (data as TransactionRecord) ?? null;
  } catch {
    console.warn("[fileverse] getTransactionRecord API failed, using localStorage");
    const local = readLocal();
    const id = docId.replace(/^doc_/, "");
    return local.find((r) => r.id === id || r.id === docId) ?? null;
  }
}
