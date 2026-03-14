# Veil

AI-powered private DeFi agent on Base. Talk to your money. No one else can.

## What is Veil?

Veil is a conversational DeFi agent that executes financial operations privately through stealth addresses on Base L2. You type what you want in plain English. Veil parses intent, generates one-time stealth addresses, enforces spending policies, and settles on-chain. No transaction history linking back to you.

## Architecture

```
Chat Interface  -->  AI Intent Engine  -->  Identity Layer  -->  Policy Engine  -->  Execution Layer  -->  Private Records
   (Next.js)        (HeyElsa x402)           (ENS)              (BitGo)            (Base L2)            (Fileverse)
```

**Chat Interface** -- Natural language input, real-time feedback, wallet connection via ConnectKit.

**AI Intent Engine** -- HeyElsa x402 parses "send 0.1 ETH to vitalik.eth" into structured transaction intents.

**Identity Layer** -- ENS resolution maps human-readable names to addresses.

**Policy Engine** -- BitGo multi-sig enforces spending limits and approval policies before execution.

**Execution Layer** -- Stealth addresses (ERC-5564) on Base ensure recipient privacy. Builder codes (ERC-8021) for MEV-aware submission.

**Private Records** -- Fileverse stores encrypted transaction records. Only the user can decrypt.

## Features

- **Natural language DeFi** -- type what you want, skip the UI
- **Stealth addresses (ERC-5564)** -- one-time addresses per transaction, no on-chain link to recipient
- **Multi-sig policy enforcement (BitGo)** -- spending limits and approval flows before anything executes
- **ENS identity resolution** -- send to names, not hex strings
- **Encrypted transaction records (Fileverse)** -- private, user-owned history
- **Builder codes (ERC-8021)** -- MEV-aware transaction submission on Base
- **cbBTC support** -- native Bitcoin on Base via Coinbase

## Bounty Integrations

| Sponsor | Bounty | Integration |
|---------|--------|-------------|
| **Base** | Build on Base | Stealth address contracts deployed on Base L2, cbBTC support |
| **HeyElsa** | x402 AI Agent | Natural language intent parsing for DeFi operations |
| **BitGo** | Multi-sig Custody | Policy engine with spending limits and multi-sig approval |
| **ENS** | Identity | Name resolution for human-readable transaction targets |
| **Fileverse** | Private Storage | Encrypted, decentralized transaction record keeping |
| **Coinbase** | Smart Wallet / cbBTC | ConnectKit wallet connection, cbBTC token integration |

## Tech Stack

- **Framework** -- Next.js 16, React 19, TypeScript
- **Styling** -- Tailwind v4
- **Web3** -- wagmi v3, viem, ConnectKit
- **Contracts** -- Solidity, Foundry
- **Chain** -- Base (L2)
- **Runtime** -- Bun

## Getting Started

```bash
git clone https://github.com/moreshruti/veil
cd veil
bun install
cp .env.example .env
# Fill in API keys (see Environment Variables below)
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### App (`/.env`)

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `HEYELSA_X402_ENDPOINT` | Yes | Pre-filled (`https://x402-api.heyelsa.ai/api/`) |
| `HEYELSA_API_KEY` | Yes | [x402.heyelsa.ai](https://x402.heyelsa.ai) |
| `BITGO_ACCESS_TOKEN` | Yes | [app.bitgo-test.com](https://app.bitgo-test.com) |
| `NEXT_PUBLIC_ALCHEMY_ID` | Yes | [alchemy.com](https://alchemy.com) |

### Contracts (`/contracts/.env`)

| Variable | Required | Source |
|----------|----------|--------|
| `DEPLOYER_PRIVATE_KEY` | Yes | Your deployer wallet |
| `BASE_SEPOLIA_RPC_URL` | Optional | Defaults to `https://sepolia.base.org` |
| `BASESCAN_API_KEY` | Optional | [basescan.org](https://basescan.org) (for verification) |

## Smart Contracts

Three Solidity contracts in `contracts/src/`, built with Foundry:

- **`StealthAddressRegistry.sol`** -- On-chain registry mapping stealth meta-addresses for ERC-5564 key exchange
- **`VeilAgent.sol`** -- Core agent contract that coordinates stealth generation and transaction execution
- **`AgentPolicy.sol`** -- Configurable spending policies (limits, allowlists, time locks)

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

## Project Structure

```
src/
  app/           # Next.js app router (marketing + chat pages)
  components/    # UI: chat, landing, wallet, layout
  hooks/         # useStealthRegistry, useStealthTransaction, useVeilAgent
  lib/
    ai/          # HeyElsa x402 client
    stealth/     # Stealth address generation and transaction flow
    ens/         # ENS name resolution
    bitgo/       # BitGo policy and custody client
    fileverse/   # Encrypted record storage
    web3/        # Chain config, ABIs, builder codes
contracts/       # Foundry project (Solidity + tests)
docs/            # Architecture and integration docs
```

## License

MIT
