import { createConfig, http } from "wagmi";
import { base, baseSepolia, mainnet } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";
import { BUILDER_CODE, getBuilderCodeSuffix } from "./builder-code";

/**
 * Veil's wagmi config with ERC-8021 Builder Code support
 * Builder code (BUILDER_CODE) is used to:
 * - Track Veil transactions on Base
 * - Earn referral fees on facilitated transactions
 * - Identify Veil as the builder for analytics
 *
 * Builder codes are appended to transaction data via appendBuilderCode()
 * when sending transactions on supported chains (Base, Base Sepolia)
 *
 * See: /src/lib/web3/builder-code.ts for utilities
 */
export const config = createConfig(
  getDefaultConfig({
    chains: [base, baseSepolia, mainnet],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [mainnet.id]: http(),
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
    appName: "Veil",
    appDescription: "Talk to your money. No one else can.",
    appUrl: typeof window !== "undefined" ? window.location.origin : "",
  })
);

// Export builder code utilities for use in transaction preparation
export { BUILDER_CODE, getBuilderCodeSuffix } from "./builder-code";
