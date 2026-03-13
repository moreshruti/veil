// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title StealthAddressRegistry
/// @notice Register and look up stealth meta-addresses for private transactions
/// @dev Based on ERC-5564 stealth address standard
contract StealthAddressRegistry {
    /// @notice Mapping: user address => stealth meta-address bytes
    mapping(address => bytes) private _stealthMetaAddresses;

    /// @notice Emitted when a user registers or updates their stealth meta-address
    event StealthMetaAddressRegistered(address indexed user, bytes stealthMetaAddress);

    /// @notice Emitted when a stealth payment is announced for recipients to scan
    event StealthPaymentAnnounced(
        address indexed caller,
        address indexed stealthAddress,
        bytes ephemeralPubKey,
        bytes metadata
    );

    /// @notice Register or update your stealth meta-address
    /// @param stealthMetaAddress The stealth meta-address bytes to register
    function registerStealthMetaAddress(bytes calldata stealthMetaAddress) external {
        require(stealthMetaAddress.length > 0, "Empty stealth meta-address");
        _stealthMetaAddresses[msg.sender] = stealthMetaAddress;
        emit StealthMetaAddressRegistered(msg.sender, stealthMetaAddress);
    }

    /// @notice Get a user's stealth meta-address
    /// @param user The address to look up
    /// @return The stealth meta-address bytes
    function getStealthMetaAddress(address user) external view returns (bytes memory) {
        bytes memory meta = _stealthMetaAddresses[user];
        require(meta.length > 0, "User not registered");
        return meta;
    }

    /// @notice Announce a stealth payment (emits event for recipients to scan)
    /// @param stealthAddress The one-time stealth address that received funds
    /// @param ephemeralPubKey The ephemeral public key used to derive the stealth address
    /// @param metadata Additional metadata (e.g., view tag, token info)
    function announcePayment(
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata metadata
    ) external payable {
        require(stealthAddress != address(0), "Invalid stealth address");
        require(ephemeralPubKey.length > 0, "Empty ephemeral public key");

        if (msg.value > 0) {
            (bool sent, ) = stealthAddress.call{value: msg.value}("");
            require(sent, "ETH transfer failed");
        }

        emit StealthPaymentAnnounced(msg.sender, stealthAddress, ephemeralPubKey, metadata);
    }

    /// @notice Check if a user has registered a stealth meta-address
    /// @param user The address to check
    /// @return True if the user has registered
    function isRegistered(address user) external view returns (bool) {
        return _stealthMetaAddresses[user].length > 0;
    }
}
