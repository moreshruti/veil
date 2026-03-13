-include .env

.PHONY: build test deploy-base-sepolia deploy-base update-addresses clean

build:
	forge build

test:
	forge test -vvv

deploy-base-sepolia:
	forge script script/Deploy.s.sol:DeployVeil \
		--rpc-url base_sepolia \
		--broadcast \
		--verify \
		-vvvv

deploy-base:
	forge script script/Deploy.s.sol:DeployVeil \
		--rpc-url base \
		--broadcast \
		--verify \
		-vvvv

# Dry-run deployment (no broadcast)
dry-run-base-sepolia:
	forge script script/Deploy.s.sol:DeployVeil \
		--rpc-url base_sepolia \
		-vvvv

update-addresses:
	./update-addresses.sh

clean:
	forge clean
