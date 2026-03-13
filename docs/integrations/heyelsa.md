# HeyElsa x402 Integration ($2,000 Bounty)

## Overview

HeyElsa provides an AI-powered DeFi execution API using the x402 payment protocol. Veil uses HeyElsa's x402 endpoint for natural language intent parsing and DeFi action execution (swaps, sends, bridges, portfolio queries). When the x402 endpoint is unreachable, the system falls back to a local NLP mock.

## Integration Status

**Partially Integrated**

The x402 payment flow (request, receive 402, pay, retry) is fully implemented. The local NLP fallback works for all supported actions. Real HeyElsa API calls depend on environment variables being set.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/ai/x402-client.ts` | 342-line AI client with intent parsing, swap execution, portfolio queries |
| `app/api/x402/route.ts` | Server-side x402 payment handling route |
| `lib/stealth/transaction-flow.ts` | Calls x402 client for intent parsing during transaction flow |

## How It Works

### x402 Payment Flow

The x402 protocol enables pay-per-request AI API access:

```
1. Client sends request to HeyElsa endpoint
2. Server responds with HTTP 402 (Payment Required)
   - Response includes payment details (amount, recipient, network)
3. Client makes on-chain payment (or signs receipt)
4. Client retries original request with X-Payment-Receipt header
5. Server validates receipt and returns AI response
```

Implementation in `app/api/x402/route.ts`:

```
POST /api/x402
  --> Forward to HEYELSA_X402_ENDPOINT
  --> If 402: extract payment details from response
  --> Make payment / generate receipt
  --> Retry with header: X-Payment-Receipt: <receipt>
  --> Return AI response to client
```

### Local NLP Mock (Fallback)

When the x402 endpoint is unavailable, `x402-client.ts` uses regex-based intent extraction:

| Capability | Details |
|------------|---------|
| **Actions** | swap, send, bridge, lend, portfolio |
| **Tokens** | 10 known tokens (ETH, USDC, USDT, DAI, WETH, WBTC, LINK, UNI, AAVE, MATIC) |
| **Recipients** | ENS names (`*.eth`) and hex addresses (`0x...`) |
| **Chains** | 6 supported (Ethereum, Base, Polygon, Arbitrum, Optimism, Avalanche) |
| **Amounts** | Numeric extraction with token symbol association |

### Key Functions (`lib/ai/x402-client.ts`)

| Function | Purpose |
|----------|---------|
| `parseIntent()` | Extract structured action from natural language |
| `executeSwap()` | Execute a token swap via HeyElsa or mock |
| `getPortfolio()` | Fetch portfolio breakdown |
| `sendTransaction()` | Build and send a transfer |
| `bridgeTokens()` | Cross-chain bridge execution |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HEYELSA_X402_ENDPOINT` | Yes | `https://x402-api.heyelsa.ai/api/` | HeyElsa x402 API base URL |
| `HEYELSA_API_KEY` | Yes* | None | API key or wallet private key for x402 payments |

*Without these, the system falls back to local NLP mock (which works for parsing but cannot execute real swaps).

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| x402 payment flow (402 -> pay -> retry) | Real implementation in route handler |
| Intent parsing (with HeyElsa) | Real when env vars are set |
| Intent parsing (local fallback) | Real regex-based NLP, no external calls |
| Swap execution | Mock -- `executeSwap()` exists but is not wired into the on-chain execution path |
| Portfolio queries | Mock -- returns simulated data when HeyElsa is unavailable |
| Payment receipt generation | Implemented but untested against live endpoint |

## Steps to Go Live

1. **Get HeyElsa credentials**: Contact HeyElsa team or sign up at their developer portal. Obtain an API key.
2. **Set environment variables**:
   ```env
   HEYELSA_X402_ENDPOINT=https://x402-api.heyelsa.ai/api/
   HEYELSA_API_KEY=your-api-key-here
   ```
3. **Test the x402 flow**: Send a request to `/api/x402` and verify the 402 -> payment -> retry cycle works end-to-end.
4. **Wire `executeSwap()` into execution**: In `transaction-flow.ts`, after parsing intent, optionally route swap actions through `executeSwap()` instead of building the transaction manually.
5. **Add payment tracking**: Log x402 payment amounts so users know what they are paying for AI API access.
6. **Handle payment failures**: Add retry logic and user-facing errors when x402 payment fails (insufficient funds, network issues).
