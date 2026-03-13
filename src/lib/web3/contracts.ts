import StealthRegistryABI from "./abis/StealthAddressRegistry.json";
import AgentPolicyABI from "./abis/AgentPolicy.json";
import VeilAgentABI from "./abis/VeilAgent.json";

export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: null, // native
    icon: "Ξ",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    icon: "$",
  },
  cbBTC: {
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    decimals: 8,
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" as `0x${string}`,
    icon: "₿",
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

export const CONTRACTS = {
  stealthRegistry: {
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    abi: StealthRegistryABI,
  },
  agentPolicy: {
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    abi: AgentPolicyABI,
  },
  veilAgent: {
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    abi: VeilAgentABI,
  },
} as const;

export { StealthRegistryABI, AgentPolicyABI, VeilAgentABI };
