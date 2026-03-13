// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StealthAddressRegistry} from "../src/StealthAddressRegistry.sol";

contract StealthAddressRegistryTest is Test {
    StealthAddressRegistry public registry;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        registry = new StealthAddressRegistry();
    }

    function test_registerStealthMetaAddress() public {
        bytes memory meta = hex"04abcdef1234567890";
        vm.prank(alice);
        registry.registerStealthMetaAddress(meta);

        assertTrue(registry.isRegistered(alice));
        assertEq(registry.getStealthMetaAddress(alice), meta);
    }

    function test_registerStealthMetaAddress_emitsEvent() public {
        bytes memory meta = hex"04abcdef1234567890";
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit StealthAddressRegistry.StealthMetaAddressRegistered(alice, meta);
        registry.registerStealthMetaAddress(meta);
    }

    function test_registerStealthMetaAddress_revertsEmpty() public {
        vm.prank(alice);
        vm.expectRevert("Empty stealth meta-address");
        registry.registerStealthMetaAddress("");
    }

    function test_registerStealthMetaAddress_overwrite() public {
        bytes memory meta1 = hex"04aabbcc";
        bytes memory meta2 = hex"04ddeeff";

        vm.startPrank(alice);
        registry.registerStealthMetaAddress(meta1);
        registry.registerStealthMetaAddress(meta2);
        vm.stopPrank();

        assertEq(registry.getStealthMetaAddress(alice), meta2);
    }

    function test_getStealthMetaAddress_revertsUnregistered() public {
        vm.expectRevert("User not registered");
        registry.getStealthMetaAddress(bob);
    }

    function test_isRegistered_false() public view {
        assertFalse(registry.isRegistered(bob));
    }

    function test_announcePayment_withETH() public {
        address stealth = makeAddr("stealth");
        bytes memory ephKey = hex"04112233";
        bytes memory metadata = hex"ff";

        vm.deal(alice, 1 ether);
        vm.prank(alice);

        vm.expectEmit(true, true, false, true);
        emit StealthAddressRegistry.StealthPaymentAnnounced(alice, stealth, ephKey, metadata);

        registry.announcePayment{value: 0.5 ether}(stealth, ephKey, metadata);

        assertEq(stealth.balance, 0.5 ether);
    }

    function test_announcePayment_noETH() public {
        address stealth = makeAddr("stealth");
        bytes memory ephKey = hex"04112233";
        bytes memory metadata = "";

        vm.prank(alice);
        registry.announcePayment(stealth, ephKey, metadata);

        assertEq(stealth.balance, 0);
    }

    function test_announcePayment_revertsZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert("Invalid stealth address");
        registry.announcePayment(address(0), hex"04", "");
    }

    function test_announcePayment_revertsEmptyEphKey() public {
        vm.prank(alice);
        vm.expectRevert("Empty ephemeral public key");
        registry.announcePayment(makeAddr("stealth"), "", "");
    }
}
