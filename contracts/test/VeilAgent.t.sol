// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VeilAgent} from "../src/VeilAgent.sol";

contract VeilAgentTest is Test {
    VeilAgent public agent;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        agent = new VeilAgent();
    }

    function test_createAgent() public {
        vm.prank(alice);
        agent.createAgent("alice.veil.eth");

        VeilAgent.Agent memory a = agent.getAgent(alice);
        assertEq(a.owner, alice);
        assertEq(a.ensName, "alice.veil.eth");
        assertTrue(a.active);
        assertGt(a.createdAt, 0);
    }

    function test_createAgent_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit VeilAgent.AgentCreated(alice, "alice.veil.eth");
        agent.createAgent("alice.veil.eth");
    }

    function test_createAgent_revertsEmptyName() public {
        vm.prank(alice);
        vm.expectRevert("ENS name required");
        agent.createAgent("");
    }

    function test_createAgent_revertsDuplicate() public {
        vm.startPrank(alice);
        agent.createAgent("alice.veil.eth");
        vm.expectRevert("Agent already exists");
        agent.createAgent("alice2.veil.eth");
        vm.stopPrank();
    }

    function test_deactivateAgent() public {
        vm.startPrank(alice);
        agent.createAgent("alice.veil.eth");
        agent.deactivateAgent();
        vm.stopPrank();

        VeilAgent.Agent memory a = agent.getAgent(alice);
        assertFalse(a.active);
    }

    function test_deactivateAgent_emitsEvent() public {
        vm.prank(alice);
        agent.createAgent("alice.veil.eth");

        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit VeilAgent.AgentDeactivated(alice);
        agent.deactivateAgent();
    }

    function test_deactivateAgent_revertsNoAgent() public {
        vm.prank(alice);
        vm.expectRevert("No active agent");
        agent.deactivateAgent();
    }

    function test_getAgent_unregistered() public view {
        VeilAgent.Agent memory a = agent.getAgent(bob);
        assertEq(a.owner, address(0));
        assertEq(bytes(a.ensName).length, 0);
        assertFalse(a.active);
        assertEq(a.createdAt, 0);
    }

    function test_multipleUsers() public {
        vm.prank(alice);
        agent.createAgent("alice.veil.eth");

        vm.prank(bob);
        agent.createAgent("bob.veil.eth");

        VeilAgent.Agent memory a = agent.getAgent(alice);
        VeilAgent.Agent memory b = agent.getAgent(bob);

        assertEq(a.ensName, "alice.veil.eth");
        assertEq(b.ensName, "bob.veil.eth");
    }

    function test_createAgentAfterDeactivation() public {
        vm.startPrank(alice);
        agent.createAgent("alice.veil.eth");
        agent.deactivateAgent();

        // After deactivation, creating again should fail because the agent struct still exists
        // but is inactive. The check is `!agents[msg.sender].active`, which is true after deactivation,
        // so a new agent CAN be created.
        agent.createAgent("alice2.veil.eth");
        vm.stopPrank();

        VeilAgent.Agent memory a = agent.getAgent(alice);
        assertEq(a.ensName, "alice2.veil.eth");
        assertTrue(a.active);
    }
}
