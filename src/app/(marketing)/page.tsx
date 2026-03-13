"use client";

import {
  Shield,
  MessageSquare,
  Lock,
  Wallet,
  Eye,
  Zap,
  ArrowRight,
  ExternalLink,
  Fingerprint,
  FileText,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Reusable primitives                                                */
/* ------------------------------------------------------------------ */

function HatchDivider() {
  return <div className="hatch-divider" />;
}

function SectionLabel({ children }: { children: string }) {
  return <p className="label mb-4">{children}</p>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* ---- Vertical Guide Lines ---- */}
      <div
        className="pointer-events-none fixed inset-0 z-40 mx-auto max-w-[960px]"
        aria-hidden="true"
      >
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.08] flow-line-v" />
        <div className="absolute right-6 top-0 bottom-0 w-px bg-white/[0.08] flow-line-v" />
      </div>

      <div className="max-w-[960px] mx-auto px-6">
        {/* ============================================================ */}
        {/*  1. HERO                                                     */}
        {/* ============================================================ */}
        <section className="pt-44 pb-28">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px flex-1 max-w-12 border-t border-dashed border-c5" />
            <span className="badge">ETHMumbai 2026</span>
            <span className="h-px flex-1 max-w-12 border-t border-dashed border-c5" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-c12 leading-[1.1] mb-6">
            Talk To Your
            <br />
            Money Privately
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-c7 font-mono max-w-md mb-10 leading-relaxed">
            An AI agent that executes DeFi operations on your behalf. You chat.
            It acts. No trace.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button className="btn btn-filled">
              Launch App
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn"
            >
              How It Works
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  2. STATS STRIP                                              */}
        {/* ============================================================ */}
        <section className="section flow-line">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-c2">
            {(
              [
                ["100%", "of transactions publicly visible"],
                ["$1.6B", "DeFAI market. Zero privacy"],
                ["6", "sponsor integrations incl. cbBTC"],
                ["0", "products combining AI + privacy"],
              ] as const
            ).map(([value, label]) => (
              <div key={value} className="bg-background px-6 py-8">
                <p className="text-2xl font-semibold text-c12 tabular-nums tracking-tight font-mono">
                  {value}
                </p>
                <p className="text-xs text-c7 font-mono mt-1 leading-relaxed">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  3. HOW IT WORKS                                             */}
        {/* ============================================================ */}
        <section id="how-it-works" className="section flow-line">
          <div className="px-8 pt-10 pb-8">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-2xl uppercase tracking-tight text-c11 mb-10">
              Four steps to private DeFi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-c2">
              {[
                {
                  step: "01",
                  title: "Connect",
                  desc: "Sign in with your .eth name. No seed phrases. No gas.",
                  icon: Wallet,
                },
                {
                  step: "02",
                  title: "Command",
                  desc: "Tell Veil what you need. Plain English. 'Swap 0.1 BTC privately.' ETH, USDC, cbBTC.",
                  icon: MessageSquare,
                },
                {
                  step: "03",
                  title: "Review",
                  desc: "Veil proposes. You see the route, fees, policy check. One tap to approve.",
                  icon: Eye,
                },
                {
                  step: "04",
                  title: "Execute",
                  desc: "Stealth address. No link to your wallet. Encrypted record. Only you.",
                  icon: Shield,
                },
              ].map((item) => (
                <div key={item.step} className="bg-background p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] text-c5 font-mono tabular-nums">
                      {item.step}
                    </span>
                    <item.icon size={14} className="text-c5" />
                  </div>
                  <h3 className="text-sm font-mono font-medium text-c12 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-c7 font-mono leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  4. FEATURES                                                 */}
        {/* ============================================================ */}
        <section id="features" className="section flow-line">
          <div className="px-8 pt-10 pb-8">
            <SectionLabel>Why Veil</SectionLabel>
            <h2 className="text-2xl uppercase tracking-tight text-c11 mb-10">
              Privacy that doesn&apos;t need a manual
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-c2">
              {[
                {
                  icon: MessageSquare,
                  title: "Natural Language DeFi",
                  desc: "Swap ETH, USDC, or cbBTC. Say what you need. The AI handles the rest.",
                },
                {
                  icon: Fingerprint,
                  title: "Stealth Addresses",
                  desc: "Every transaction. Fresh address. No link back.",
                },
                {
                  icon: Lock,
                  title: "Multi-Sig Security",
                  desc: "AI proposes. You approve. BitGo policy engine enforces the rules.",
                },
                {
                  icon: Wallet,
                  title: "ENS Identity",
                  desc: "Your agent gets a name. you.veil.eth. Human-readable. Verifiable.",
                },
                {
                  icon: FileText,
                  title: "Encrypted Records",
                  desc: "Transaction history on Fileverse. E2E encrypted. No surveillance.",
                },
                {
                  icon: Zap,
                  title: "Gasless on Base",
                  desc: "Smart Wallet. Paymaster. No gas tokens. Just go.",
                },
              ].map((feature) => (
                <div key={feature.title} className="bg-background p-6">
                  <feature.icon size={16} className="text-c5 mb-4" />
                  <h3 className="text-sm font-mono font-medium text-c12 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-c7 font-mono leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  5. ARCHITECTURE / PROTOCOL STACK                            */}
        {/* ============================================================ */}
        <section id="architecture" className="section flow-line">
          <div className="px-8 pt-10 pb-8">
            <SectionLabel>Protocol Stack</SectionLabel>
            <h2 className="text-2xl uppercase tracking-tight text-c11 mb-10">
              Six layers. One conversation.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8">
              {/* ASCII-style stacked diagram */}
              <div className="font-mono text-xs leading-loose">
                {[
                  { layer: "Chat Interface", tech: "Next.js + OnchainKit" },
                  { layer: "AI Intent Engine", tech: "HeyElsa x402" },
                  { layer: "Identity Layer", tech: "ENS" },
                  { layer: "Policy Engine", tech: "BitGo Multi-Sig" },
                  { layer: "Execution Layer", tech: "Base L2" },
                  { layer: "Private Records", tech: "Fileverse dDocs" },
                ].map((row, i) => (
                  <div key={row.layer} className="border border-border -mt-px">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-c5 tabular-nums w-4">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-c11">{row.layer}</span>
                      </div>
                      <span className="text-c5">{row.tech}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Layer descriptions */}
              <div className="space-y-6">
                {[
                  {
                    title: "Chat Interface",
                    desc: "You type. Natural language in, structured intent out. No forms. No dropdowns.",
                  },
                  {
                    title: "AI Intent Engine",
                    desc: "Parses your request. Finds the optimal route. Respects your constraints.",
                  },
                  {
                    title: "Identity Layer",
                    desc: "ENS resolves who you are. Subnames give your agent a human-readable handle.",
                  },
                  {
                    title: "Policy Engine",
                    desc: "Multi-sig guardrails. Spending limits. Whitelist enforcement. AI cannot go rogue.",
                  },
                  {
                    title: "Execution Layer",
                    desc: "Base L2. Fast. Cheap. Stealth addresses mask the destination.",
                  },
                  {
                    title: "Private Records",
                    desc: "Fileverse stores your history. E2E encrypted. Only your keys unlock it.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <h4 className="text-xs font-mono font-medium text-c9 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs font-mono text-c7 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  6. SPONSOR BAR                                              */}
        {/* ============================================================ */}
        <section className="section flow-line">
          <div className="px-8 pt-10 pb-8">
            <SectionLabel>Built With</SectionLabel>
            <h2 className="text-2xl uppercase tracking-tight text-c11 mb-10">
              Built with the best
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-px bg-c2">
              {[
                {
                  name: "ENS",
                  desc: "Identity. Subnames. Human-readable addresses.",
                },
                {
                  name: "BitGo",
                  desc: "Multi-sig. Policy engine. Institutional custody.",
                },
                {
                  name: "HeyElsa",
                  desc: "AI intent parsing. x402 protocol. Natural language DeFi.",
                },
                {
                  name: "Fileverse",
                  desc: "E2E encrypted docs. On-chain storage. Private records.",
                },
                {
                  name: "Base",
                  desc: "L2 execution. Paymaster. Gasless transactions.",
                },
              ].map((sponsor) => (
                <div key={sponsor.name} className="bg-background p-5">
                  <h3 className="text-sm font-mono font-medium text-c12 mb-1.5">
                    {sponsor.name}
                  </h3>
                  <p className="text-[11px] text-c7 font-mono leading-relaxed">
                    {sponsor.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  7. CTA                                                      */}
        {/* ============================================================ */}
        <section className="section flow-line">
          <div className="px-8 pt-20 pb-20 text-center">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-tight text-c12 mb-4">
              Privacy shouldn&apos;t require a PhD
            </h2>
            <p className="text-sm text-c7 font-mono mb-10">
              Veil makes it invisible.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button className="btn btn-filled">
                Launch App
                <ArrowRight size={14} />
              </button>
              <button className="btn">
                Read the Docs
                <ExternalLink size={12} />
              </button>
            </div>

            <p className="text-[10px] text-c5 font-mono mt-8 tracking-wide">
              No spam. No tracking. Obviously.
            </p>
          </div>
        </section>

        <HatchDivider />

        {/* ============================================================ */}
        {/*  8. FOOTER PLACEHOLDER                                       */}
        {/* ============================================================ */}
        <footer className="border-t border-border px-8 py-8 flex items-center justify-between">
          <p className="label">Veil</p>
          <p className="text-[10px] text-c5 font-mono">ETHMumbai 2026</p>
        </footer>
      </div>
    </div>
  );
}
