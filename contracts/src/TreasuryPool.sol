// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentController.sol";

/**
 * @title TreasuryPool
 * @notice Manages liquidity pool for the Lynq lending platform
 * @dev Handles deposits, withdrawals, and loan disbursements
 */
contract TreasuryPool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable usdc;
    AgentController public immutable agentController;
    
    mapping(address => uint256) public deposits;
    uint256 public totalLiquidity;
    uint256 public totalUtilized;
    
    // Minimum reserve ratio (20% = 2000 basis points)
    uint256 public constant MIN_RESERVE_RATIO = 2000;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Authorized loan engines that can request funds
    mapping(address => bool) public authorizedLoanEngines;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event LiquidityProvided(address indexed loanEngine, uint256 amount);
    event RepaymentReceived(address indexed loanEngine, uint256 amount);
    event LoanEngineAuthorized(address indexed loanEngine, bool authorized);
    
    modifier onlyTreasuryAgent() {
        require(
            agentController.hasRole(agentController.TREASURY_AGENT(), msg.sender),
            "TreasuryPool: Caller is not a treasury agent"
        );
        _;
    }
    
    modifier onlyAuthorizedLoanEngine() {
        require(
            authorizedLoanEngines[msg.sender],
            "TreasuryPool: Caller is not authorized loan engine"
        );
        _;
    }
    
    constructor(address _usdc, address _agentController) {
        require(_usdc != address(0), "TreasuryPool: Invalid USDC address");
        require(_agentController != address(0), "TreasuryPool: Invalid agent controller");
        
        usdc = IERC20(_usdc);
        agentController = AgentController(_agentController);
    }
    
    /**
     * @notice Deposit USDC into the treasury pool
     * @param amount Amount of USDC to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "TreasuryPool: Amount must be greater than 0");
        
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        deposits[msg.sender] += amount;
        totalLiquidity += amount;
        
        emit Deposited(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw USDC from the treasury pool
     * @param amount Amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "TreasuryPool: Amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "TreasuryPool: Insufficient balance");
        
        // Check if withdrawal maintains minimum reserve ratio
        uint256 availableLiquidity = totalLiquidity - totalUtilized;
        require(amount <= availableLiquidity, "TreasuryPool: Insufficient available liquidity");
        
        uint256 newTotalLiquidity = totalLiquidity - amount;
        if (totalUtilized > 0) {
            uint256 newReserveRatio = ((newTotalLiquidity - totalUtilized) * BASIS_POINTS) / newTotalLiquidity;
            require(
                newReserveRatio >= MIN_RESERVE_RATIO,
                "TreasuryPool: Withdrawal would breach minimum reserve ratio"
            );
        }
        
        deposits[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        usdc.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Provide liquidity to a loan engine for disbursement
     * @param loanEngine Address of the authorized loan engine
     * @param amount Amount of USDC to provide
     */
    function provideLiquidity(address loanEngine, uint256 amount) 
        external 
        onlyTreasuryAgent 
        nonReentrant 
    {
        require(amount > 0, "TreasuryPool: Amount must be greater than 0");
        require(authorizedLoanEngines[loanEngine], "TreasuryPool: Loan engine not authorized");
        
        uint256 availableLiquidity = totalLiquidity - totalUtilized;
        require(amount <= availableLiquidity, "TreasuryPool: Insufficient available liquidity");
        
        // Check if providing liquidity maintains minimum reserve ratio
        uint256 newUtilized = totalUtilized + amount;
        uint256 reserveRatio = ((totalLiquidity - newUtilized) * BASIS_POINTS) / totalLiquidity;
        require(
            reserveRatio >= MIN_RESERVE_RATIO,
            "TreasuryPool: Would breach minimum reserve ratio"
        );
        
        totalUtilized += amount;
        
        usdc.safeTransfer(loanEngine, amount);
        
        emit LiquidityProvided(loanEngine, amount);
    }
    
    /**
     * @notice Receive repayment from loan engine
     * @param amount Amount of USDC being repaid
     */
    function receiveRepayment(uint256 amount) external onlyAuthorizedLoanEngine nonReentrant {
        require(amount > 0, "TreasuryPool: Amount must be greater than 0");
        
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        // Reduce utilized amount (cap at 0 to handle interest payments)
        if (amount >= totalUtilized) {
            uint256 interest = amount - totalUtilized;
            totalUtilized = 0;
            totalLiquidity += interest; // Interest increases total liquidity
        } else {
            totalUtilized -= amount;
        }
        
        emit RepaymentReceived(msg.sender, amount);
    }
    
    /**
     * @notice Authorize or deauthorize a loan engine
     * @param loanEngine Address of the loan engine
     * @param authorized True to authorize, false to deauthorize
     */
    function setLoanEngineAuthorization(address loanEngine, bool authorized) 
        external 
        onlyTreasuryAgent 
    {
        require(loanEngine != address(0), "TreasuryPool: Invalid loan engine address");
        authorizedLoanEngines[loanEngine] = authorized;
        emit LoanEngineAuthorized(loanEngine, authorized);
    }
    
    /**
     * @notice Get available liquidity for loans
     * @return uint256 Available liquidity amount
     */
    function getAvailableLiquidity() external view returns (uint256) {
        return totalLiquidity - totalUtilized;
    }
    
    /**
     * @notice Get current reserve ratio
     * @return uint256 Reserve ratio in basis points
     */
    function getReserveRatio() external view returns (uint256) {
        if (totalLiquidity == 0) return BASIS_POINTS;
        return ((totalLiquidity - totalUtilized) * BASIS_POINTS) / totalLiquidity;
    }
    
    /**
     * @notice Get utilization ratio
     * @return uint256 Utilization ratio in basis points
     */
    function getUtilizationRatio() external view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        return (totalUtilized * BASIS_POINTS) / totalLiquidity;
    }
}

