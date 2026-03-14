# Implementation Plan — ETHMumbai 2026

**Scope:** 48-hour hackathon build (March 12-15, 2026)
**Stack:** Next.js 16 + TypeScript (strict) + Tailwind v4 + Bun + Biome
**Chain:** Base L2 (Smart Wallet + Paymaster)

---

## Part 0: Name — Retiring "Cloak"

"Cloak" collides with CloakCoin, Cloak Protocol, Scroll Cloak, CloakAI, and CloakedAgent. It needs to go.

### Top 5 Alternatives

| # | Name | Domain Vibes | Why It Works |
|---|------|-------------|--------------|
| 1 | **Veil** | `veil.finance` / `getveil.xyz` | One syllable. Instant privacy association. Clean brand. "Lift the veil on DeFi UX, not your identity." Works as a verb too: "Veil your transaction." |
| 2 | **Murmur** | `murmur.fi` / `murmur.xyz` | Chat-native. A murmur is speech only the intended listener hears. Perfect for a conversational privacy agent. Tagline: "Your money speaks in murmurs." |
| 3 | **Hush** | `hush.fi` / `hushmoney.xyz` | Four letters. Universally understood. "Hush" is both a command and a state. Slightly playful edge — judges remember playful. Tagline: "Talk to your money. Hush everything else." |
| 4 | **Shade** | `shade.fi` / `shadewallet.xyz` | Privacy + protection in one word. "Throw shade" has cultural resonance. Works across contexts: "Shade your transactions." "Stay in the Shade." |
| 5 | **Whispr** | `whispr.fi` / `whispr.xyz` | Chat-first branding. Whisper = private speech. The dropped 'e' signals tech/startup. Tagline: "Whisper to your wallet." |

**Recommendation: Veil.**
Shortest. Strongest brand recall. No existing web3 projects with that exact name. Works as noun ("the Veil"), verb ("Veil your swap"), and adjective ("Veiled transaction"). The tagline writes itself: *"Talk to your money. No one else can."* (unchanged from original).

From here, the plan uses **Veil** as the working name. Replace globally if another name is chosen.

---

## Part 1: Project Setup

### 1.1 Initialize (Hour 0-1)

```bash
bun create next-app veil --typescript --tailwind --app --src-dir
cd veil
bun add -d biome @biomejs/biome
```

### 1.2 Core Dependencies

| Category | Packages |
|----------|----------|
| **Web3 Core** | `wagmi` `viem` `@tanstack/react-query` `connectkit` or `@coinbase/onchainkit` |
| **ENS** | `@ensdomains/ensjs` |
| **BitGo** | `@bitgo/sdk-api` |
| **Fileverse** | `@fileverse-dev/ddoc` |
| **Base** | `@coinbase/onchainkit` (Smart Wallet, Paymaster) |
| **AI/Chat** | Custom fetch to HeyElsa x402 endpoint (no SDK — it's HTTP) |
| **UI** | `framer-motion` `lucide-react` `clsx` |
| **Smart Contracts** | `hardhat` or `forge` (separate `/contracts` directory) |

### 1.3 Project Structure

```
/src
  /app
    /(marketing)        # Landing page (SSG)
      /page.tsx
      /layout.tsx
    /(app)              # Authenticated app
      /chat/page.tsx
      /history/page.tsx
      /layout.tsx
    /api
      /x402/route.ts    # Proxy to HeyElsa x402
      /fileverse/route.ts
  /components
    /landing            # Landing page sections
    /chat               # Chat UI components
    /wallet             # Wallet connection components
    /ui                 # Shared primitives
  /lib
    /web3               # wagmi config, contract ABIs, helpers
    /ai                 # HeyElsa x402 client
    /bitgo              # BitGo SDK wrapper
    /ens                # ENS resolution helpers
    /fileverse          # Fileverse dDocs client
    /stealth            # Stealth address generation (ERC-5564)
  /contracts            # Solidity source (or separate /contracts root)
  /styles
    /globals.css        # Tailwind v4 imports
```

### 1.4 Environment Variables

```env
# HeyElsa x402
HEYELSA_X402_ENDPOINT=
HEYELSA_API_KEY=

# BitGo
BITGO_ACCESS_TOKEN=
BITGO_ENTERPRISE_ID=

# Fileverse
FILEVERSE_API_KEY=
FILEVERSE_NAMESPACE=

# Base / Web3
NEXT_PUBLIC_ALCHEMY_ID=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# ENS
NEXT_PUBLIC_ENS_REGISTRY=
```

---

## Part 2: Landing Page — Sections & Copy

The landing page is a single-page marketing site. Dark theme. Minimal. Privacy-first aesthetic (think: dark gradients, muted purples/blues, sharp typography).

### Section 1: Hero

**Layout:** Full viewport. Centered text. Subtle animated background (noise grain or mesh gradient). One CTA button.

```
Tagline:     "Talk to your money. No one else can."
Subtitle:    "Veil is an AI agent that executes DeFi operations
              privately on your behalf. You chat. It acts. No trace."
CTA:         [Launch App]  (primary)
             [Read the Docs] (secondary/ghost)
Badge:       "Built for ETHMumbai 2026 — Base L2"
```

Optional micro-interaction: a terminal-style typing animation showing:
```
> "Swap 2 ETH for USDC without linking to my main wallet"
> Routed through stealth address. 3,420 USDC received. No trace.
```

### Section 2: Problem Statement

**Layout:** Two-column. Left: bold statement. Right: supporting detail.

```
Headline:    "Every transaction you make is a permanent public record"
Body:        "Your employer, competitors, or anyone with an internet
              connection can see your entire financial history.
              Earnings. Spending. Net worth. Every trade.
              There's no private mode in DeFi."

Stat cards (3x):
  - "100%"  → "of on-chain transactions are publicly visible"
  - "$1.6B" → "DeFAI market with zero privacy solutions"
  - "0"     → "existing products that combine AI + privacy"
```

### Section 3: How It Works

**Layout:** Horizontal stepper (4 steps) with icons/illustrations. On mobile: vertical stack.

```
Step 1: Connect
"Sign in with your .eth name or Base Smart Wallet.
 Gasless. No seed phrases."
[Icon: wallet/key]

Step 2: Command
"Tell Veil what you need in plain English.
 'Send 500 USDC to vitalik.eth privately.'
 'Swap my ETH for cbBTC — keep it off the books.'"
[Icon: chat bubble]

Step 3: Review & Approve
"Veil proposes the transaction. You see the route,
 the fees, the policy check. One tap to approve.
 Multi-sig security — AI proposes, you decide."
[Icon: shield/checkmark]

Step 4: Execute Privately
"Stealth addresses. No link to your main wallet.
 Encrypted records on Fileverse. Only you can see them."
[Icon: lock/invisible]
```

### Section 4: Features Grid

**Layout:** 2x3 or 3x2 card grid. Each card: icon, title, one-line description.

```
Card 1: "Natural Language DeFi"
"Swap, send, bridge, lend — just say what you need.
 Powered by HeyElsa x402. Support for ETH, USDC, and cbBTC."

Card 2: "Stealth Addresses"
"Every transaction routes through a unique stealth address.
 No link back to your identity."

Card 3: "Multi-Sig Security"
"AI proposes. You approve. BitGo policy engine enforces
 spending limits, daily caps, and allowlists."

Card 4: "ENS Identity"
"Your agent has its own on-chain identity: you.veil.eth.
 Human-readable. Verifiable. Yours."

Card 5: "Encrypted Records"
"Transaction history stored as E2E encrypted dDocs on Fileverse.
 No surveillance. No vendor lock-in."

Card 6: "Gasless on Base"
"Smart Wallet + Paymaster. No gas tokens needed.
 Just connect and go."
```

### Section 5: Architecture Diagram

**Layout:** Full-width section with a clean SVG/canvas rendering of the architecture stack. Interactive on hover (tooltips showing sponsor names).

```
Headline:    "Six layers. One conversation."
Subhead:     "From your words to private execution in under 10 seconds."

[Visual: the 6-layer architecture diagram from the project doc,
 cleaned up and styled. Each layer labeled with the sponsor tech.]

Layer labels:
  Chat Interface      → Next.js + Base OnchainKit
  AI Intent Engine    → HeyElsa x402 (pay-per-call)
  Identity Layer      → ENS (.eth resolution)
  Policy Engine       → BitGo Multi-Sig
  Execution Layer     → Base L2 + Stealth Addresses
  Private Records     → Fileverse dDocs (E2E encrypted)
```

### Section 6: Sponsor / Bounty Integration Showcase

**Layout:** Logo bar or card row showing each sponsor with a one-liner on how Veil uses their technology. This is critical for hackathon optics — judges need to see integration at a glance.

```
Headline:    "Built with the best"

[ENS logo]        "On-chain agent identity via .eth subdomains"
[BitGo logo]      "Multi-sig vault with policy-governed execution"
[HeyElsa logo]    "x402 pay-per-call AI for natural language DeFi"
[Fileverse logo]  "E2E encrypted transaction records on dDocs"
[Base logo]       "Smart Wallet + Paymaster for gasless UX"
```

### Section 7: CTA / Waitlist

**Layout:** Centered. Dark card with gradient border. Email/wallet input.

```
Headline:    "Privacy shouldn't require a PhD in cryptography"
Subhead:     "Veil makes it invisible. Join the waitlist."
Input:       [your@email.com]  or  [Connect Wallet]
CTA button:  [Get Early Access]
Fine print:  "No spam. No tracking. Obviously."
```

### Section 8: Footer

```
Left:   Veil logo + "ETHMumbai 2026"
Center: Links → GitHub | Docs | Twitter/X
Right:  "Built by [team name]"
Bottom: "Your finances should be private by default."
```

---

## Part 3: App Pages (If Time Permits)

### Priority Order

| Priority | Page | Effort | Impact |
|----------|------|--------|--------|
| P0 | Chat Interface | 8-10 hrs | THE demo. This is the product. |
| P0 | Wallet Connection | 2-3 hrs | Required for chat to work. |
| P1 | Transaction History | 3-4 hrs | Shows Fileverse integration. |
| P2 | Settings/Policy | 2 hrs | Shows BitGo policy engine. |

### 3.1 Chat Interface (`/chat`)

The core product. This is what judges see live.

**Layout:** Full-height chat window. Message bubbles. Input bar at bottom. Sidebar with wallet info.

**Components needed:**
- `ChatWindow` — scrollable message list
- `ChatMessage` — individual message (user vs. agent variants)
- `ChatInput` — text input + send button (+ optional voice)
- `TransactionPreview` — inline card showing proposed tx details
- `ApprovalButton` — "Approve" / "Reject" for multi-sig flow
- `StatusIndicator` — processing, success, error states
- `WalletSidebar` — connected wallet, ENS name, balance

**Message types:**
```typescript
type MessageRole = "user" | "agent" | "system";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: {
    transaction?: TransactionPreview;
    policyCheck?: PolicyCheckResult;
    stealthAddress?: string;
    fileverseDocId?: string;
  };
};
```

**Flow:**
1. User types: "Swap 2 ETH for USDC privately"
2. Show typing indicator
3. Agent responds with parsed intent + proposed transaction card
4. User taps "Approve"
5. Agent executes via stealth address
6. Agent responds with confirmation + encrypted record link

### 3.2 Wallet Connection Flow

**Approach:** Use Base OnchainKit's `ConnectWallet` or ConnectKit. Support:
- Smart Wallet (gasless, recommended)
- MetaMask / injected
- WalletConnect
- ENS resolution on connect (show `vitalik.eth` not `0xd8dA...`)

**Components:**
- `ConnectButton` — branded connect trigger
- `WalletInfo` — ENS name, avatar, balance display
- `NetworkSwitcher` — ensure Base is selected

### 3.3 Transaction History (`/history`)

**Source:** Fileverse dDocs (E2E encrypted). Only the user can decrypt.

**Components:**
- `HistoryList` — chronological list of past transactions
- `HistoryItem` — date, action, amount, status, stealth address (truncated)
- `HistoryDetail` — expanded view with full Fileverse dDoc content
- `ExportButton` — download encrypted records

---

## Part 4: Smart Contract Architecture

### Contracts Needed (Minimal Viable)

For a 48-hour hackathon, do NOT build a full privacy protocol. Use existing primitives (ERC-5564 stealth addresses) and write thin wrapper contracts.

#### Contract 1: `StealthAddressRegistry.sol`

**Purpose:** Register and look up stealth meta-addresses for users. Based on ERC-5564.

```solidity
// Core functions
function registerStealthMetaAddress(bytes calldata stealthMetaAddress) external;
function getStealthMetaAddress(address user) external view returns (bytes memory);

// Events
event StealthMetaAddressRegistered(address indexed user, bytes stealthMetaAddress);
```

**Effort:** 2-3 hours
**Bounty relevance:** BitGo (stealth addresses), Base (on-chain deployment)

#### Contract 2: `AgentPolicy.sol`

**Purpose:** On-chain policy rules that the AI agent must respect. BitGo integration point.

```solidity
struct Policy {
    uint256 dailyLimit;          // Max spend per day in USD
    uint256 perTxLimit;          // Max per transaction
    address[] allowedTokens;     // Whitelisted tokens
    address[] allowedRecipients; // Whitelisted recipients (optional)
    bool requireMultiSig;        // Require user approval
}

function setPolicy(Policy calldata policy) external;
function checkPolicy(address token, uint256 amount, address to) external view returns (bool);
function recordSpend(address token, uint256 amount) external; // Called after execution
```

**Effort:** 3-4 hours
**Bounty relevance:** BitGo (policy engine), ENS (agent identity)

#### Contract 3: `VeilAgent.sol` (Optional — P2)

**Purpose:** The agent's on-chain identity. Owns an ENS subdomain. Executes transactions on behalf of user within policy bounds.

```solidity
function executeOnBehalf(
    address target,
    bytes calldata data,
    uint256 value,
    bytes calldata userSignature  // Multi-sig approval
) external returns (bytes memory);
```

**Effort:** 4-5 hours (stretch goal)

### Deployment Plan

- **Network:** Base Sepolia (testnet) for hackathon, Base mainnet for demo if time allows
- **Tool:** Hardhat or Foundry (Forge). Foundry preferred for speed.
- **Verification:** Verify on BaseScan for judge credibility

---

## Part 5: API Integration Plan

### 5.1 HeyElsa x402 — The AI Brain

**What it does:** Natural language to DeFi intent parsing. Pay-per-call via x402 protocol (USDC on Base).

**Integration approach:**
```
User message → POST /api/x402 (Next.js API route)
  → Proxy to HeyElsa x402 endpoint
  → x402 payment header attached (USDC micropayment)
  → Response: parsed intent { action, token, amount, recipient, route }
  → Frontend renders TransactionPreview
```

**Key implementation details:**
- x402 uses HTTP 402 Payment Required flow. The server returns a payment request, client pays via USDC, server fulfills.
- Wrap in a server-side API route to keep keys off the client.
- Parse response into structured `DeFiIntent` type.
- If using OpenClaw skills: register swap/lend/bridge as callable skills.

**Bounty alignment:** "x402 + OpenClaw" ($1K) + "Real-World Solving" ($1K)

### 5.2 BitGo SDK — Multi-Sig & Policy

**What it does:** Creates multi-sig wallets. Enforces policies. AI proposes transactions, user approves.

**Integration approach:**
```
1. On user onboarding:
   → bitgo.wallets().generateWallet({ label, passphrase, enterprise })
   → Store wallet ID associated with user

2. On transaction proposal:
   → bitgo.wallets().get({ id }).createTransaction({ recipients, policy })
   → Return unsigned tx to frontend for user approval

3. On user approval:
   → User signs with Smart Wallet
   → bitgo.wallets().get({ id }).sendTransaction({ txHex, userSignature })
```

**Key details:**
- BitGo SDK runs server-side only (access token is secret).
- For hackathon: use BitGo testnet environment.
- Policy engine: set daily limits, per-tx limits, allowlisted tokens.
- Stealth address flow: generate stealth address -> BitGo sends to stealth address -> user's main wallet is never exposed.

**Bounty alignment:** "Privacy App" ($1.2K)

### 5.3 ENS — Agent Identity

**What it does:** Gives the AI agent a human-readable on-chain identity. Users log in with .eth names.

**Integration approach:**
```
1. ENS Resolution (read):
   → ensjs: getName(address) for reverse resolution on connect
   → Display "vitalik.eth" instead of "0xd8dA..."

2. Agent Subdomain (write — P2):
   → Register "agent.veil.eth" or "username.veil.eth"
   → Set text records: { "ai.config": encryptedConfig, "description": "Veil Agent" }

3. Identity display:
   → Show ENS avatar, name throughout chat UI
```

**Key details:**
- ENS resolution is free (read-only).
- Subdomain registration requires owning a parent name (register `veil.eth` on testnet).
- Use wagmi's `useEnsName` and `useEnsAvatar` hooks for frontend.

**Bounty alignment:** "Creative Use" ($1K)

### 5.4 Fileverse dDocs — Encrypted Records

**What it does:** Store transaction history as E2E encrypted documents. No central server sees the data.

**Integration approach:**
```
1. After each transaction:
   → Create a new dDoc with transaction details
   → Encrypt with user's public key
   → Store document ID in local state + on-chain (optional)

2. Transaction history view:
   → Fetch all dDocs for user's namespace
   → Decrypt client-side
   → Render in /history page
```

**Key details:**
- Fileverse SDK handles encryption/decryption.
- Each transaction becomes a dDoc entry (JSON structured).
- Optional: generate AI-written financial summaries as dDocs (P2).

**Bounty alignment:** "Build What Big Tech Won't" ($1K)

### 5.5 Base — L2 Execution

**What it does:** Smart contract deployment. Smart Wallet for gasless UX. Paymaster for sponsored gas.

**Integration approach:**
```
1. OnchainKit:
   → <ConnectWallet /> component for Smart Wallet
   → Paymaster configuration for gasless transactions

2. Contract deployment:
   → Deploy StealthAddressRegistry + AgentPolicy to Base Sepolia
   → Verify on BaseScan

3. Transaction execution:
   → All DeFi operations route through Base
   → USDC (Base) for x402 payments to HeyElsa
```

**Bounty alignment:** "AI x Onchain" ($350) + "Privacy" ($350)

---

## Part 6: 48-Hour Timeline

### Phase 1: Foundation (Hours 0-8)

| Task | Owner | Hours | Parallel? |
|------|-------|-------|-----------|
| Project scaffold (Next.js + deps) | Dev 1 | 1 | -- |
| Wagmi config + wallet connection | Dev 1 | 2 | After scaffold |
| Landing page layout + hero section | Dev 2 | 3 | Yes |
| Smart contract stubs (Foundry init) | Dev 3 | 2 | Yes |
| Env setup + API route stubs | Dev 1 | 1 | After wagmi |
| Landing page: Problem + How It Works | Dev 2 | 2 | After hero |

### Phase 2: Core Integrations (Hours 8-24)

| Task | Owner | Hours | Parallel? |
|------|-------|-------|-----------|
| HeyElsa x402 integration + API route | Dev 1 | 4 | Yes |
| Chat UI (messages, input, layout) | Dev 2 | 5 | Yes |
| StealthAddressRegistry contract | Dev 3 | 3 | Yes |
| AgentPolicy contract | Dev 3 | 3 | After stealth |
| BitGo SDK wallet creation flow | Dev 1 | 3 | After x402 |
| Chat + x402 wiring (NL to intent) | Dev 1+2 | 3 | After both |
| Landing page: Features + Architecture | Dev 2 | 3 | Gap time |

### Phase 3: Integration & Polish (Hours 24-40)

| Task | Owner | Hours | Parallel? |
|------|-------|-------|-----------|
| Transaction approval flow (multi-sig UX) | Dev 1 | 4 | Yes |
| Stealth address generation (client-side) | Dev 3 | 3 | Yes |
| Fileverse dDocs integration | Dev 2 | 3 | Yes |
| ENS resolution in chat + wallet display | Dev 1 | 2 | After approval |
| Transaction history page | Dev 2 | 3 | After Fileverse |
| Contract deployment to Base Sepolia | Dev 3 | 1 | After contracts |
| Landing page: Sponsors + CTA + Footer | Dev 2 | 2 | Gap time |
| End-to-end flow testing | All | 3 | After wiring |

### Phase 4: Demo Prep (Hours 40-48)

| Task | Owner | Hours | Parallel? |
|------|-------|-------|-----------|
| Demo script — rehearse 3x | All | 2 | -- |
| Bug fixes + edge cases | All | 3 | Yes |
| Landing page responsive polish | Dev 2 | 2 | Yes |
| README + screenshots | Dev 3 | 1 | Yes |
| Record backup demo video | All | 1 | After rehearsal |

---

## Part 7: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HeyElsa x402 API is unstable/undocumented | Medium | Critical | Build mock AI responses early. Fallback to direct OpenAI + custom intent parser. |
| BitGo testnet access takes time to provision | Medium | High | Apply for API access immediately (Day 0). Fallback to simulated multi-sig with local keys. |
| Stealth address implementation too complex | Medium | Medium | Use existing ERC-5564 reference implementations. Simplify to address generation + registration only (skip full privacy proof). |
| Fileverse SDK has breaking changes or poor docs | Low | Low | It's a P1. If it fails, store encrypted JSON in IPFS or localStorage as fallback. |
| Gasless transactions fail on Base testnet | Low | Medium | Have a small ETH faucet balance as backup. Remove Paymaster claim from demo if broken. |
| 48 hours is not enough | High | High | The priority tiers (P0/P1/P2) exist for this reason. Cut P2 entirely if behind schedule. A working chat + x402 + wallet connection is a viable demo alone. |

---

## Part 8: What to Cut if Behind Schedule

**Must ship (P0) — the demo collapses without these:**
1. Landing page (at least Hero + How It Works + CTA)
2. Chat interface with HeyElsa x402 integration
3. Wallet connection on Base
4. One working flow: "Swap X for Y" via natural language

**Should ship (P1) — significant bounty value:**
5. BitGo multi-sig approval flow
6. Stealth address generation
7. Fileverse encrypted records
8. ENS name resolution

**Nice to have (P2) — cut without guilt:**
9. ENS subdomain minting for agent identity
10. AI-generated financial summaries
11. Transaction history page
12. VeilAgent.sol contract
13. Voice input

---

## Part 9: Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wallet library | OnchainKit (Coinbase) | Aligns with Base bounty. Smart Wallet + Paymaster built in. |
| Contract tooling | Foundry | Faster compilation and testing than Hardhat. Better for 48-hour sprint. |
| AI integration | Server-side proxy | Keep HeyElsa API keys off client. Enables response shaping before frontend. |
| Privacy approach | ERC-5564 stealth addresses (simplified) | Don't build a mixer. Don't use ZK proofs. Stealth addresses are simpler, compliant, and sufficient for demo. |
| State management | React Query + Context | No Redux/Zustand needed. Chat state in Context. Server state via React Query. |
| Styling | Tailwind v4 + CSS variables | Dark theme via CSS custom properties. No component library — too heavy for hackathon. |

---

## Part 10: Success Criteria

- [ ] A judge can open the app, connect a wallet, and execute a natural language DeFi command
- [ ] The transaction routes through a stealth address (verifiable on BaseScan)
- [ ] ENS names display instead of raw addresses
- [ ] Transaction records are stored encrypted on Fileverse
- [ ] Policy engine rejects a transaction that exceeds the daily limit
- [ ] Landing page clearly communicates the problem, solution, and sponsor integrations
- [ ] Demo runs under 4 minutes with zero crashes
- [ ] All 6 sponsor integrations are visible and functional (even if minimal)

---

## Appendix A: Sponsor Bounty Checklist

Use this during development to ensure nothing is missed.

**ENS ($2K bounty)**
- [ ] ENS name resolution on wallet connect
- [ ] ENS avatar display in chat
- [ ] Agent subdomain registration (P2)
- [ ] Text records for agent config (P2)
- [ ] Mention ENS in README and demo

**BitGo ($2K bounty)**
- [ ] Multi-sig wallet creation via SDK
- [ ] Policy rules (daily limit, per-tx limit)
- [ ] AI proposes -> user approves flow
- [ ] Stealth address integration
- [ ] Mention BitGo in README and demo

**HeyElsa ($2K bounty)**
- [ ] x402 pay-per-call integration
- [ ] Natural language to DeFi intent parsing
- [ ] At least 2 working commands (swap, send)
- [ ] OpenClaw skill registration (if time)
- [ ] Mention HeyElsa in README and demo

**Fileverse ($1K bounty)**
- [ ] E2E encrypted dDoc creation per transaction
- [ ] Client-side decryption for history view
- [ ] No plaintext records anywhere
- [ ] Mention Fileverse in README and demo

**Base ($1K bounty)**
- [ ] Deployed contracts on Base (Sepolia or mainnet)
- [ ] Smart Wallet integration
- [ ] Paymaster for gasless UX
- [ ] USDC on Base for x402 payments
- [ ] Mention Base in README and demo

**ETHMumbai Tracks**
- [ ] Privacy track submission
- [ ] AI track submission
- [ ] Demo video recorded as backup

---

## Appendix B: Demo Script (Draft)

```
[Open landing page — 30 seconds]
"This is Veil. An AI agent that manages your DeFi portfolio
 through natural language — privately."
[Scroll through problem, how it works, architecture]

[Connect wallet — 15 seconds]
"I connect with my ENS name. No seed phrases. Gasless."
[Show ENS name resolving, Smart Wallet connect]

[Chat demo — 2 minutes]
"Watch this. I type: 'Swap 1 ETH for cbBTC privately.'"
[Show AI parsing intent]
"Veil parses the intent via HeyElsa's x402 API."
[Show transaction preview card]
"It proposes the transaction. I see the route, the fees,
 the policy check — my daily limit is $5K, this is within bounds."
[Tap approve]
"One tap. BitGo multi-sig approves. The swap executes through
 a stealth address on Base. My main wallet is never exposed."
[Show confirmation]
"The record is encrypted and stored on Fileverse.
 Only I can see it. Not Veil. Not the chain. Just me."

[Show transaction on BaseScan — 15 seconds]
"Here's the on-chain proof. Stealth address. No link to my identity."

[Close — 30 seconds]
"Six sponsor integrations. One conversation. Financial privacy
 that doesn't require a PhD in cryptography."
```

Total: ~3.5 minutes. Leaves buffer for questions.
