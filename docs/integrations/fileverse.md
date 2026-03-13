# Fileverse Integration ($1,000 Bounty)

## Overview

Fileverse provides decentralized, end-to-end encrypted file storage and collaboration. Veil uses Fileverse to store transaction records, creating an encrypted audit trail of all DeFi operations performed through the AI agent.

## Integration Status

**Mock Only**

The integration uses an in-memory `Map` on the server and `localStorage` on the client. No Fileverse SDK is installed, no external API calls are made. The UI links to `portal.fileverse.io` but records are not actually stored there.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/fileverse/client.ts` | Client-side functions for storing/retrieving transaction records |
| `app/api/fileverse/route.ts` | Server-side route using in-memory `Map` as data store |
| `lib/stealth/transaction-flow.ts` | Calls `recordTransaction()` after every transaction execution |
| `app/history/` | History page displaying stored transaction records |
| UI components | `HistoryItem` links to `portal.fileverse.io` |

## How It Works

### Transaction Recording

After every transaction executed through `transaction-flow.ts`:

```
1. Transaction completes (success or failure)
2. transaction-flow.ts calls recordTransaction() from fileverse client
3. Client POSTs record to /api/fileverse
4. Server stores record in in-memory Map (keyed by transaction hash)
5. Record also saved to localStorage as backup
```

### Data Flow

```
transaction-flow.ts
  --> recordTransaction({ hash, from, to, amount, token, chain, timestamp })
    --> POST /api/fileverse  (in-memory Map on server)
    --> localStorage.setItem  (client-side backup)

History Page
  --> GET /api/fileverse  (reads from Map)
  --> Falls back to localStorage if server returns empty
  --> Renders HistoryItem components with portal.fileverse.io links
```

### What Gets Stored

Each transaction record contains:
- Transaction hash
- Sender and recipient addresses
- Amount and token
- Chain
- Timestamp
- Status (success/failure)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FILEVERSE_API_KEY` | No* | None | Fileverse API key (defined but never read) |
| `FILEVERSE_NAMESPACE` | No* | None | Fileverse namespace for data isolation (defined but never read) |

*Both variables are defined in the codebase but are not actually used by any code path.

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| `recordTransaction()` | Real function, stores to mock backend |
| Server data store | In-memory `Map` -- resets on every server restart |
| Client data store | `localStorage` -- persists but not encrypted, not decentralized |
| History page UI | Real, displays records from mock stores |
| Portal links | Link to `portal.fileverse.io` but records do not exist there |
| E2E encryption | Not implemented |
| Fileverse SDK | Not installed |

## Steps to Go Live

1. **Install Fileverse SDK**:
   ```bash
   bun add @fileverse/sdk
   ```
2. **Set environment variables**:
   ```env
   FILEVERSE_API_KEY=your-api-key
   FILEVERSE_NAMESPACE=veil-transactions
   ```
3. **Replace in-memory Map**: In `app/api/fileverse/route.ts`, replace the `Map` with real Fileverse SDK calls:
   ```typescript
   import { Fileverse } from '@fileverse/sdk'

   const fv = new Fileverse({ apiKey: process.env.FILEVERSE_API_KEY })

   // Store record
   await fv.create({ namespace: process.env.FILEVERSE_NAMESPACE, data: record })

   // Retrieve records
   const records = await fv.list({ namespace: process.env.FILEVERSE_NAMESPACE })
   ```
4. **Add E2E encryption**: Encrypt transaction records before storing. Use the user's wallet key to derive an encryption key so only the wallet owner can decrypt their history.
5. **Update portal links**: Replace static `portal.fileverse.io` links with actual document URLs returned by the Fileverse SDK after storage.
6. **Remove localStorage fallback**: Once real persistence is in place, the localStorage backup is no longer needed.
7. **Add pagination**: The history page currently loads all records. Add pagination for users with many transactions.
