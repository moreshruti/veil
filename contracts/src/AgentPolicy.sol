// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentPolicy
/// @notice On-chain policy engine for AI agent transaction limits
contract AgentPolicy {
    /// @notice cbBTC token address on Base
    address public constant CBBTC = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf;

    /// @notice USDC token address on Base
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    struct Policy {
        uint256 dailyLimit;    // Max spend per day (in wei or smallest unit)
        uint256 perTxLimit;    // Max per transaction
        bool requireApproval;  // Require user signature for every tx
        bool active;           // Policy is active
    }

    /// @notice Mapping: user => policy
    mapping(address => Policy) public policies;

    /// @notice Mapping: user => day number => amount spent
    mapping(address => mapping(uint256 => uint256)) public dailySpent;

    /// @notice Allowed tokens per user
    mapping(address => mapping(address => bool)) public allowedTokens;

    /// @notice Emitted when a user sets or updates their policy
    event PolicySet(address indexed user, uint256 dailyLimit, uint256 perTxLimit, bool requireApproval);

    /// @notice Emitted when a spend is recorded against a user's daily limit
    event SpendRecorded(address indexed user, address token, uint256 amount, uint256 dailyTotal);

    /// @notice Emitted when a user allows or disallows a token
    event TokenAllowed(address indexed user, address token, bool allowed);

    /// @notice Emitted when a transaction violates a user's policy
    event PolicyViolation(address indexed user, string reason);

    /// @notice Emitted when default tokens are added for a user
    event DefaultTokensAdded(address indexed user);

    /// @notice Set or update your agent policy
    /// @param dailyLimit Maximum daily spend in wei
    /// @param perTxLimit Maximum per-transaction spend in wei
    /// @param requireApproval Whether every transaction needs user approval
    function setPolicy(uint256 dailyLimit, uint256 perTxLimit, bool requireApproval) external {
        require(dailyLimit > 0, "Daily limit must be positive");
        require(perTxLimit > 0, "Per-tx limit must be positive");
        require(perTxLimit <= dailyLimit, "Per-tx limit exceeds daily limit");

        policies[msg.sender] = Policy({
            dailyLimit: dailyLimit,
            perTxLimit: perTxLimit,
            requireApproval: requireApproval,
            active: true
        });

        _addDefaultTokens(msg.sender);

        emit PolicySet(msg.sender, dailyLimit, perTxLimit, requireApproval);
    }

    /// @notice Check if a transaction passes policy constraints
    /// @param user The user whose policy to check against
    /// @param token The token address (address(0) for native ETH)
    /// @param amount The transaction amount
    /// @return passed Whether the transaction passes
    /// @return reason Human-readable reason if it fails
    function checkPolicy(
        address user,
        address token,
        uint256 amount
    ) external view returns (bool passed, string memory reason) {
        Policy memory policy = policies[user];

        if (!policy.active) {
            return (false, "No active policy");
        }

        if (policy.requireApproval) {
            return (false, "Manual approval required");
        }

        if (token != address(0) && !allowedTokens[user][token]) {
            return (false, "Token not allowed");
        }

        if (amount > policy.perTxLimit) {
            return (false, "Exceeds per-transaction limit");
        }

        uint256 today = _currentDay();
        uint256 todaySpent = dailySpent[user][today];

        if (todaySpent + amount > policy.dailyLimit) {
            return (false, "Exceeds daily limit");
        }

        return (true, "");
    }

    /// @notice Record a spend against a user's daily allowance
    /// @dev Should be called after successful transaction execution
    /// @param user The user who spent
    /// @param token The token spent (address(0) for native ETH)
    /// @param amount The amount spent
    function recordSpend(address user, address token, uint256 amount) external {
        Policy memory policy = policies[user];
        require(policy.active, "No active policy");

        uint256 today = _currentDay();
        uint256 newTotal = dailySpent[user][today] + amount;

        if (amount > policy.perTxLimit) {
            emit PolicyViolation(user, "Exceeds per-transaction limit");
            revert("Exceeds per-transaction limit");
        }

        if (newTotal > policy.dailyLimit) {
            emit PolicyViolation(user, "Exceeds daily limit");
            revert("Exceeds daily limit");
        }

        dailySpent[user][today] = newTotal;
        emit SpendRecorded(user, token, amount, newTotal);
    }

    /// @notice Set whether a token is allowed for agent transactions
    /// @param token The token address to allow or disallow
    /// @param allowed Whether the token is allowed
    function setTokenAllowed(address token, bool allowed) external {
        allowedTokens[msg.sender][token] = allowed;
        emit TokenAllowed(msg.sender, token, allowed);
    }

    /// @notice Get remaining daily allowance for a user
    /// @param user The user to check
    /// @return The remaining amount that can be spent today
    function getRemainingAllowance(address user) external view returns (uint256) {
        Policy memory policy = policies[user];
        if (!policy.active) {
            return 0;
        }

        uint256 today = _currentDay();
        uint256 spent = dailySpent[user][today];

        if (spent >= policy.dailyLimit) {
            return 0;
        }

        return policy.dailyLimit - spent;
    }

    /// @notice Manually add default tokens (ETH, USDC, cbBTC) to your allowlist
    /// @dev Called automatically by setPolicy, but can also be called standalone
    function addDefaultTokens() external {
        _addDefaultTokens(msg.sender);
    }

    /// @notice Internal helper to whitelist ETH (address(0)), USDC, and cbBTC
    /// @param user The user to add default tokens for
    function _addDefaultTokens(address user) internal {
        // ETH (address(0)) is implicitly allowed by checkPolicy, but whitelist for consistency
        allowedTokens[user][address(0)] = true;
        allowedTokens[user][USDC] = true;
        allowedTokens[user][CBBTC] = true;

        emit DefaultTokensAdded(user);
    }

    /// @notice Get the current day number for daily reset tracking
    /// @return The current day number (block.timestamp / 1 days)
    function _currentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
}
