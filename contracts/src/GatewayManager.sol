// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentController.sol";

/**
 * @title GatewayManager
 * @notice Manages Circle Gateway integration for cross-chain USDC transfers
 * @dev Handles deposits into Gateway Wallet and attestation-based mints
 */
contract GatewayManager is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Circle Gateway Wallet Contract (placeholder for Arc Testnet)
    address public immutable gatewayWallet;
    
    // USDC token
    IERC20 public immutable usdc;
    
    // Agent controller for access control
    AgentController public immutable agentController;
    
    // Unified USDC balance tracking (cross-chain)
    mapping(address => uint256) public unifiedBalances;
    
    // Total unified liquidity
    uint256 public totalUnifiedLiquidity;
    
    // Chain ID tracking for cross-chain operations
    uint256 public immutable currentChainId;
    
    // Burn intent tracking for attestations
    struct BurnIntent {
        address burner;
        uint256 amount;
        uint256 destinationChainId;
        uint256 timestamp;
        bool executed;
    }
    
    mapping(bytes32 => BurnIntent) public burnIntents;
    
    // Events
    event DepositToGateway(
        address indexed user,
        uint256 amount,
        uint256 chainId,
        uint256 timestamp
    );
    
    event BurnIntentCreated(
        bytes32 indexed intentId,
        address indexed burner,
        uint256 amount,
        uint256 destinationChainId
    );
    
    event CrossChainMint(
        address indexed recipient,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 intentId
    );
    
    event UnifiedBalanceUpdated(
        address indexed user,
        uint256 oldBalance,
        uint256 newBalance
    );
    
    modifier onlyTreasuryAgent() {
        require(
            agentController.hasRole(agentController.TREASURY_AGENT(), msg.sender),
            "GatewayManager: Caller is not a treasury agent"
        );
        _;
    }
    
    constructor(
        address _usdc,
        address _gatewayWallet,
        address _agentController,
        uint256 _chainId
    ) {
        require(_usdc != address(0), "GatewayManager: Invalid USDC address");
        require(_gatewayWallet != address(0), "GatewayManager: Invalid gateway wallet");
        require(_agentController != address(0), "GatewayManager: Invalid agent controller");
        
        usdc = IERC20(_usdc);
        gatewayWallet = _gatewayWallet;
        agentController = AgentController(_agentController);
        currentChainId = _chainId;
    }
    
    /**
     * @notice Deposit USDC into Circle Gateway for cross-chain access
     * @param amount Amount of USDC to deposit
     */
    function depositToGateway(uint256 amount) external nonReentrant {
        require(amount > 0, "GatewayManager: Amount must be greater than 0");
        
        // Transfer USDC from user to gateway wallet
        usdc.safeTransferFrom(msg.sender, gatewayWallet, amount);
        
        // Update unified balance
        uint256 oldBalance = unifiedBalances[msg.sender];
        unifiedBalances[msg.sender] += amount;
        totalUnifiedLiquidity += amount;
        
        emit DepositToGateway(msg.sender, amount, currentChainId, block.timestamp);
        emit UnifiedBalanceUpdated(msg.sender, oldBalance, unifiedBalances[msg.sender]);
    }
    
    /**
     * @notice Create burn intent for cross-chain transfer
     * @param amount Amount to burn on source chain
     * @param destinationChainId Destination chain ID
     * @return intentId Unique identifier for the burn intent
     */
    function createBurnIntent(uint256 amount, uint256 destinationChainId) 
        external 
        nonReentrant 
        returns (bytes32 intentId) 
    {
        require(amount > 0, "GatewayManager: Amount must be greater than 0");
        require(unifiedBalances[msg.sender] >= amount, "GatewayManager: Insufficient unified balance");
        require(destinationChainId != currentChainId, "GatewayManager: Cannot burn on same chain");
        
        // Generate unique intent ID
        intentId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            destinationChainId,
            block.timestamp,
            currentChainId
        ));
        
        // Create burn intent
        burnIntents[intentId] = BurnIntent({
            burner: msg.sender,
            amount: amount,
            destinationChainId: destinationChainId,
            timestamp: block.timestamp,
            executed: false
        });
        
        // Reduce unified balance (burned on source chain)
        uint256 oldBalance = unifiedBalances[msg.sender];
        unifiedBalances[msg.sender] -= amount;
        totalUnifiedLiquidity -= amount;
        
        emit BurnIntentCreated(intentId, msg.sender, amount, destinationChainId);
        emit UnifiedBalanceUpdated(msg.sender, oldBalance, unifiedBalances[msg.sender]);
    }
    
    /**
     * @notice Execute mint on destination chain using attestation
     * @dev In production, this would verify Circle's attestation signature
     * @param intentId Burn intent ID from source chain
     * @param recipient Address to receive minted USDC
     * @param amount Amount to mint
     * @param sourceChainId Source chain ID
     */
    function executeMintWithAttestation(
        bytes32 intentId,
        address recipient,
        uint256 amount,
        uint256 sourceChainId
    ) external onlyTreasuryAgent nonReentrant {
        require(recipient != address(0), "GatewayManager: Invalid recipient");
        require(amount > 0, "GatewayManager: Invalid amount");
        require(sourceChainId != currentChainId, "GatewayManager: Invalid source chain");
        
        // In production: verify Circle attestation signature here
        // For hackathon: simplified trusted agent execution
        
        // Update unified balance on destination chain
        uint256 oldBalance = unifiedBalances[recipient];
        unifiedBalances[recipient] += amount;
        totalUnifiedLiquidity += amount;
        
        // Transfer USDC from gateway wallet to recipient
        // In production: this would be a mint from Circle's gateway
        usdc.safeTransferFrom(gatewayWallet, recipient, amount);
        
        emit CrossChainMint(recipient, amount, sourceChainId, intentId);
        emit UnifiedBalanceUpdated(recipient, oldBalance, unifiedBalances[recipient]);
    }
    
    /**
     * @notice Get unified USDC balance across all chains
     * @param user Address of the user
     * @return uint256 Unified balance
     */
    function getUnifiedBalance(address user) external view returns (uint256) {
        return unifiedBalances[user];
    }
    
    /**
     * @notice Check if burn intent exists and is valid
     * @param intentId Burn intent ID
     * @return bool True if intent is valid and not executed
     */
    function isBurnIntentValid(bytes32 intentId) external view returns (bool) {
        BurnIntent memory intent = burnIntents[intentId];
        return intent.amount > 0 && !intent.executed;
    }
    
    /**
     * @notice Get burn intent details
     * @param intentId Burn intent ID
     * @return BurnIntent struct
     */
    function getBurnIntent(bytes32 intentId) external view returns (BurnIntent memory) {
        return burnIntents[intentId];
    }
    
    /**
     * @notice Get total unified liquidity across all users
     * @return uint256 Total liquidity
     */
    function getTotalUnifiedLiquidity() external view returns (uint256) {
        return totalUnifiedLiquidity;
    }
}

