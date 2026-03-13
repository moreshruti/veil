# BitGo Integration ($2,000 Bounty)

## Overview

BitGo provides institutional-grade multi-signature wallet custody. Veil integrates BitGo as an optional custody layer for transaction approval, allowing organizations to require multi-sig approval before executing DeFi operations.

## Integration Status

**Mock Only**

The API client and proxy route exist with correct structure, but BitGo is never called in the actual transaction flow. The settings page displays "Powered by BitGo" branding but saves configuration to localStorage only.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/bitgo/client.ts` | BitGo API client with 5 functions |
| `app/api/bitgo/route.ts` | API proxy to `app.bitgo-test.com` with auth headers |
| `app/settings/` | Settings page with BitGo branding (localStorage only) |

## How It Works

### API Client (`lib/bitgo/client.ts`)

Exposes 5 functions that call the internal proxy route:

| Function | BitGo Endpoint | Purpose |
|----------|---------------|---------|
| `createWallet()` | `POST /api/v2/:coin/wallet` | Create a new multi-sig wallet |
| `getWallet()` | `GET /api/v2/:coin/wallet/:id` | Retrieve wallet details |
| `proposeTransaction()` | `POST /api/v2/:coin/wallet/:id/tx/build` | Build and propose a transaction |
| `approveTransaction()` | `PUT /api/v2/:coin/pendingapprovals/:id` | Approve a pending transaction |
| `setPolicy()` | `PUT /api/v2/:coin/wallet/:id/policy` | Set spending limits or whitelist rules |

### API Proxy (`app/api/bitgo/route.ts`)

Maps incoming requests to BitGo's REST API:

```
Client --> /api/bitgo (Next.js route) --> app.bitgo-test.com/api/v2/...
                                          ^
                                          | Authorization: Bearer $BITGO_ACCESS_TOKEN
```

### Current Gap

`transaction-flow.ts` sends transactions directly via `sendTransactionAsync` without calling `proposeTransaction()` or `approveTransaction()`. The BitGo client is imported nowhere in the transaction pipeline.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITGO_ACCESS_TOKEN` | Yes | API token from BitGo dashboard (test or production) |
| `BITGO_ENTERPRISE_ID` | Yes | Enterprise ID for wallet creation |

Both are currently undefined -- the proxy route will fail without them.

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| `lib/bitgo/client.ts` | Real code, correct API signatures, never called |
| `app/api/bitgo/route.ts` | Real proxy, correct auth headers, never hit |
| Settings page | UI only, saves to localStorage, no BitGo API calls |
| Transaction flow | No BitGo involvement whatsoever |

## Steps to Go Live

1. **Get BitGo credentials**: Sign up at [bitgo.com](https://www.bitgo.com), create a test enterprise, generate an access token.
2. **Set environment variables**:
   ```env
   BITGO_ACCESS_TOKEN=v2x...your-token
   BITGO_ENTERPRISE_ID=your-enterprise-id
   ```
3. **Wire into transaction flow**: In `transaction-flow.ts`, before calling `sendTransactionAsync`:
   ```typescript
   import { proposeTransaction, approveTransaction } from '@/lib/bitgo/client'

   // After building the transaction, before sending:
   const proposal = await proposeTransaction(walletId, txParams)
   // For hackathon demo, auto-approve:
   await approveTransaction(proposal.pendingApprovalId)
   ```
4. **Create a BitGo wallet**: Call `createWallet()` during onboarding or from the settings page.
5. **Add policy rules**: Use `setPolicy()` to demonstrate spending limits (e.g., max $500 per transaction without additional approval).
6. **Test on BitGo testnet**: The proxy already points to `app.bitgo-test.com` -- use testnet coins.
