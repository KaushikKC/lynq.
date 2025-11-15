// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestEURC
 * @notice Test EURC (Euro Coin) token for Arc testnet
 */
contract TestEURC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    constructor() ERC20("Euro Coin", "EURC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1_000_000 * 10**DECIMALS); // 1M EURC
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

