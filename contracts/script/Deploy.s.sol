// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StealthAddressRegistry} from "../src/StealthAddressRegistry.sol";
import {AgentPolicy} from "../src/AgentPolicy.sol";
import {VeilAgent} from "../src/VeilAgent.sol";

contract DeployVeil is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        StealthAddressRegistry registry = new StealthAddressRegistry();
        AgentPolicy policy = new AgentPolicy();
        VeilAgent agent = new VeilAgent();

        vm.stopBroadcast();

        console.log("=== Veil Deployment Complete ===");
        console.log("StealthAddressRegistry:", address(registry));
        console.log("AgentPolicy:", address(policy));
        console.log("VeilAgent:", address(agent));
        console.log("================================");
    }
}
