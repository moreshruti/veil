#!/usr/bin/env bash
set -euo pipefail

# Parse Foundry broadcast output and update frontend contract addresses.
# Usage: ./update-addresses.sh [chain_id]
#   chain_id defaults to 84532 (Base Sepolia)

CHAIN_ID="${1:-84532}"
CONTRACTS_FILE="../src/lib/web3/contracts.ts"
BROADCAST_DIR="broadcast/Deploy.s.sol/${CHAIN_ID}"

# Find the latest run
LATEST_RUN="${BROADCAST_DIR}/run-latest.json"

if [ ! -f "$LATEST_RUN" ]; then
  echo "Error: No broadcast found at ${LATEST_RUN}"
  echo "Deploy first: make deploy-base-sepolia"
  exit 1
fi

if [ ! -f "$CONTRACTS_FILE" ]; then
  echo "Error: Frontend contracts file not found at ${CONTRACTS_FILE}"
  exit 1
fi

echo "Reading deployment from: ${LATEST_RUN}"
echo ""

# Extract deployed contract addresses from the broadcast JSON.
# Foundry broadcast format: transactions[] with contractName and contractAddress.
REGISTRY_ADDR=$(jq -r '.transactions[] | select(.contractName == "StealthAddressRegistry") | .contractAddress' "$LATEST_RUN")
POLICY_ADDR=$(jq -r '.transactions[] | select(.contractName == "AgentPolicy") | .contractAddress' "$LATEST_RUN")
AGENT_ADDR=$(jq -r '.transactions[] | select(.contractName == "VeilAgent") | .contractAddress' "$LATEST_RUN")

if [ -z "$REGISTRY_ADDR" ] || [ -z "$POLICY_ADDR" ] || [ -z "$AGENT_ADDR" ]; then
  echo "Error: Could not extract all contract addresses from broadcast"
  echo "  StealthAddressRegistry: ${REGISTRY_ADDR:-NOT FOUND}"
  echo "  AgentPolicy:            ${POLICY_ADDR:-NOT FOUND}"
  echo "  VeilAgent:              ${AGENT_ADDR:-NOT FOUND}"
  exit 1
fi

echo "Deployed addresses:"
echo "  StealthAddressRegistry: ${REGISTRY_ADDR}"
echo "  AgentPolicy:            ${POLICY_ADDR}"
echo "  VeilAgent:              ${AGENT_ADDR}"
echo ""

# Update the frontend contracts.ts file using Python regex for reliable cross-platform replacement.
python3 -c "
import re

with open('${CONTRACTS_FILE}', 'r') as f:
    content = f.read()

# Replace addresses in order: stealthRegistry, agentPolicy, veilAgent
addresses = {
    'stealthRegistry': '${REGISTRY_ADDR}',
    'agentPolicy': '${POLICY_ADDR}',
    'veilAgent': '${AGENT_ADDR}',
}

for name, addr in addresses.items():
    # Match the block for this contract and replace its address
    pattern = r'(%s:\s*\{[^}]*?address:\s*\")0x[a-fA-F0-9]+(\")'  % name
    content = re.sub(pattern, r'\g<1>' + addr + r'\2', content, flags=re.DOTALL)

with open('${CONTRACTS_FILE}', 'w') as f:
    f.write(content)
"

echo "Updated ${CONTRACTS_FILE}"
echo ""
echo "Verify with: cat ${CONTRACTS_FILE}"
