# ENS Integration ($2,000 Bounty)

## Overview

ENS (Ethereum Name Service) provides human-readable names for Ethereum addresses. Veil uses ENS for both wallet display (reverse resolution) and transaction recipient resolution (forward resolution), making the AI chat experience more natural.

## Integration Status

**Fully Integrated (Real On-Chain)**

ENS resolution works via viem's publicClient against Ethereum mainnet. No mocks needed -- all lookups are real on-chain calls. This is the most production-ready integration.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/ens/resolve.ts` | 5 ENS resolution functions using viem publicClient |
| `components/WalletButton.tsx` | Displays ENS name + avatar via `useEnsName` / `useEnsAvatar` |
| `components/WalletInfo.tsx` | Shows ENS identity in wallet details panel |
| `lib/stealth/transaction-flow.ts` | Forward-resolves ENS names to addresses before sending |
| `lib/ai/x402-client.ts` | Extracts `.eth` names from natural language via regex |
| `contracts/VeilAgent.sol` | `ensName` field for on-chain agent identity |

## How It Works

### Forward Resolution (Name to Address)

When a user types "Send 1 ETH to alice.eth":

1. `x402-client.ts` extracts `alice.eth` from the message using regex pattern `/[\w-]+\.eth/`
2. `transaction-flow.ts` calls `resolve.ts` to convert `alice.eth` to `0x...` address
3. Transaction is sent to the resolved address

```typescript
// lib/ens/resolve.ts
const address = await publicClient.getEnsAddress({ name: 'alice.eth' })
```

### Reverse Resolution (Address to Name)

When displaying connected wallet or transaction history:

1. `WalletButton.tsx` uses wagmi's `useEnsName({ address })` hook
2. `WalletInfo.tsx` shows the resolved name alongside the address
3. `useEnsAvatar` fetches the user's ENS avatar for display

### Resolution Functions (`lib/ens/resolve.ts`)

| Function | Purpose |
|----------|---------|
| `resolveEnsName()` | Forward: name to address |
| `resolveEnsAddress()` | Reverse: address to name |
| `getEnsAvatar()` | Fetch avatar URL for a name |
| `getEnsTextRecord()` | Fetch arbitrary text records (description, url, etc.) |
| `batchResolve()` | Resolve multiple names in parallel |

## Environment Variables

None required. ENS resolution uses viem's default Ethereum mainnet RPC. The general web3 config variables apply:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ALCHEMY_ID` | Recommended | Alchemy API key for reliable RPC (avoids rate limits) |

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| Forward resolution | Real on-chain via viem |
| Reverse resolution | Real on-chain via wagmi hooks |
| Avatar fetching | Real on-chain via wagmi hooks |
| Regex extraction in AI parser | Real (simple pattern matching) |
| `VeilAgent.sol` ensName field | Defined in contract, never set from frontend |
| ENS subname registration | Not implemented |

## Steps to Go Live

The ENS integration is already live for basic resolution. To complete:

1. **ENS subname registration**: Register `veil.eth` and implement subname registration so each AI agent gets a name like `agent-name.veil.eth`. Use the ENS NameWrapper contract.
2. **Wire VeilAgent.sol**: Call `VeilAgent.createAgent()` from the frontend during agent setup, passing the ENS name to store on-chain.
3. **Add ENS profile display**: Fetch and display text records (description, URL, Twitter) for transaction recipients to give users more confidence about who they are sending to.
4. **Handle resolution failures gracefully**: Currently, if an ENS name does not resolve, the error propagates. Add user-friendly error messages ("alice.eth does not exist or has no address set").
5. **Support other TLDs**: Consider supporting `.cb.id` (Coinbase) and other ENS-compatible names beyond `.eth`.
