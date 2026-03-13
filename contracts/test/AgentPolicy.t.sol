// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentPolicy} from "../src/AgentPolicy.sol";

contract AgentPolicyTest is Test {
    AgentPolicy public policy;
    address public alice = makeAddr("alice");
    address public tokenA = makeAddr("tokenA");

    // Base mainnet token addresses (matching contract constants)
    address public constant CBBTC = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf;
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function setUp() public {
        policy = new AgentPolicy();
    }

    function test_setPolicy() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.1 ether, false);

        (uint256 dailyLimit, uint256 perTxLimit, bool requireApproval, bool active) = policy.policies(alice);
        assertEq(dailyLimit, 1 ether);
        assertEq(perTxLimit, 0.1 ether);
        assertFalse(requireApproval);
        assertTrue(active);
    }

    function test_setPolicy_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgentPolicy.PolicySet(alice, 1 ether, 0.1 ether, false);
        policy.setPolicy(1 ether, 0.1 ether, false);
    }

    function test_setPolicy_revertsZeroDailyLimit() public {
        vm.prank(alice);
        vm.expectRevert("Daily limit must be positive");
        policy.setPolicy(0, 0.1 ether, false);
    }

    function test_setPolicy_revertsZeroPerTxLimit() public {
        vm.prank(alice);
        vm.expectRevert("Per-tx limit must be positive");
        policy.setPolicy(1 ether, 0, false);
    }

    function test_setPolicy_revertsPerTxExceedsDaily() public {
        vm.prank(alice);
        vm.expectRevert("Per-tx limit exceeds daily limit");
        policy.setPolicy(1 ether, 2 ether, false);
    }

    function test_checkPolicy_passes() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // Native ETH (address(0)) is always allowed
        (bool passed, string memory reason) = policy.checkPolicy(alice, address(0), 0.3 ether);
        assertTrue(passed);
        assertEq(reason, "");
    }

    function test_checkPolicy_noActivePolicy() public {
        (bool passed, string memory reason) = policy.checkPolicy(alice, address(0), 0.1 ether);
        assertFalse(passed);
        assertEq(reason, "No active policy");
    }

    function test_checkPolicy_requiresApproval() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, true);

        (bool passed, string memory reason) = policy.checkPolicy(alice, address(0), 0.1 ether);
        assertFalse(passed);
        assertEq(reason, "Manual approval required");
    }

    function test_checkPolicy_tokenNotAllowed() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        (bool passed, string memory reason) = policy.checkPolicy(alice, tokenA, 0.1 ether);
        assertFalse(passed);
        assertEq(reason, "Token not allowed");
    }

    function test_checkPolicy_exceedsPerTxLimit() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.1 ether, false);

        (bool passed, string memory reason) = policy.checkPolicy(alice, address(0), 0.5 ether);
        assertFalse(passed);
        assertEq(reason, "Exceeds per-transaction limit");
    }

    function test_checkPolicy_exceedsDailyLimit() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // Record some spend first
        policy.recordSpend(alice, address(0), 0.5 ether);
        policy.recordSpend(alice, address(0), 0.4 ether);

        (bool passed, string memory reason) = policy.checkPolicy(alice, address(0), 0.2 ether);
        assertFalse(passed);
        assertEq(reason, "Exceeds daily limit");
    }

    function test_recordSpend() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        policy.recordSpend(alice, address(0), 0.3 ether);

        uint256 remaining = policy.getRemainingAllowance(alice);
        assertEq(remaining, 0.7 ether);
    }

    function test_recordSpend_revertsExceedsPerTx() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.1 ether, false);

        vm.expectRevert("Exceeds per-transaction limit");
        policy.recordSpend(alice, address(0), 0.5 ether);
    }

    function test_recordSpend_revertsExceedsDaily() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        policy.recordSpend(alice, address(0), 0.5 ether);
        policy.recordSpend(alice, address(0), 0.4 ether);

        vm.expectRevert("Exceeds daily limit");
        policy.recordSpend(alice, address(0), 0.2 ether);
    }

    function test_recordSpend_revertsNoPolicy() public {
        vm.expectRevert("No active policy");
        policy.recordSpend(alice, address(0), 0.1 ether);
    }

    function test_setTokenAllowed() public {
        vm.prank(alice);
        policy.setTokenAllowed(tokenA, true);

        assertTrue(policy.allowedTokens(alice, tokenA));
    }

    function test_setTokenAllowed_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgentPolicy.TokenAllowed(alice, tokenA, true);
        policy.setTokenAllowed(tokenA, true);
    }

    function test_getRemainingAllowance_noPolicy() public view {
        assertEq(policy.getRemainingAllowance(alice), 0);
    }

    function test_getRemainingAllowance_fullDay() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        assertEq(policy.getRemainingAllowance(alice), 1 ether);
    }

    function test_dailyReset() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // Spend some today
        policy.recordSpend(alice, address(0), 0.5 ether);
        assertEq(policy.getRemainingAllowance(alice), 0.5 ether);

        // Warp to next day
        vm.warp(block.timestamp + 1 days);

        // Allowance should be fully reset
        assertEq(policy.getRemainingAllowance(alice), 1 ether);
    }

    function test_checkPolicy_tokenAllowed() public {
        vm.startPrank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);
        policy.setTokenAllowed(tokenA, true);
        vm.stopPrank();

        (bool passed, ) = policy.checkPolicy(alice, tokenA, 0.1 ether);
        assertTrue(passed);
    }

    // =========================================================================
    // cbBTC and Default Token Tests
    // =========================================================================

    function test_addDefaultTokens_whitelistsCbBTC() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // cbBTC should be whitelisted automatically after setPolicy
        assertTrue(policy.allowedTokens(alice, CBBTC));
    }

    function test_addDefaultTokens_whitelistsUSDC() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // USDC should be whitelisted automatically after setPolicy
        assertTrue(policy.allowedTokens(alice, USDC));
    }

    function test_addDefaultTokens_whitelistsETH() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // ETH (address(0)) should be whitelisted automatically after setPolicy
        assertTrue(policy.allowedTokens(alice, address(0)));
    }

    function test_addDefaultTokens_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgentPolicy.DefaultTokensAdded(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);
    }

    function test_addDefaultTokens_standalone() public {
        // Can call addDefaultTokens without setPolicy
        vm.prank(alice);
        policy.addDefaultTokens();

        assertTrue(policy.allowedTokens(alice, CBBTC));
        assertTrue(policy.allowedTokens(alice, USDC));
        assertTrue(policy.allowedTokens(alice, address(0)));
    }

    function test_checkPolicy_cbBTC_passes() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // cbBTC should pass policy check since it's a default token
        (bool passed, string memory reason) = policy.checkPolicy(alice, CBBTC, 0.1 ether);
        assertTrue(passed);
        assertEq(reason, "");
    }

    function test_checkPolicy_cbBTC_exceedsPerTxLimit() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // cbBTC spend exceeding per-tx limit should fail
        (bool passed, string memory reason) = policy.checkPolicy(alice, CBBTC, 0.6 ether);
        assertFalse(passed);
        assertEq(reason, "Exceeds per-transaction limit");
    }

    function test_checkPolicy_cbBTC_exceedsDailyLimit() public {
        vm.prank(alice);
        policy.setPolicy(1 ether, 0.5 ether, false);

        // Record some cbBTC spends to approach daily limit
        policy.recordSpend(alice, CBBTC, 0.5 ether);
        policy.recordSpend(alice, CBBTC, 0.4 ether);

        // This should exceed daily limit
        (bool passed, string memory reason) = policy.checkPolicy(alice, CBBTC, 0.2 ether);
        assertFalse(passed);
        assertEq(reason, "Exceeds daily limit");
    }

    function test_spendingLimits_cbBTC_8decimals() public {
        // cbBTC uses 8 decimals (like BTC). 1 cbBTC = 1e8 units.
        // Set limits in cbBTC's native units:
        // dailyLimit = 1 cbBTC = 100_000_000 (1e8)
        // perTxLimit = 0.5 cbBTC = 50_000_000 (5e7)
        uint256 oneCbBTC = 1e8;
        uint256 halfCbBTC = 5e7;

        vm.prank(alice);
        policy.setPolicy(oneCbBTC, halfCbBTC, false);

        // Spend 0.3 cbBTC -- should pass
        (bool passed1, ) = policy.checkPolicy(alice, CBBTC, 3e7);
        assertTrue(passed1);

        // Record it
        policy.recordSpend(alice, CBBTC, 3e7);

        // Check remaining allowance
        uint256 remaining = policy.getRemainingAllowance(alice);
        assertEq(remaining, 7e7); // 0.7 cbBTC remaining

        // Spend 0.5 cbBTC -- should fail (exceeds per-tx limit)
        (bool passed2, string memory reason2) = policy.checkPolicy(alice, CBBTC, halfCbBTC);
        assertTrue(passed2); // 0.5 cbBTC == perTxLimit, should pass

        // Spend 0.6 cbBTC -- should fail (exceeds per-tx limit)
        (bool passed3, string memory reason3) = policy.checkPolicy(alice, CBBTC, 6e7);
        assertFalse(passed3);
        assertEq(reason3, "Exceeds per-transaction limit");

        // Record more to approach daily limit
        policy.recordSpend(alice, CBBTC, halfCbBTC);

        // Now at 0.8 cbBTC spent. 0.2 remaining.
        remaining = policy.getRemainingAllowance(alice);
        assertEq(remaining, 2e7);

        // Try to spend 0.3 cbBTC -- should fail daily limit
        (bool passed4, string memory reason4) = policy.checkPolicy(alice, CBBTC, 3e7);
        assertFalse(passed4);
        assertEq(reason4, "Exceeds daily limit");
    }

    function test_constants_match() public view {
        assertEq(policy.CBBTC(), CBBTC);
        assertEq(policy.USDC(), USDC);
    }
}
