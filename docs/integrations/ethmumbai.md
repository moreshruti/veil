# ETHMumbai Integration ($2,000 Bounty)

## Overview

Veil is an AI-powered private DeFi agent that uses stealth addresses to enable anonymous on-chain transactions. This is the core product concept submitted to the ETHMumbai hackathon -- the entire application is the integration.

## Integration Status

**Fully Integrated (Conceptual)**

The stealth address system, AI chat agent, and Solidity contracts are all built and functional. The cryptography uses a simplified approach (Web Crypto API) rather than production-grade secp256k1 ECDH.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/stealth/generate.ts` | Stealth address generation using Web Crypto API (simplified ERC-5564) |
| `lib/stealth/transaction-flow.ts` | Main transaction pipeline -- orchestrates all integrations |
| `lib/ai/x402-client.ts` | AI intent parsing for natural language DeFi commands |
| `contracts/VeilRegistry.sol` | On-chain stealth meta-address registry |
| `contracts/VeilAgent.sol` | AI agent identity contract with ENS integration |
| `contracts/VeilPaymaster.sol` | Gasless transaction paymaster (stub) |
| `app/chat/` | Main chat UI where users interact with the AI agent |

## How It Works

1. User registers a stealth meta-address via `VeilRegistry.sol`
2. User types a natural language command in the chat UI (e.g., "Send 0.1 ETH to alice.eth privately")
3. `x402-client.ts` parses intent into structured action (recipient, amount, token, chain)
4. `transaction-flow.ts` generates a one-time stealth address for the recipient
5. Transaction is sent to the stealth address instead of the recipient's public address
6. Recipient scans the registry to detect and claim funds

### Stealth Address Generation (Simplified)

```
1. Generate ephemeral key pair (Web Crypto ECDH, P-256)
2. Derive shared secret with recipient's stealth meta-address
3. Hash shared secret to produce one-time stealth address
4. Publish ephemeral public key to registry for recipient scanning
```

## Environment Variables

None specific to the core concept. See individual integration docs for sponsor-specific env vars.

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| Stealth address math | Real but simplified (P-256 instead of secp256k1) |
| AI intent parsing | Real (local NLP with x402 fallback) |
| Solidity contracts | Real code, not deployed (addresses are 0x000...000) |
| Chat UI | Real, functional |
| Transaction execution | Real via wagmi/viem sendTransaction |

## Steps to Go Live

1. **Replace cryptography**: Swap Web Crypto API P-256 with proper secp256k1 ECDH to match ERC-5564 spec. Use a library like `@noble/secp256k1`.
2. **Deploy contracts**: Deploy `VeilRegistry.sol`, `VeilAgent.sol`, and `VeilPaymaster.sol` to Base Sepolia, then mainnet.
3. **Update contract addresses**: Replace `0x000...000` placeholders in `lib/web3/contracts.ts` with deployed addresses.
4. **Implement recipient scanning**: Build the off-chain scanning service that lets recipients detect incoming stealth payments.
5. **Audit stealth math**: The one-time address derivation needs cryptographic review before handling real funds.
