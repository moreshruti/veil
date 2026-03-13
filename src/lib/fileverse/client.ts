// Fileverse integration for E2E encrypted document storage
// Docs: https://docs.fileverse.io/
//
// localStorage is the PRIMARY storage layer. The /api/fileverse route is called
// as a best-effort secondary sync — failures are logged but never block the UI.

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
// Simulated E2E encryption helpers
// ---------------------------------------------------------------------------

// Simulated E2E encryption — replace with Fileverse SDK for production
function encryptRecord(record: TransactionRecord): string {
  if (typeof btoa === "undefined") {
    // Node / SSR fallback
    return Buffer.from(JSON.stringify(record), "utf-8").toString("base64");
  }
  return btoa(JSON.stringify(record));
}

function decryptRecord(encoded: string): TransactionRecord {
  if (typeof atob === "undefined") {
    // Node / SSR fallback
    return JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8"),
    ) as TransactionRecord;
  }
  return JSON.parse(atob(encoded)) as TransactionRecord;
}

// ---------------------------------------------------------------------------
// localStorage — primary storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "veil_tx_records";

function readAllEncoded(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeAllEncoded(entries: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Silently fail if storage is full
  }
}

function readLocal(): TransactionRecord[] {
  return readAllEncoded()
    .map((entry) => {
      try {
        return decryptRecord(entry);
      } catch {
        return null;
      }
    })
    .filter((r): r is TransactionRecord => r !== null);
}

// ---------------------------------------------------------------------------
// API proxy (best-effort secondary sync)
// ---------------------------------------------------------------------------

const API_BASE = "/api/fileverse";

async function syncToServer(record: TransactionRecord): Promise<void> {
  try {
    await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
  } catch {
    console.warn("[fileverse] server sync failed — record saved locally");
  }
}

// ---------------------------------------------------------------------------
// Public CRUD API
// ---------------------------------------------------------------------------

/** Save a new transaction record. Returns a synthetic docId. */
export async function saveTransactionRecord(
  record: TransactionRecord,
): Promise<{ docId: string }> {
  // 1. Write to localStorage (primary)
  const entries = readAllEncoded();
  entries.push(encryptRecord(record));
  writeAllEncoded(entries);

  // 2. Best-effort server sync (secondary)
  syncToServer(record);

  return { docId: `doc_${record.id}` };
}

/** Retrieve all transaction records, sorted newest-first. */
export async function getTransactionRecords(
  _userId?: string,
): Promise<TransactionRecord[]> {
  const records = readLocal();
  records.sort((a, b) => b.timestamp - a.timestamp);
  return records;
}

/** Retrieve a single record by id or docId. */
export async function getTransactionRecord(
  docId: string,
): Promise<TransactionRecord | null> {
  const id = docId.replace(/^doc_/, "");
  const records = readLocal();
  return records.find((r) => r.id === id || r.id === docId) ?? null;
}

/** Delete a single record by id. Returns true if found and removed. */
export async function deleteTransactionRecord(
  recordId: string,
): Promise<boolean> {
  const records = readLocal();
  const idx = records.findIndex((r) => r.id === recordId);
  if (idx === -1) return false;

  // Re-encode the remaining records
  const remaining = [...records.slice(0, idx), ...records.slice(idx + 1)];
  writeAllEncoded(remaining.map(encryptRecord));
  return true;
}

/** Return the number of stored records. */
export function getRecordCount(): number {
  return readAllEncoded().length;
}
