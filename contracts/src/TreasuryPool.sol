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
    
    // Multi-currency support
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenBalances;
    mapping(address => mapping(address => uint256)) public userDepositsPerToken;
    mapping(address => address) public priceOracles;
    
    // Budget Allocation System
    struct Allocation {
        string name;
        uint256 percentage; // in basis points
        address destination;
        uint256 allocated;
        uint256 spent;
        bool active;
    }
    
    mapping(uint256 => Allocation) public allocations;
    uint256 public allocationCount;
    uint256 public totalAllocationPercentage;
    
    // Scheduled Distribution System (Payroll)
    struct Distribution {
        address[] recipients;
        uint256[] amounts;
        uint256 frequency; // in seconds
        uint256 lastExecuted;
        bool active;
    }
    
    mapping(uint256 => Distribution) public distributions;
    uint256 public distributionCount;
    
    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event LiquidityProvided(address indexed loanEngine, uint256 amount);
    event RepaymentReceived(address indexed loanEngine, uint256 amount);
    event LoanEngineAuthorized(address indexed loanEngine, bool authorized);
    event TokenAdded(address indexed token, address indexed oracle);
    event MultiCurrencyDeposit(address indexed user, address indexed token, uint256 amount, uint256 usdcEquivalent);
    event AllocationCreated(uint256 indexed allocationId, string name, uint256 percentage);
    event FundsAllocated(uint256 indexed allocationId, uint256 amount);
    event DistributionCreated(uint256 indexed distributionId, uint256 frequency);
    event DistributionExecuted(uint256 indexed distributionId, uint256 totalAmount);
    
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
        
        // Initialize USDC as supported token
        supportedTokens[_usdc] = true;
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
    
    // ============================================
    // MULTI-CURRENCY SUPPORT
    // ============================================
    
    /**
     * @notice Add supported token for cross-border payments
     * @param token Token address to add
     * @param priceOracle Price oracle address for conversion
     */
    function addSupportedToken(address token, address priceOracle) 
        external 
        onlyTreasuryAgent 
    {
        require(token != address(0), "TreasuryPool: Invalid token");
        supportedTokens[token] = true;
        priceOracles[token] = priceOracle;
        emit TokenAdded(token, priceOracle);
    }
    
    /**
     * @notice Deposit any supported token (auto-converts to USDC equivalent)
     * @param token Token address to deposit
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "TreasuryPool: Token not supported");
        require(amount > 0, "TreasuryPool: Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Convert to USDC equivalent for accounting
        uint256 usdcEquivalent = _convertToUSDC(token, amount);
        
        userDepositsPerToken[msg.sender][token] += amount;
        deposits[msg.sender] += usdcEquivalent;
        totalLiquidity += usdcEquivalent;
        tokenBalances[token] += amount;
        
        emit MultiCurrencyDeposit(msg.sender, token, amount, usdcEquivalent);
    }
    
    /**
     * @notice Convert token amount to USDC equivalent
     * @param token Token address
     * @param amount Amount to convert
     * @return uint256 USDC equivalent
     */
    function _convertToUSDC(address token, uint256 amount) internal view returns (uint256) {
        if (token == address(usdc)) return amount;
        
        // For hackathon: Simple 1:1 conversion
        // In production: Query Chainlink price oracle
        return amount;
    }
    
    // ============================================
    // ALLOCATION SYSTEM
    // ============================================
    
    /**
     * @notice Create budget allocation rule
     * @param name Name of allocation (e.g., "High-Risk Loans")
     * @param percentage Percentage in basis points
     * @param destination Destination address for allocation
     * @return uint256 Allocation ID
     */
    function createAllocation(
        string calldata name,
        uint256 percentage,
        address destination
    ) external onlyTreasuryAgent returns (uint256) {
        require(percentage > 0 && percentage <= BASIS_POINTS, "TreasuryPool: Invalid percentage");
        require(totalAllocationPercentage + percentage <= BASIS_POINTS, "TreasuryPool: Total exceeds 100%");
        require(destination != address(0), "TreasuryPool: Invalid destination");
        
        allocationCount++;
        allocations[allocationCount] = Allocation({
            name: name,
            percentage: percentage,
            destination: destination,
            allocated: 0,
            spent: 0,
            active: true
        });
        
        totalAllocationPercentage += percentage;
        emit AllocationCreated(allocationCount, name, percentage);
        return allocationCount;
    }
    
    /**
     * @notice Execute allocations based on current treasury balance
     * @dev Transfers funds from treasury to destination addresses based on percentages
     */
    function executeAllocations() external onlyTreasuryAgent nonReentrant {
        // Calculate available funds based on tracked liquidity
        uint256 trackedAvailable = totalLiquidity - totalUtilized;
        require(trackedAvailable > 0, "TreasuryPool: No available funds to allocate");
        
        // Get actual contract balance to ensure we don't transfer more than available
        uint256 contractBalance = usdc.balanceOf(address(this));
        
        uint256 totalAllocated = 0;
        
        for (uint256 i = 1; i <= allocationCount; i++) {
            Allocation storage alloc = allocations[i];
            if (!alloc.active) continue;
            
            // Calculate allocation based on tracked available funds
            uint256 allocAmount = (trackedAvailable * alloc.percentage) / BASIS_POINTS;
            if (allocAmount == 0) continue;
            
            // Ensure we don't transfer more than contract actually has
            uint256 remainingContractBalance = contractBalance - totalAllocated;
            if (allocAmount > remainingContractBalance) {
                // Adjust to available balance if contract has less than tracked
                allocAmount = remainingContractBalance;
                if (allocAmount == 0) break;
            }
            
            // Actually transfer funds to destination
            usdc.safeTransfer(alloc.destination, allocAmount);
            
            // Update tracking
            alloc.allocated += allocAmount;
            alloc.spent += allocAmount;
            totalAllocated += allocAmount;
            
            emit FundsAllocated(i, allocAmount);
        }
        
        // Update total utilized to reflect allocated funds
        totalUtilized += totalAllocated;
    }
    
    /**
     * @notice Deactivate an allocation
     * @param allocationId ID of allocation to deactivate
     */
    function deactivateAllocation(uint256 allocationId) external onlyTreasuryAgent {
        require(allocationId > 0 && allocationId <= allocationCount, "TreasuryPool: Invalid allocation ID");
        Allocation storage alloc = allocations[allocationId];
        require(alloc.active, "TreasuryPool: Allocation already inactive");
        
        alloc.active = false;
        totalAllocationPercentage -= alloc.percentage;
    }
    
    // ============================================
    // SCHEDULED DISTRIBUTIONS (PAYROLL)
    // ============================================
    
    /**
     * @notice Schedule recurring distribution (payroll-style)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts for each recipient
     * @param frequency Frequency in seconds (e.g., 30 days)
     * @return uint256 Distribution ID
     */
    function scheduleDistribution(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 frequency
    ) external onlyTreasuryAgent returns (uint256) {
        require(recipients.length == amounts.length, "TreasuryPool: Length mismatch");
        require(recipients.length > 0, "TreasuryPool: No recipients");
        require(frequency > 0, "TreasuryPool: Invalid frequency");
        
        distributionCount++;
        Distribution storage dist = distributions[distributionCount];
        dist.recipients = recipients;
        dist.amounts = amounts;
        dist.frequency = frequency;
        dist.lastExecuted = block.timestamp;
        dist.active = true;
        
        emit DistributionCreated(distributionCount, frequency);
        return distributionCount;
    }
    
    /**
     * @notice Execute due distributions
     */
    function executeDistributions() external nonReentrant {
        for (uint256 i = 1; i <= distributionCount; i++) {
            Distribution storage dist = distributions[i];
            
            if (!dist.active) continue;
            if (block.timestamp < dist.lastExecuted + dist.frequency) continue;
            
            uint256 totalAmount = 0;
            for (uint256 j = 0; j < dist.recipients.length; j++) {
                usdc.safeTransfer(dist.recipients[j], dist.amounts[j]);
                totalAmount += dist.amounts[j];
            }
            
            dist.lastExecuted = block.timestamp;
            emit DistributionExecuted(i, totalAmount);
        }
    }
    
    /**
     * @notice Deactivate a scheduled distribution
     * @param distributionId ID of distribution to deactivate
     */
    function deactivateDistribution(uint256 distributionId) external onlyTreasuryAgent {
        require(distributionId > 0 && distributionId <= distributionCount, "TreasuryPool: Invalid distribution ID");
        Distribution storage dist = distributions[distributionId];
        require(dist.active, "TreasuryPool: Distribution already inactive");
        
        dist.active = false;
    }
    
    /**
     * @notice Get allocation details
     * @param allocationId Allocation ID
     * @return Allocation struct
     */
    function getAllocation(uint256 allocationId) external view returns (Allocation memory) {
        require(allocationId > 0 && allocationId <= allocationCount, "TreasuryPool: Invalid allocation ID");
        return allocations[allocationId];
    }
    
    /**
     * @notice Get distribution details
     * @param distributionId Distribution ID
     * @return Distribution struct
     */
    function getDistribution(uint256 distributionId) external view returns (Distribution memory) {
        require(distributionId > 0 && distributionId <= distributionCount, "TreasuryPool: Invalid distribution ID");
        return distributions[distributionId];
    }
}

