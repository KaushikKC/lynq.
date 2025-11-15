// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestMXN
 * @notice Test MXN (Mexican Peso) token for Arc testnet
 */
contract TestMXN is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    constructor() ERC20("Mexican Peso", "MXN") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 10_000_000 * 10**DECIMALS); // 10M MXN
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Mint tokens to an address (only owner)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

