// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC
 * @notice Test USDC token for Arc testnet with faucet functionality
 * @dev Simple ERC20 token for testing purposes
 */
contract TestUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**DECIMALS; // 1000 USDC
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    
    mapping(address => uint256) public lastFaucetClaim;
    
    event FaucetClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("Test USDC", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1_000_000 * 10**DECIMALS); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Claim test USDC from faucet
     * @dev Users can claim FAUCET_AMOUNT once per FAUCET_COOLDOWN period
     */
    function faucet() external {
        require(
            lastFaucetClaim[msg.sender] == 0 || 
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "TestUSDC: Faucet cooldown active"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
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

