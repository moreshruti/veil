import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Fileverse API route
// In-memory store for the hackathon demo.
// GET: list records for a user (?userId=...) or fetch one (?docId=...)
// POST: save a new transaction record
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

// In-memory store — persists for the lifetime of the server process
const store = new Map<string, TransactionRecord>();

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
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
    // For demo purposes, filter by stealthAddress containing the userId
    // In production this would use proper user-doc associations
    const filtered = records.filter(
      (r) =>
        r.stealthAddress.toLowerCase().includes(userId.toLowerCase()) ||
        true, // Return all for demo
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(records);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TransactionRecord;

  if (!body.id) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  if (!body.txHash) {
    return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
  }

  store.set(body.id, {
    id: body.id,
    timestamp: body.timestamp ?? Date.now(),
    action: body.action ?? "unknown",
    tokens: body.tokens ?? { from: "", to: "" },
    amount: body.amount ?? "0",
    stealthAddress: body.stealthAddress ?? "",
    txHash: body.txHash,
    status: body.status ?? "pending",
  });

  return NextResponse.json({ docId: `doc_${body.id}` }, { status: 201 });
}
