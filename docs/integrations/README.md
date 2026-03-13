# Veil - Bounty Sponsor Integrations

Summary of all 6 bounty sponsor integrations for the ETHMumbai 2026 hackathon.

## Status Overview

| Sponsor | Bounty | Status | Integration Level |
|---------|--------|--------|-------------------|
| [ETHMumbai](./ethmumbai.md) | $2,000 | Fully Integrated (Conceptual) | Core product concept, stealth addresses, AI agent, contracts |
| [BitGo](./bitgo.md) | $2,000 | Mock Only | API proxy exists, never called in transaction flow |
| [ENS](./ens.md) | $2,000 | Fully Integrated (Real On-Chain) | Forward + reverse resolution via viem, live on mainnet |
| [HeyElsa x402](./heyelsa.md) | $2,000 | Partially Integrated | Real x402 payment flow, falls back to local NLP mock |
| [Fileverse](./fileverse.md) | $1,000 | Mock Only | In-memory Map + localStorage, no Fileverse SDK |
| [Base](./base.md) | $1,000 | Partially Integrated | Chain config + builder code active, no paymaster |

**Total bounty pool: $10,000**

## Status Definitions

- **Fully Integrated (Real On-Chain)**: Uses real protocols with on-chain calls. Production-viable with minor improvements.
- **Fully Integrated (Conceptual)**: Core architecture is built and functional but uses simplified cryptography or undeployed contracts.
- **Partially Integrated**: Real integration code exists and runs, but key features fall back to mocks or are missing.
- **Mock Only**: API client and route exist with correct structure, but all data is simulated. No real external calls are made.

## Architecture

All integrations flow through the main transaction pipeline:

```
Chat UI --> AI Intent Parser --> transaction-flow.ts --> On-chain Execution
                |                       |                       |
                v                       v                       v
          HeyElsa x402           ENS Resolution           Base Builder Code
          (NLP parsing)        BitGo (not wired)         Fileverse (record)
                                Stealth Addresses
```

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Set the environment variables listed in each integration doc
3. Run `bun dev` -- mock integrations work out of the box
4. See individual docs for steps to go live with each sponsor's real API
