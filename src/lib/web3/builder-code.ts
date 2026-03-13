import { toHex, concat, isHex } from "viem";

/**
 * Builder code for Veil (Ethereum Mumbai hackathon entry)
 * Register at base.org/builders for production deployment
 * Used to track Veil's transactions and earn referral fees on Base
 */
export const BUILDER_CODE = "veil-ethmumbai-2026";

/**
 * Get the builder code as a hex-encoded suffix
 * This is appended to transaction data to earn referral fees on Base
 */
export function getBuilderCodeSuffix(): `0x${string}` {
  return toHex(BUILDER_CODE);
}

/**
 * Append the builder code suffix to transaction data
 * Used to track Veil's transactions and earn referral fees
 *
 * @param data - The original transaction data (hex string)
 * @returns The transaction data with builder code appended
 */
export function appendBuilderCode(data: `0x${string}`): `0x${string}` {
  if (!isHex(data)) {
    throw new Error("Invalid data format. Expected hex string.");
  }
  const suffix = getBuilderCodeSuffix();
  return concat([data, suffix]) as `0x${string}`;
}
