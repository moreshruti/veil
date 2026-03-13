// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VeilAgent
/// @notice On-chain identity for an AI agent bound to a user
contract VeilAgent {
    struct Agent {
        address owner;       // User who owns this agent
        string ensName;      // Agent's ENS subdomain
        bool active;
        uint256 createdAt;
    }

    /// @notice Mapping: owner address => Agent
    mapping(address => Agent) public agents;

    /// @notice Emitted when a new agent is created
    event AgentCreated(address indexed owner, string ensName);

    /// @notice Emitted when an agent is deactivated
    event AgentDeactivated(address indexed owner);

    /// @notice Create an on-chain agent identity bound to the caller
    /// @param ensName The ENS subdomain for this agent
    function createAgent(string calldata ensName) external {
        require(bytes(ensName).length > 0, "ENS name required");
        require(!agents[msg.sender].active, "Agent already exists");

        agents[msg.sender] = Agent({
            owner: msg.sender,
            ensName: ensName,
            active: true,
            createdAt: block.timestamp
        });

        emit AgentCreated(msg.sender, ensName);
    }

    /// @notice Deactivate the caller's agent
    function deactivateAgent() external {
        require(agents[msg.sender].active, "No active agent");
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    /// @notice Get the agent for a given owner
    /// @param owner The owner address to look up
    /// @return The Agent struct
    function getAgent(address owner) external view returns (Agent memory) {
        return agents[owner];
    }
}
