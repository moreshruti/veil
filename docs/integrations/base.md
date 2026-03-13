# Base Integration ($1,000 Bounty)

## Overview

Base is Coinbase's L2 chain built on the OP Stack. Veil targets Base as its primary chain, using Base's builder attribution system (ERC-8021) and aiming for gasless transactions via a paymaster. The Coinbase Wallet SDK is installed for wallet connectivity.

## Integration Status

**Partially Integrated**

Chain configuration and builder code attribution are active and applied to every transaction. However, there is no paymaster for gasless transactions, smart wallet / account abstraction is not used, and contracts are not deployed.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/web3/config.ts` | Base chain configuration (chain ID 8453, RPC endpoints) |
| `lib/web3/builder-code.ts` | ERC-8021 builder attribution code generation |
| `lib/web3/contracts.ts` | Token addresses on Base + contract addresses (all `0x000...000`) |
| `lib/stealth/transaction-flow.ts` | Appends builder code to every transaction's calldata |
| `components/WalletButton.tsx` | Wallet connection with Base network support |
| `components/WalletInfo.tsx` | Displays Base network info |
| `contracts/VeilRegistry.sol` | Stealth registry (Base token constants defined) |
| `contracts/VeilAgent.sol` | Agent identity contract (Base token constants defined) |
| `contracts/VeilPaymaster.sol` | Paymaster contract (not deployed, no integration) |

## How It Works

### Builder Code Attribution (ERC-8021)

Every transaction sent through Veil includes a builder attribution code appended to the calldata:

```
Builder code: "veil-ethmumbai-2026"
Hex encoded:  0x7665696c2d6574686d756d6261692d32303236

Transaction calldata = original_calldata + builder_code_hex
```

This is applied in `transaction-flow.ts` via the `appendBuilderCode()` function from `builder-code.ts`. It runs on every transaction regardless of type (send, swap, bridge).

### Chain Configuration

```typescript
// lib/web3/config.ts
{
  chain: base,           // Chain ID 8453
  rpcUrl: "https://mainnet.base.org",
  // Also configured for Base Sepolia (testnet, chain ID 84532)
}
```

### Wallet Connection

`@coinbase/wallet-sdk` is installed and configured in the wagmi config. However, the app uses standard `sendTransaction` -- no Smart Wallet features (account abstraction, session keys, gas sponsorship) are utilized.

### Contract Addresses

All three Solidity contracts reference Base token addresses (USDC, WETH, etc.) but are deployed to the zero address (`0x000...000`), meaning they are not live on any network.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect project ID for wallet modal |
| `NEXT_PUBLIC_ALCHEMY_ID` | Recommended | Alchemy API key for Base RPC (avoids public endpoint rate limits) |

## What's Mock vs Real

| Component | Status |
|-----------|--------|
| Base chain config | Real, correct chain ID and RPC |
| Builder code attribution | Real, appended to every transaction |
| Coinbase Wallet SDK | Installed, basic wallet connection works |
| Smart Wallet / Account Abstraction | Not implemented (standard EOA transactions only) |
| Gasless transactions (paymaster) | Not implemented despite "Gasless on Base" marketing |
| Contract deployment | Not deployed (zero addresses) |
| Base Sepolia testnet | Configured but untested |

## Steps to Go Live

1. **Register builder code**: Go to [base.org/builders](https://base.org/builders) and register the builder code `veil-ethmumbai-2026` to get attribution tracking on the Base builder leaderboard.
2. **Deploy contracts to Base Sepolia**:
   ```bash
   forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast
   ```
   Update `lib/web3/contracts.ts` with the deployed addresses.
3. **Add paymaster for gasless transactions**: Use Coinbase's OnchainKit or Pimlico to sponsor gas:
   ```typescript
   import { createPaymasterClient } from 'viem/account-abstraction'

   const paymasterClient = createPaymasterClient({
     transport: http('https://api.developer.coinbase.com/rpc/v1/base/...')
   })
   ```
4. **Enable Smart Wallet**: Replace standard `sendTransaction` with Coinbase Smart Wallet for account abstraction:
   ```typescript
   import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk'

   const sdk = new CoinbaseWalletSDK({ appName: 'Veil' })
   // Use sdk.makeWeb3Provider({ options: 'smartWalletOnly' })
   ```
5. **Deploy to Base mainnet**: After testing on Sepolia, deploy contracts to Base mainnet (chain ID 8453).
6. **Verify contracts on Basescan**: Run `forge verify-contract` for each deployed contract so users can inspect the code.
7. **Remove false marketing claims**: Either implement the paymaster or update UI copy that says "Gasless on Base" to accurately reflect current capabilities.
