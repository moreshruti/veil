import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_ID
      ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
      : undefined,
  ),
});

/**
 * Resolve an Ethereum address to its primary ENS name.
 * Returns null if no name is set.
 */
export async function resolveENSName(
  address: Address
): Promise<string | null> {
  try {
    return await publicClient.getEnsName({ address });
  } catch {
    return null;
  }
}

/**
 * Resolve an ENS name's avatar URL.
 * Returns null if no avatar is set.
 */
export async function resolveENSAvatar(
  name: string
): Promise<string | null> {
  try {
    return await publicClient.getEnsAvatar({ name: normalize(name) });
  } catch {
    return null;
  }
}

/**
 * Format an address for display.
 * Returns the ENS name if available, otherwise a truncated address.
 */
export function formatAddress(
  address: string,
  ensName?: string
): string {
  if (ensName) return ensName;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if a string is an ENS name (ends with .eth).
 */
export function isENSName(input: string): boolean {
  return input.endsWith(".eth");
}

/**
 * Forward-resolve an ENS name to an Ethereum address.
 * Returns null if the name does not resolve.
 */
export async function resolveENSToAddress(
  name: string
): Promise<Address | null> {
  try {
    return await publicClient.getEnsAddress({ name: normalize(name) });
  } catch {
    return null;
  }
}
