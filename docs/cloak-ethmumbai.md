# Cloak — AI-Powered Private DeFi Agent with On-Chain Identity

**Tagline:** *"Talk to your money. No one else can."*

**Event:** ETHMumbai 2026 | March 12-15, 2026

---

## The Problem (Real & Relatable)

Every DeFi transaction you make is a **permanent public record**. Your employer, competitors, or anyone can see your entire financial history — earnings, spending, net worth, every trade. There's no "private mode" in DeFi. And interacting with DeFi protocols still requires deep technical knowledge.

## The Solution

Cloak is an **AI agent with its own on-chain identity** that executes DeFi operations privately on your behalf via natural language. You chat, it acts — privately.

```
You: "Swap 2 ETH for USDC without linking to my main wallet"
Cloak: ✅ Routed through stealth address → Executed on Base → 3,420 USDC received
        Policy check: ✅ Within $5K daily limit. Record saved (encrypted).
```

---

## Bounty Integration Strategy

| Sponsor | Integration | Bounty Target | Amount |
|---------|------------|---------------|--------|
| **ENS** ($2K) | Agent gets its own ENS identity (`yourname.cloak.eth`). Users identified by `.eth` names, not raw addresses. Text records store encrypted agent config. | Creative Use ($1K) + Pool Prize | $1,000+ |
| **BitGo** ($2K) | Multi-sig vault — AI **proposes** transactions, user **approves**. Policy engine enforces spending limits, daily caps, allowlists. Stealth addresses for privacy. | Privacy App ($1.2K) | $1,200 |
| **HeyElsa** ($2K) | x402 pay-per-call API powers the AI brain. Natural language → DeFi execution. OpenClaw skills for swap/lend/bridge workflows. | x402 + OpenClaw ($1K) + Real-World Solving ($1K) | $1,000–$2,000 |
| **Fileverse** ($1K) | All transaction records, strategy notes, and financial summaries stored as E2E encrypted dDocs. No surveillance, no vendor lock-in. | Build What Big Tech Won't ($1K) | $1,000 |
| **Base** ($1K) | Deployed on Base. Uses Smart Wallet for gasless onboarding + Paymaster. x402 agent payments in USDC on Base. | AI x Onchain ($350) + Privacy ($350) | $350–$700 |
| **ETHMumbai** ($2K) | Hits Privacy Track + AI Track simultaneously | $500 + $500 | $500–$1,000 |

### Total Bounty Potential: $5,000 – $6,900

---

## BTC Support — cbBTC on Base

**Strategy:** Use cbBTC (Coinbase Wrapped BTC) as the BTC representation on Base.

**Flow:**
- User's BTC secured by BitGo custody (multi-sig)
- Wrapped to cbBTC on Base (ERC-20)
- Stealth address transactions work (same as ETH/USDC)
- Can unwrap back to BTC via BitGo

**Supported Tokens:**
- ETH (native on Base)
- USDC (ERC-20 on Base)
- cbBTC (Coinbase Wrapped BTC, ERC-20 on Base)

**Bounty alignment:**
- BitGo: BTC custody is their core product
- Base: cbBTC is Coinbase's own wrapped BTC
- Privacy story intact: cbBTC is ERC-20, stealth addresses work

**Pitch line:** "Your BTC. Secured by BitGo. Private on Base."

---

## Architecture

```
┌─────────────────────────────────────┐
│         Chat Interface              │
│   (Next.js + Base OnchainKit)       │
│   Login with name.eth (ENS)         │
│   Gasless via Smart Wallet          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       AI Intent Engine              │
│   HeyElsa x402 API (pay-per-call)  │
│   "Swap 2 ETH to USDC privately"   │
│   → Parsed intent + optimal route   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Identity Layer                │
│   ENS resolution (name.eth → addr)  │
│   Agent identity: agent.cloak.eth   │
│   Text records for config/metadata  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Policy & Security Engine      │
│   BitGo Multi-Sig Vault            │
│   AI proposes → User approves       │
│   Spending limits, allowlists       │
│   Stealth addresses for privacy     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Execution Layer               │
│   Base L2 Smart Contracts           │
│   Stealth address routing           │
│   Paymaster (gasless for users)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Private Record Store          │
│   Fileverse dDocs (E2E encrypted)   │
│   Transaction logs, strategies      │
│   No surveillance, no lock-in       │
└─────────────────────────────────────┘
```

---

## Why This Wins in 2026

1. **Peak trend intersection**: AI Agents + Privacy + DeFi + On-chain Identity — the four hottest themes right now
2. **AI agents with economic identity** is literally what Base's bounty description asks for ("AI agents with onchain economic identity, agentic commerce infrastructure")
3. **Real use case**: Financial privacy is a fundamental right, not a niche feature. Everyone from freelancers to DAO contributors needs this
4. **Incredible demo**: Live chat → real execution → verifiable on-chain. Judges can use it in real-time
5. **Not overdone**: There's no "privacy DeFi copilot" in the market. Tornado Cash was shut down, leaving a massive gap
6. **Portfolio signal**: Shows full-stack web3 (smart contracts, AI integration, privacy engineering, identity systems, L2 deployment)

---

## Key Features for MVP (48-hour hackathon scope)

| Priority | Feature | Complexity |
|----------|---------|-----------|
| P0 | Chat UI with ENS login on Base | Medium |
| P0 | HeyElsa x402 integration for swap/send commands | Medium |
| P0 | BitGo multi-sig wallet creation + policy rules | Medium |
| P1 | Stealth address generation for private transfers | Hard |
| P1 | Fileverse dDocs for encrypted transaction history | Easy |
| P2 | ENS subdomain minting for agent identity | Easy |
| P2 | Auto-generated financial summaries (AI) | Easy |

---

## Competitive Edge

| What Others Will Build | Why Cloak Is Better |
|----------------------|-------------------|
| Simple chatbot + swap | Cloak adds **privacy layer + multi-sig security** |
| Basic multi-sig wallet | Cloak adds **AI copilot + natural language** |
| Privacy mixer | Cloak is **compliant** (policy-governed, not a mixer) |
| ENS profile page | Cloak uses ENS as **functional agent identity**, not vanity |

---

## One-Liner for Judges

> *"Cloak is a privacy-first AI agent that manages your DeFi portfolio through natural language, secured by multi-sig policies, identified by ENS, with encrypted records — because your finances should be private by default."*

---

## Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind + Base OnchainKit
- **AI Layer**: HeyElsa x402 API (pay-per-call, USDC on Base)
- **Identity**: ENS (ensjs, wagmi hooks)
- **Wallet Infrastructure**: BitGo SDK (multi-sig, policy engine)
- **Storage**: Fileverse dDocs SDK (E2E encrypted documents)
- **Chain**: Base L2 (Smart Wallet + Paymaster for gasless UX)
- **Smart Contracts**: Solidity (stealth address registry, agent policy contracts)

---

## Sponsor SDKs & Links

- **BitGo**: `npm install @bitgo/sdk-api` | [developers.bitgo.com](https://developers.bitgo.com/)
- **ENS**: `npm install @ensdomains/ensjs` | [docs.ens.domains](https://docs.ens.domains/web/quickstart/)
- **HeyElsa x402**: [x402.heyelsa.ai/docs](https://x402.heyelsa.ai/docs) | [github.com/HeyElsa](https://github.com/HeyElsa)
- **Fileverse dDocs**: `npm install @fileverse-dev/ddoc` | [docs.fileverse.io](https://docs.fileverse.io/)
- **Base OnchainKit**: [base.org/build/onchainkit](https://www.base.org/build/onchainkit)
- **Coinbase AgentKit**: `npm install @coinbase/cdp-agentkit-core` | [docs.cdp.coinbase.com/agent-kit](https://docs.cdp.coinbase.com/agent-kit/welcome)
