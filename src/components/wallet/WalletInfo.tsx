"use client";

import {
  useAccount,
  useEnsName,
  useEnsAvatar,
  useBalance,
  useReadContract,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";
import clsx from "clsx";
import { formatAddress } from "@/lib/ens/resolve";

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

function NetworkIndicator({ chainId }: { chainId: number | undefined }) {
  const networks: Record<number, string> = {
    8453: "Base",
    84532: "Base Sepolia",
    1: "Ethereum",
  };
  const name = chainId
    ? networks[chainId] ?? `Chain ${chainId}`
    : "Disconnected";
  const isSupported = chainId === 8453 || chainId === 84532 || chainId === 1;

  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          "w-2 h-2",
          isSupported ? "bg-success" : "bg-error"
        )}
      />
      <span className="font-mono text-[10px] uppercase tracking-widest text-c7">
        {name}
      </span>
    </div>
  );
}

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
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

  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) return null;

  const displayName = formatAddress(address, ensName ?? undefined);
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

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

  function handleCopy() {
    if (address) navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-c2 border border-c3 p-4 flex flex-col gap-4">
      {/* Avatar + Identity */}
      <div className="flex items-center gap-3">
        {ensAvatar ? (
          <img
            src={ensAvatar}
            alt={displayName}
            className="w-10 h-10 object-cover border border-c3"
          />
        ) : (
          <div className="w-10 h-10 bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="font-mono text-xs text-accent">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-sm text-c12 truncate">
            {displayName}
          </span>
          {ensName && (
            <span className="font-mono text-[11px] text-c5 truncate">
              {truncated}
            </span>
          )}
        </div>
      </div>

      {/* Network */}
      <NetworkIndicator chainId={chain?.id} />

      {/* Balances */}
      <div className="flex flex-col gap-2 border-t border-c3 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-c5">
          Balances
        </span>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-c7">ETH</span>
          <span className="font-mono text-xs text-c12">{ethFormatted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-c7">USDC</span>
          <span className="font-mono text-xs text-c12">{usdcFormatted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-c7">cbBTC</span>
          <span className="font-mono text-xs text-c12">{cbbtcFormatted}</span>
        </div>
      </div>

      {/* Copy Address */}
      <button
        onClick={handleCopy}
        className={clsx(
          "flex items-center justify-center gap-2",
          "w-full py-2",
          "font-mono text-[11px] uppercase tracking-wider",
          "border border-c3 text-c7",
          "transition-all duration-150",
          "hover:border-c4 hover:text-c12",
          "cursor-pointer"
        )}
      >
        {copied ? (
          <>
            <Check size={12} />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy Address
          </>
        )}
      </button>
    </div>
  );
}
