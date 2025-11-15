// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentController.sol";

/**
 * @title MultiCurrencyManager
 * @notice Manages multi-currency loan repayments (USDC, EURC, MXN)
 * @dev Handles currency conversion and exchange rate management
 */
contract MultiCurrencyManager {
    using SafeERC20 for IERC20;
    
    AgentController public immutable agentController;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenSymbols;
    
    // Exchange rates (in basis points, 10000 = 1.0)
    // For hackathon: hardcoded rates. Production: Chainlink oracles
    mapping(address => uint256) public exchangeRates; // token -> rate vs USDC
    
    address public immutable USDC;
    
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event TokenSupported(address indexed token, string symbol, uint256 rate);
    event TokenConverted(address indexed from, address indexed to, uint256 amountIn, uint256 amountOut);
    event ExchangeRateUpdated(address indexed token, uint256 oldRate, uint256 newRate);
    
    modifier onlyTreasuryAgent() {
        require(
            agentController.hasRole(agentController.TREASURY_AGENT(), msg.sender),
            "MultiCurrencyManager: Not treasury agent"
        );
        _;
    }
    
    constructor(address _usdc, address _agentController) {
        require(_usdc != address(0) && _agentController != address(0), "MultiCurrencyManager: Invalid addresses");
        USDC = _usdc;
        agentController = AgentController(_agentController);
        
        // Initialize USDC as base currency
        supportedTokens[_usdc] = true;
        tokenSymbols[_usdc] = "USDC";
        exchangeRates[_usdc] = BASIS_POINTS; // 1.0
    }
    
    /**
     * @notice Add supported currency with exchange rate
     * @param token Token address
     * @param symbol Token symbol (e.g., "EURC", "MXN")
     * @param rateVsUSDC Exchange rate vs USDC in basis points
     */
    function addCurrency(
        address token,
        string calldata symbol,
        uint256 rateVsUSDC
    ) external onlyTreasuryAgent {
        require(token != address(0), "MultiCurrencyManager: Invalid token");
        require(rateVsUSDC > 0, "MultiCurrencyManager: Invalid rate");
        require(bytes(symbol).length > 0, "MultiCurrencyManager: Invalid symbol");
        
        supportedTokens[token] = true;
        tokenSymbols[token] = symbol;
        exchangeRates[token] = rateVsUSDC;
        
        emit TokenSupported(token, symbol, rateVsUSDC);
    }
    
    /**
     * @notice Update exchange rate for a token
     * @param token Token address
     * @param newRate New exchange rate vs USDC in basis points
     */
    function updateExchangeRate(address token, uint256 newRate) external onlyTreasuryAgent {
        require(supportedTokens[token], "MultiCurrencyManager: Token not supported");
        require(newRate > 0, "MultiCurrencyManager: Invalid rate");
        
        uint256 oldRate = exchangeRates[token];
        exchangeRates[token] = newRate;
        
        emit ExchangeRateUpdated(token, oldRate, newRate);
    }
    
    /**
     * @notice Convert token amount to USDC equivalent
     * @param token Token address to convert from
     * @param amount Amount to convert
     * @return uint256 USDC equivalent amount
     */
    function convertToUSDC(address token, uint256 amount) public view returns (uint256) {
        require(supportedTokens[token], "MultiCurrencyManager: Token not supported");
        
        if (token == USDC) return amount;
        
        // amount * rate / 10000
        // Example: 100 EURC * 10900 / 10000 = 109 USDC
        return (amount * exchangeRates[token]) / BASIS_POINTS;
    }
    
    /**
     * @notice Convert USDC amount to target token equivalent
     * @param token Target token address
     * @param usdcAmount USDC amount to convert
     * @return uint256 Equivalent amount in target token
     */
    function convertFromUSDC(address token, uint256 usdcAmount) public view returns (uint256) {
        require(supportedTokens[token], "MultiCurrencyManager: Token not supported");
        
        if (token == USDC) return usdcAmount;
        
        // usdcAmount * 10000 / rate
        // Example: 109 USDC * 10000 / 10900 = 100 EURC
        return (usdcAmount * BASIS_POINTS) / exchangeRates[token];
    }
    
    /**
     * @notice Convert between two non-USDC currencies
     * @param fromToken Source token address
     * @param toToken Destination token address
     * @param amount Amount to convert
     * @return uint256 Equivalent amount in destination token
     */
    function convertCurrency(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (uint256) {
        require(supportedTokens[fromToken], "MultiCurrencyManager: Source token not supported");
        require(supportedTokens[toToken], "MultiCurrencyManager: Destination token not supported");
        
        // Convert from -> USDC -> to
        uint256 usdcAmount = convertToUSDC(fromToken, amount);
        return convertFromUSDC(toToken, usdcAmount);
    }
    
    /**
     * @notice Check if token is supported
     * @param token Token address
     * @return bool True if supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    /**
     * @notice Get all token details
     * @param token Token address
     * @return symbol Token symbol
     * @return rate Exchange rate vs USDC
     * @return supported Whether token is supported
     */
    function getTokenDetails(address token) 
        external 
        view 
        returns (
            string memory symbol,
            uint256 rate,
            bool supported
        ) 
    {
        return (
            tokenSymbols[token],
            exchangeRates[token],
            supportedTokens[token]
        );
    }
}

