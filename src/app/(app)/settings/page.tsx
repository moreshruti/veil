"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useEnsName,
  useBalance,
  useReadContract,
  useDisconnect,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { formatUnits } from "viem";
import clsx from "clsx";
import toast from "react-hot-toast";
import {
  Shield,
  RefreshCw,
  Wallet,
  Unplug,
  Copy,
  Check,
  Blocks,
  Brain,
  Fingerprint,
  FileText,
  Globe,
  Lock,
  Bot,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  generateStealthMetaAddress,
  formatStealthAddress,
  type StealthMetaAddress,
} from "@/lib/stealth/generate";
import { formatAddress } from "@/lib/ens/resolve";
import { useVeilAgent } from "@/hooks/useVeilAgent";
import { useStealthRegistry } from "@/hooks/useStealthRegistry";

/* --------------------------------------------------------------------------
   CONSTANTS
   -------------------------------------------------------------------------- */

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const USDC_DECIMALS = 6;

const CBBTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" as const;
const CBBTC_DECIMALS = 8;

const erc20BalanceOfAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ALLOWED_TOKENS = ["ETH", "USDC", "cbBTC"] as const;
type AllowedToken = (typeof ALLOWED_TOKENS)[number];

/* --------------------------------------------------------------------------
   SECTION LABEL
   -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono">
      {children}
    </p>
  );
}

/* --------------------------------------------------------------------------
   TOGGLE SWITCH
   -------------------------------------------------------------------------- */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border transition-colors duration-200",
        checked
          ? "bg-accent/20 border-accent/50"
          : "bg-c2 border-c3"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform transition-transform duration-200",
          checked
            ? "translate-x-5.5 bg-accent"
            : "translate-x-1 bg-c5"
        )}
      />
    </button>
  );
}

/* --------------------------------------------------------------------------
   INPUT FIELD
   -------------------------------------------------------------------------- */

function InputField({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-[0.2em] text-c5 font-mono block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-c1 border border-c3 px-4 py-2.5 text-sm text-c12 font-mono placeholder:text-c6 focus:border-c5 focus:outline-none transition-colors"
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
   INTEGRATION STATUS CARD
   -------------------------------------------------------------------------- */

type IntegrationStatus = "connected" | "active" | "pending" | "inactive";

function statusColor(status: IntegrationStatus): string {
  switch (status) {
    case "connected":
    case "active":
      return "border-l-green-500";
    case "pending":
      return "border-l-yellow-500";
    case "inactive":
      return "border-l-red-500";
  }
}

function statusBadgeColor(status: IntegrationStatus): string {
  switch (status) {
    case "connected":
    case "active":
      return "text-green-500 border-green-500/30 bg-green-500/5";
    case "pending":
      return "text-yellow-500 border-yellow-500/30 bg-yellow-500/5";
    case "inactive":
      return "text-red-500 border-red-500/30 bg-red-500/5";
  }
}

function IntegrationCard({
  icon,
  name,
  description,
  status,
  detail,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  status: IntegrationStatus;
  detail: string;
}) {
  return (
    <div
      className={clsx(
        "bg-c2 border border-c3 border-l-2 p-4 flex items-start gap-4 transition-colors hover:bg-c3/50",
        statusColor(status)
      )}
    >
      <div className="shrink-0 text-c7">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-mono text-sm text-c12">{name}</h4>
          <span
            className={clsx(
              "inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono border",
              statusBadgeColor(status)
            )}
          >
            {status}
          </span>
        </div>
        <p className="font-mono text-xs text-c5 mt-0.5">{description}</p>
        <p className="font-mono text-xs text-c9 mt-2">{detail}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   LOCALSTORAGE KEYS
   -------------------------------------------------------------------------- */

const POLICY_STORAGE_KEY = "veil-policy";
const TX_RECORDS_STORAGE_KEY = "veil_tx_records";

/* --------------------------------------------------------------------------
   LOCALSTORAGE HELPERS
   -------------------------------------------------------------------------- */

type SavedPolicy = {
  dailyLimit: string;
  perTxLimit: string;
  requireApproval: boolean;
  allowedTokens: AllowedToken[];
};

type TxRecord = {
  id: string;
  timestamp: number;
  action: string;
  amount: string;
  stealthAddress: string;
  status: string;
};

function loadPolicy(): SavedPolicy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPolicy) : null;
  } catch {
    return null;
  }
}

function loadTxRecords(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TX_RECORDS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

function countUniqueStealthAddresses(records: TxRecord[]): number {
  const unique = new Set(records.map((r) => r.stealthAddress).filter(Boolean));
  return unique.size;
}

function countPrivateTransactions(records: TxRecord[]): number {
  return records.length;
}

function sumTodaysSpending(records: TxRecord[]): number {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  return records
    .filter((r) => r.timestamp >= startOfDay)
    .reduce((sum, r) => {
      const amount = parseFloat(r.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
}

/* --------------------------------------------------------------------------
   SETTINGS PAGE
   -------------------------------------------------------------------------- */

export default function SettingsPage() {
  /* -- Wallet state -- */
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });
  const { data: ethBalance } = useBalance({ address });
  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20BalanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 8453,
  });
  const { data: cbbtcRaw } = useReadContract({
    address: CBBTC_ADDRESS,
    abi: erc20BalanceOfAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 8453,
  });
  const { disconnect } = useDisconnect();

  /* -- Agent & Registry hooks -- */
  const {
    agent,
    createAgent,
    isAgentActive,
    isLoading: agentLoading,
    error: agentError,
  } = useVeilAgent();
  const {
    registeredMeta,
    registerMetaAddress,
    isLoading: registryLoading,
    error: registryError,
  } = useStealthRegistry();

  const [agentEnsInput, setAgentEnsInput] = useState("");
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isRegisteringMeta, setIsRegisteringMeta] = useState(false);

  /* -- Stealth state -- */
  const [stealthMeta, setStealthMeta] = useState<StealthMetaAddress | null>(
    null
  );
  const [stealthCount, setStealthCount] = useState(0);
  const [privateTxCount, setPrivateTxCount] = useState(0);

  useEffect(() => {
    setStealthMeta(generateStealthMetaAddress());

    // Load real counts from localStorage transaction records
    const records = loadTxRecords();
    setStealthCount(countUniqueStealthAddresses(records));
    setPrivateTxCount(countPrivateTransactions(records));
  }, []);

  const handleRegenerate = useCallback(() => {
    setStealthMeta(generateStealthMetaAddress());
    setStealthCount((c) => c + 1);
    toast.success("Stealth meta-address regenerated");
  }, []);

  const handleCreateAgent = useCallback(async () => {
    const name = agentEnsInput.trim() || ensName || "veil-agent";
    setIsCreatingAgent(true);
    try {
      await createAgent(name);
      toast.success("Agent identity created");
      setAgentEnsInput("");
    } catch {
      toast.error(agentError ?? "Failed to create agent identity");
    } finally {
      setIsCreatingAgent(false);
    }
  }, [agentEnsInput, ensName, createAgent, agentError]);

  const handleRegisterMeta = useCallback(async () => {
    if (!stealthMeta) return;
    setIsRegisteringMeta(true);
    try {
      await registerMetaAddress(stealthMeta.metaAddress);
      toast.success("Stealth meta-address registered");
    } catch {
      toast.error(registryError ?? "Failed to register meta-address");
    } finally {
      setIsRegisteringMeta(false);
    }
  }, [stealthMeta, registerMetaAddress, registryError]);

  /* -- Policy state -- */
  const [dailyLimit, setDailyLimit] = useState("5000");
  const [perTxLimit, setPerTxLimit] = useState("1000");
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowedTokens, setAllowedTokens] = useState<Set<AllowedToken>>(
    new Set(ALLOWED_TOKENS)
  );
  const [dailySpent, setDailySpent] = useState(0);

  // Load saved policy and daily spending from localStorage on mount
  useEffect(() => {
    const saved = loadPolicy();
    if (saved) {
      setDailyLimit(saved.dailyLimit);
      setPerTxLimit(saved.perTxLimit);
      setRequireApproval(saved.requireApproval);
      setAllowedTokens(
        new Set(
          saved.allowedTokens.filter((t): t is AllowedToken =>
            ALLOWED_TOKENS.includes(t as AllowedToken)
          )
        )
      );
    }

    const records = loadTxRecords();
    setDailySpent(sumTodaysSpending(records));
  }, []);

  function toggleToken(token: AllowedToken) {
    setAllowedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(token)) {
        next.delete(token);
      } else {
        next.add(token);
      }
      return next;
    });
  }

  function handleSavePolicy() {
    const policy: SavedPolicy = {
      dailyLimit,
      perTxLimit,
      requireApproval,
      allowedTokens: Array.from(allowedTokens),
    };

    try {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policy));
    } catch {
      toast.error("Failed to save policy to local storage");
      return;
    }

    toast.success("Policy saved to local storage");
  }

  /* -- Copy address -- */
  const [copied, setCopied] = useState(false);
  function handleCopyAddress() {
    if (address) navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* -- Formatted balances -- */
  const ethFormatted = ethBalance
    ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
    : "0.0000";

  const usdcFormatted =
    typeof usdcRaw === "bigint"
      ? Number(formatUnits(usdcRaw, USDC_DECIMALS)).toFixed(2)
      : "0.00";

  const cbbtcFormatted =
    typeof cbbtcRaw === "bigint"
      ? Number(formatUnits(cbbtcRaw, CBBTC_DECIMALS)).toFixed(8)
      : "0.00000000";

  /* -- Progress bar width -- */
  const dailyLimitNum = Number(dailyLimit) || 1;
  const spentPercent = Math.min((dailySpent / dailyLimitNum) * 100, 100);

  /* -- Wallet display -- */
  const displayName = address
    ? formatAddress(address, ensName ?? undefined)
    : "Not connected";
  const networkName = chain?.name ?? "Disconnected";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container-narrow py-12 space-y-12">
        {/* ----------------------------------------------------------------
            SECTION 1: AGENT POLICY
            ---------------------------------------------------------------- */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-pixel text-c11 tracking-tight">
              Agent Policy
            </h2>
            <SectionLabel>
              Set spending limits for your AI agent. Powered by BitGo.
            </SectionLabel>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Daily Limit (USD)"
              value={dailyLimit}
              onChange={setDailyLimit}
              placeholder="5000"
            />
            <InputField
              label="Per-Transaction Limit (USD)"
              value={perTxLimit}
              onChange={setPerTxLimit}
              placeholder="1000"
            />
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between py-3 border-t border-b border-c3">
            <div>
              <p className="font-mono text-sm text-c12">Require Approval</p>
              <p className="font-mono text-xs text-c5 mt-0.5">
                Transactions above per-tx limit need manual approval
              </p>
            </div>
            <Toggle
              checked={requireApproval}
              onChange={setRequireApproval}
              label="Require approval for transactions"
            />
          </div>

          {/* Allowed Tokens */}
          <div className="space-y-3">
            <SectionLabel>Allowed Tokens</SectionLabel>
            <div className="flex items-center gap-4">
              {ALLOWED_TOKENS.map((token) => (
                <label
                  key={token}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={allowedTokens.has(token)}
                    onChange={() => toggleToken(token)}
                    className="sr-only peer"
                  />
                  <span
                    className={clsx(
                      "w-4 h-4 border flex items-center justify-center transition-colors",
                      allowedTokens.has(token)
                        ? "bg-accent/20 border-accent/50"
                        : "bg-c1 border-c3 group-hover:border-c5"
                    )}
                  >
                    {allowedTokens.has(token) && (
                      <Check size={10} className="text-accent" />
                    )}
                  </span>
                  <span className="font-mono text-sm text-c9 group-hover:text-c12 transition-colors">
                    {token}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button variant="primary" onClick={handleSavePolicy}>
            Save Policy
          </Button>

          {/* Policy Status Card */}
          <div className="bg-c2 border border-c3 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Daily Spending</SectionLabel>
              <span className="font-mono text-xs text-c9">
                ${dailySpent.toLocaleString()} / ${Number(dailyLimit).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-c1 border border-c3">
              <div
                className={clsx(
                  "h-full transition-all duration-500",
                  spentPercent > 80 ? "bg-warning" : "bg-accent"
                )}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-c5">
                {spentPercent.toFixed(1)}% used
              </span>
              <span className="font-mono text-[10px] text-c5">
                ${(dailyLimitNum - dailySpent).toLocaleString()} remaining
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------
            SECTION 2: STEALTH IDENTITY
            ---------------------------------------------------------------- */}
        <section className="space-y-6 border-t border-c3 pt-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-pixel text-c11 tracking-tight">
              Stealth Identity
            </h2>
            <SectionLabel>
              Your privacy configuration for stealth transactions.
            </SectionLabel>
          </div>

          {/* Agent Identity */}
          <div className="bg-c2 border border-c3 p-4 space-y-3">
            <SectionLabel>Agent Identity</SectionLabel>
            {agent ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "w-2 h-2",
                      agent.active ? "bg-success" : "bg-error"
                    )}
                  />
                  <span className="font-mono text-xs text-c9">
                    {agent.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="font-mono text-xs text-c7">
                  ENS: <span className="text-c12">{agent.ensName}</span>
                </p>
                <p className="font-mono text-[10px] text-c5">
                  Created: {new Date(agent.createdAt * 1000).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-mono text-xs text-c5">
                  No agent identity found. Create one to enable AI-driven stealth transactions.
                </p>
                <input
                  type="text"
                  value={agentEnsInput}
                  onChange={(e) => setAgentEnsInput(e.target.value)}
                  placeholder={ensName ?? "your-name.eth"}
                  className="w-full bg-c1 border border-c3 px-4 py-2.5 text-sm text-c12 font-mono placeholder:text-c6 focus:border-c5 focus:outline-none transition-colors"
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Bot size={12} />}
                  loading={isCreatingAgent || agentLoading}
                  onClick={handleCreateAgent}
                >
                  Create Agent Identity
                </Button>
              </div>
            )}
          </div>

          {/* Meta-address display */}
          <div className="bg-c2 border border-c3 p-4 space-y-3">
            <SectionLabel>Current Stealth Meta-Address</SectionLabel>
            {stealthMeta ? (
              <p className="font-mono text-xs text-c9 break-all leading-relaxed">
                {stealthMeta.metaAddress}
              </p>
            ) : (
              <div className="h-4 w-full bg-c3 skeleton" />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={12} />}
                onClick={handleRegenerate}
              >
                Regenerate
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Upload size={12} />}
                loading={isRegisteringMeta || registryLoading}
                disabled={!stealthMeta}
                onClick={handleRegisterMeta}
              >
                {registeredMeta ? "Re-register" : "Register"} Meta-Address
              </Button>
            </div>
            {registeredMeta && (
              <div className="border-t border-c3 pt-3 mt-2">
                <SectionLabel>Registered On-Chain</SectionLabel>
                <p className="font-mono text-[10px] text-green-500 mt-1 break-all">
                  {registeredMeta}
                </p>
              </div>
            )}
          </div>

          {/* Stealth stats */}
          <div className="grid grid-cols-2 border border-c3">
            <div className="px-4 py-3 border-r border-c3">
              <SectionLabel>Stealth Addresses Generated</SectionLabel>
              <p className="text-lg text-c12 font-mono tabular-nums mt-1">
                {stealthCount}
              </p>
            </div>
            <div className="px-4 py-3">
              <SectionLabel>Private Transactions</SectionLabel>
              <p className="text-lg text-c12 font-mono tabular-nums mt-1">
                {privateTxCount}
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------
            SECTION 3: CONNECTED WALLET
            ---------------------------------------------------------------- */}
        <section className="space-y-6 border-t border-c3 pt-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-pixel text-c11 tracking-tight">
              Connected Wallet
            </h2>
            <SectionLabel>Your wallet configuration and balances.</SectionLabel>
          </div>

          <div className="bg-c2 border border-c3 p-4 space-y-4">
            {/* Address row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Wallet size={14} className="text-accent" />
                </div>
                <div>
                  <p className="font-mono text-sm text-c12">{displayName}</p>
                  {ensName && address && (
                    <p className="font-mono text-[11px] text-c5">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 px-2 py-1 text-c5 hover:text-c12 transition-colors cursor-pointer"
                aria-label="Copy wallet address"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>

            {/* Network */}
            <div className="flex items-center gap-2 border-t border-c3 pt-3">
              <span
                className={clsx(
                  "w-2 h-2",
                  isConnected ? "bg-success" : "bg-error"
                )}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-c7">
                {networkName}
                {chain?.id ? ` (${chain.id})` : ""}
              </span>
            </div>

            {/* Balances */}
            <div className="space-y-2 border-t border-c3 pt-3">
              <SectionLabel>Balances</SectionLabel>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-mono text-xs text-c5">ETH</p>
                  <p className="font-mono text-sm text-c12 tabular-nums">
                    {ethFormatted}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-c5">USDC</p>
                  <p className="font-mono text-sm text-c12 tabular-nums">
                    {usdcFormatted}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-c5">cbBTC</p>
                  <p className="font-mono text-sm text-c12 tabular-nums">
                    {cbbtcFormatted}
                  </p>
                </div>
              </div>
            </div>

            {/* Disconnect */}
            <div className="border-t border-c3 pt-3">
              <Button
                variant="danger"
                size="sm"
                icon={<Unplug size={12} />}
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------
            SECTION 4: INTEGRATIONS
            ---------------------------------------------------------------- */}
        <section className="space-y-6 border-t border-c3 pt-12 pb-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-pixel text-c11 tracking-tight">
              Integrations
            </h2>
            <SectionLabel>
              Status of connected services and protocols.
            </SectionLabel>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <IntegrationCard
              icon={<Lock size={18} />}
              name="BitGo"
              description="Multi-Sig Vault"
              status="pending"
              detail="Mock Mode — Configure BITGO_ACCESS_TOKEN in .env for live custody."
            />
            <IntegrationCard
              icon={<Brain size={18} />}
              name="HeyElsa"
              description="AI Engine (x402)"
              status="pending"
              detail="Mock Mode — Configure HEYELSA_X402_ENDPOINT in .env for live parsing."
            />
            <IntegrationCard
              icon={<Fingerprint size={18} />}
              name="ENS"
              description="Identity"
              status={ensName ? "connected" : "inactive"}
              detail={ensName ?? "No ENS name resolved"}
            />
            <IntegrationCard
              icon={<FileText size={18} />}
              name="Fileverse"
              description="Encrypted Records"
              status="active"
              detail={
                privateTxCount > 0
                  ? `${privateTxCount} encrypted record${privateTxCount === 1 ? "" : "s"} — E2E encrypted local storage`
                  : "E2E encrypted local storage active. 0 records."
              }
            />
            <IntegrationCard
              icon={<Globe size={18} />}
              name="Base"
              description="Network"
              status={chain?.id === 8453 ? "connected" : "pending"}
              detail={
                chain
                  ? `Chain ID: ${chain.id} | ${chain.name}`
                  : "Not connected to Base"
              }
            />
          </div>
          <p className="font-mono text-[10px] text-c5 mt-2">
            Configure API keys in .env for live mode. All services run in mock mode by default.
          </p>
        </section>
      </div>
    </div>
  );
}
