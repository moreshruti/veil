// Production: replace with Fileverse SDK (npm i @fileverse/sdk)

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionRecord = {
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
// Persistence — in-memory Map backed by /tmp/veil-records.json
// ---------------------------------------------------------------------------

const PERSIST_PATH = "/tmp/veil-records.json";

const store = new Map<string, TransactionRecord>();

/** Load records from disk into the in-memory Map (runs once on cold start). */
function hydrate(): void {
  if (store.size > 0) return; // already loaded
  try {
    if (existsSync(PERSIST_PATH)) {
      const raw = readFileSync(PERSIST_PATH, "utf-8");
      const entries = JSON.parse(raw) as [string, TransactionRecord][];
      for (const [key, value] of entries) {
        store.set(key, value);
      }
    }
  } catch (err) {
    console.error("[fileverse] failed to hydrate from disk:", err);
  }
}

/** Flush the in-memory Map to disk. */
function persist(): void {
  try {
    const entries = Array.from(store.entries());
    writeFileSync(PERSIST_PATH, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    console.error("[fileverse] failed to persist to disk:", err);
  }
}

// Hydrate on module load
hydrate();

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  hydrate();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const docId = searchParams.get("docId");

    // Fetch a single record by docId
    if (docId) {
      const id = docId.replace(/^doc_/, "");
      const record = store.get(id) ?? null;
      if (!record) {
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json(record);
    }

    // List all records (optionally filtered by userId / stealthAddress prefix)
    const records = Array.from(store.values());

    if (userId) {
      const filtered = records.filter(
        (r) =>
          r.stealthAddress.toLowerCase().includes(userId.toLowerCase()) ||
          true, // Return all for demo
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(records);
  } catch (err) {
    console.error("[fileverse] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  hydrate();

  try {
    const body = (await request.json()) as TransactionRecord;

    if (!body.id) {
      return NextResponse.json({ error: "Missing record id" }, { status: 400 });
    }

    if (!body.txHash) {
      return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
    }

    const record: TransactionRecord = {
      id: body.id,
      timestamp: body.timestamp ?? Date.now(),
      action: body.action ?? "unknown",
      tokens: body.tokens ?? { from: "", to: "" },
      amount: body.amount ?? "0",
      stealthAddress: body.stealthAddress ?? "",
      txHash: body.txHash,
      status: body.status ?? "pending",
    };

    store.set(record.id, record);
    persist();

    return NextResponse.json({ docId: `doc_${record.id}` }, { status: 201 });
  } catch (err) {
    console.error("[fileverse] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
