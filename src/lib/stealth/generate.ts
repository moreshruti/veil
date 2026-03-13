// ERC-5564 stealth address generation
// Simplified for hackathon demo
//
// Uses Web Crypto API for key generation and produces valid Ethereum-style
// addresses. For production, replace with full ERC-5564 implementation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StealthMetaAddress = {
  spendingKey: string;
  viewingKey: string;
  metaAddress: string;
};

export type StealthAddressResult = {
  stealthAddress: string;
  ephemeralPubKey: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function generateRandomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  // Fallback for environments without Web Crypto
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const hash = await globalThis.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
    return new Uint8Array(hash);
  }
  // Minimal fallback: XOR-fold the input (NOT cryptographically secure, demo only)
  const result = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    result[i % 32] ^= data[i];
  }
  return result;
}

function toEthAddress(bytes: Uint8Array): string {
  // Take last 20 bytes and format as Ethereum address
  const addressBytes = bytes.slice(bytes.length - 20);
  return `0x${bytesToHex(addressBytes)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a new stealth meta-address consisting of a spending key,
 * viewing key, and the combined meta-address.
 *
 * The meta-address format: st:eth:0x<spendingPubKey><viewingPubKey>
 */
export function generateStealthMetaAddress(): StealthMetaAddress {
  const spendingKeyBytes = generateRandomBytes(32);
  const viewingKeyBytes = generateRandomBytes(32);

  const spendingKey = `0x${bytesToHex(spendingKeyBytes)}`;
  const viewingKey = `0x${bytesToHex(viewingKeyBytes)}`;

  // Meta-address encodes both public keys (simplified: using raw keys as "public" for demo)
  const metaAddress = `st:eth:0x${bytesToHex(spendingKeyBytes)}${bytesToHex(viewingKeyBytes)}`;

  return { spendingKey, viewingKey, metaAddress };
}

/**
 * Generates a one-time stealth address from a meta-address and ephemeral key.
 *
 * In production ERC-5564, this involves elliptic curve Diffie-Hellman.
 * For the hackathon, we derive the stealth address by hashing the
 * ephemeral key with the meta-address spending key component.
 */
export async function generateStealthAddress(
  metaAddress: string,
  ephemeralKey: string,
): Promise<StealthAddressResult> {
  // Extract the spending key portion from meta-address
  // Format: st:eth:0x<64 hex chars spending><64 hex chars viewing>
  const rawHex = metaAddress.replace("st:eth:0x", "").replace("st:eth:", "");
  const spendingPubHex = rawHex.slice(0, 64);

  const ephemeralBytes = hexToBytes(ephemeralKey);
  const spendingBytes = hexToBytes(spendingPubHex);

  // Derive shared secret: hash(ephemeralKey || spendingKey)
  const combined = new Uint8Array(ephemeralBytes.length + spendingBytes.length);
  combined.set(ephemeralBytes);
  combined.set(spendingBytes, ephemeralBytes.length);

  const sharedSecret = await sha256(combined);

  // Stealth address = hash(sharedSecret) truncated to 20 bytes
  const addressHash = await sha256(sharedSecret);
  const stealthAddress = toEthAddress(addressHash);

  // Ephemeral public key (simplified: same as ephemeral key for demo)
  const ephemeralPubKey = `0x${bytesToHex(ephemeralBytes)}`;

  return { stealthAddress, ephemeralPubKey };
}

/**
 * Truncates a stealth address for display: 0x1234...abcd
 */
export function formatStealthAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Checks whether the given string looks like a valid stealth address.
 * Accepts both raw Ethereum addresses and st:eth: prefixed meta-addresses.
 */
export function isStealthAddress(address: string): boolean {
  // Meta-address format
  if (address.startsWith("st:eth:")) return true;

  // Standard Ethereum address: 0x + 40 hex chars
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return true;

  return false;
}
