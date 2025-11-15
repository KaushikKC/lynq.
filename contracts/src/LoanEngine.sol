// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentController.sol";
import "./VerificationSBT.sol";
import "./TreasuryPool.sol";
import "./MultiCurrencyManager.sol";

/**
 * @title LoanEngine
 * @notice Core contract for managing loan lifecycle in the Lynq platform
 * @dev Handles loan requests, approvals, disbursements, repayments, and credit scoring
 */
contract LoanEngine is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum LoanStatus {
        Requested,
        Approved,
        Disbursed,
        Repaid,
        Defaulted,
        Cancelled
    }
    
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // In basis points (e.g., 500 = 5%)
        uint256 issuedAt;
        uint256 dueAt;
        uint256 repaid;
        LoanStatus status;
        string reason;
    }
    
    IERC20 public immutable usdc;
    AgentController public immutable agentController;
    VerificationSBT public immutable verificationSBT;
    TreasuryPool public immutable treasuryPool;
    MultiCurrencyManager public multiCurrencyManager;
    
    uint256 private _loanIdCounter;
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(address => uint256) public creditScore;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant INITIAL_CREDIT_SCORE = 500;
    uint256 public constant MAX_CREDIT_SCORE = 1000;
    uint256 public constant MIN_CREDIT_SCORE = 0;
    uint256 public constant DEFAULT_LOAN_DURATION = 90 days;
    
    // Limits
    uint256 public constant MIN_LOAN_AMOUNT = 5 * 10**6; // 5 USDC
    uint256 public constant MAX_LOAN_AMOUNT = 50000 * 10**6; // 50,000 USDC
    uint256 public constant MAX_INTEREST_RATE = 5000; // 50%
    
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        string reason
    );
    
    event LoanApproved(
        uint256 indexed loanId,
        address indexed agent,
        uint256 interestRate,
        uint256 dueAt
    );
    
    event LoanDisbursed(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed payer,
        uint256 amount,
        uint256 totalRepaid
    );
    
    event LoanFullyRepaid(
        uint256 indexed loanId,
        address indexed borrower
    );
    
    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower
    );
    
    event LoanCancelled(
        uint256 indexed loanId,
        address indexed borrower
    );
    
    event CreditScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    modifier onlyScreeningAgent() {
        require(
            agentController.hasRole(agentController.SCREENING_AGENT(), msg.sender),
            "LoanEngine: Caller is not a screening agent"
        );
        _;
    }
    
    modifier onlyComplianceAgent() {
        require(
            agentController.hasRole(agentController.COMPLIANCE_AGENT(), msg.sender),
            "LoanEngine: Caller is not a compliance agent"
        );
        _;
    }
    
    constructor(
        address _usdc,
        address _agentController,
        address _verificationSBT,
        address _treasuryPool
    ) {
        require(_usdc != address(0), "LoanEngine: Invalid USDC address");
        require(_agentController != address(0), "LoanEngine: Invalid agent controller");
        require(_verificationSBT != address(0), "LoanEngine: Invalid verification SBT");
        require(_treasuryPool != address(0), "LoanEngine: Invalid treasury pool");
        
        usdc = IERC20(_usdc);
        agentController = AgentController(_agentController);
        verificationSBT = VerificationSBT(_verificationSBT);
        treasuryPool = TreasuryPool(_treasuryPool);
    }
    
    /**
     * @notice Set multi-currency manager (can only be called once)
     * @param _multiCurrencyManager Address of the multi-currency manager
     */
    function setMultiCurrencyManager(address _multiCurrencyManager) external onlyScreeningAgent {
        require(address(multiCurrencyManager) == address(0), "LoanEngine: Manager already set");
        require(_multiCurrencyManager != address(0), "LoanEngine: Invalid manager address");
        multiCurrencyManager = MultiCurrencyManager(_multiCurrencyManager);
    }
    
    /**
     * @notice Request a loan
     * @param amount Amount of USDC to borrow
     * @param reason Reason for the loan
     * @return loanId ID of the created loan
     */
    function requestLoan(uint256 amount, string calldata reason) 
        external 
        nonReentrant 
        returns (uint256 loanId) 
    {
        require(verificationSBT.isVerified(msg.sender), "LoanEngine: User not verified");
        require(amount >= MIN_LOAN_AMOUNT, "LoanEngine: Amount below minimum");
        require(amount <= MAX_LOAN_AMOUNT, "LoanEngine: Amount exceeds maximum");
        require(bytes(reason).length > 0, "LoanEngine: Reason required");
        
        // Initialize credit score if first loan
        if (creditScore[msg.sender] == 0) {
            creditScore[msg.sender] = INITIAL_CREDIT_SCORE;
        }
        
        _loanIdCounter++;
        loanId = _loanIdCounter;
        
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: 0,
            issuedAt: 0,
            dueAt: 0,
            repaid: 0,
            status: LoanStatus.Requested,
            reason: reason
        });
        
        userLoans[msg.sender].push(loanId);
        
        emit LoanRequested(loanId, msg.sender, amount, reason);
    }
    
    /**
     * @notice Approve a loan and set interest rate
     * @param loanId ID of the loan to approve
     * @param interestRate Interest rate in basis points
     */
    function approveLoan(uint256 loanId, uint256 interestRate) 
        external 
        onlyScreeningAgent 
        nonReentrant 
    {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        require(loan.status == LoanStatus.Requested, "LoanEngine: Loan not in requested status");
        require(interestRate <= MAX_INTEREST_RATE, "LoanEngine: Interest rate too high");
        require(verificationSBT.isVerified(loan.borrower), "LoanEngine: Borrower no longer verified");
        
        loan.status = LoanStatus.Approved;
        loan.interestRate = interestRate;
        loan.issuedAt = block.timestamp;
        loan.dueAt = block.timestamp + DEFAULT_LOAN_DURATION;
        
        emit LoanApproved(loanId, msg.sender, interestRate, loan.dueAt);
        
        // Automatically disburse the loan
        _disburseLoan(loanId);
    }
    
    /**
     * @notice Internal function to disburse a loan
     * @param loanId ID of the loan to disburse
     */
    function _disburseLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Approved, "LoanEngine: Loan not approved");
        
        loan.status = LoanStatus.Disbursed;
        
        // Transfer USDC from this contract to borrower
        // (Treasury pool should have already sent funds to this contract)
        usdc.safeTransfer(loan.borrower, loan.amount);
        
        emit LoanDisbursed(loanId, loan.borrower, loan.amount);
    }
    
    /**
     * @notice Repay a loan (partial or full)
     * @param loanId ID of the loan to repay
     * @param amount Amount to repay
     */
    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        require(loan.status == LoanStatus.Disbursed, "LoanEngine: Loan not disbursed");
        require(amount > 0, "LoanEngine: Amount must be greater than 0");
        
        uint256 totalOwed = _calculateTotalOwed(loan);
        uint256 remaining = totalOwed - loan.repaid;
        require(amount <= remaining, "LoanEngine: Amount exceeds remaining balance");
        
        // Transfer USDC from borrower to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        loan.repaid += amount;
        
        emit LoanRepaid(loanId, msg.sender, amount, loan.repaid);
        
        // Check if fully repaid
        if (loan.repaid >= totalOwed) {
            loan.status = LoanStatus.Repaid;
            
            // Transfer repayment to treasury pool
            usdc.approve(address(treasuryPool), loan.repaid);
            treasuryPool.receiveRepayment(loan.repaid);
            
            // Update credit score positively for on-time repayment
            if (block.timestamp <= loan.dueAt) {
                _updateCreditScore(loan.borrower, 50, true); // +50 for on-time repayment
            } else {
                _updateCreditScore(loan.borrower, 10, true); // +10 for late but complete repayment
            }
            
            emit LoanFullyRepaid(loanId, loan.borrower);
        }
    }
    
    /**
     * @notice Mark a loan as defaulted
     * @param loanId ID of the loan to mark as defaulted
     */
    function markAsDefaulted(uint256 loanId) external onlyComplianceAgent {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        require(loan.status == LoanStatus.Disbursed, "LoanEngine: Loan not disbursed");
        require(block.timestamp > loan.dueAt, "LoanEngine: Loan not yet overdue");
        
        loan.status = LoanStatus.Defaulted;
        
        // Significantly reduce credit score for default
        _updateCreditScore(loan.borrower, 200, false);
        
        emit LoanDefaulted(loanId, loan.borrower);
    }
    
    /**
     * @notice Cancel a loan request
     * @param loanId ID of the loan to cancel
     */
    function cancelLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        require(
            msg.sender == loan.borrower || 
            agentController.hasRole(agentController.SCREENING_AGENT(), msg.sender),
            "LoanEngine: Not authorized to cancel"
        );
        require(
            loan.status == LoanStatus.Requested || loan.status == LoanStatus.Approved,
            "LoanEngine: Cannot cancel loan in current status"
        );
        
        loan.status = LoanStatus.Cancelled;
        
        emit LoanCancelled(loanId, loan.borrower);
    }
    
    /**
     * @notice Update a user's credit score (agent only)
     * @param user Address of the user
     * @param delta Amount to change (positive or negative)
     * @param increase True to increase, false to decrease
     */
    function updateCreditScore(address user, uint256 delta, bool increase) 
        external 
        onlyScreeningAgent 
    {
        _updateCreditScore(user, delta, increase);
    }
    
    /**
     * @notice Internal function to update credit score
     */
    function _updateCreditScore(address user, uint256 delta, bool increase) internal {
        uint256 oldScore = creditScore[user];
        uint256 newScore;
        
        if (increase) {
            newScore = oldScore + delta;
            if (newScore > MAX_CREDIT_SCORE) {
                newScore = MAX_CREDIT_SCORE;
            }
        } else {
            if (delta >= oldScore) {
                newScore = MIN_CREDIT_SCORE;
            } else {
                newScore = oldScore - delta;
            }
        }
        
        creditScore[user] = newScore;
        
        emit CreditScoreUpdated(user, oldScore, newScore);
    }
    
    /**
     * @notice Get a user's credit score
     * @param user Address of the user
     * @return uint256 Credit score
     */
    function getCreditScore(address user) external view returns (uint256) {
        uint256 score = creditScore[user];
        return score == 0 ? INITIAL_CREDIT_SCORE : score;
    }
    
    /**
     * @notice Calculate total amount owed (principal + interest)
     * @param loan Loan struct
     * @return uint256 Total amount owed
     */
    function _calculateTotalOwed(Loan memory loan) internal pure returns (uint256) {
        uint256 interest = (loan.amount * loan.interestRate) / BASIS_POINTS;
        return loan.amount + interest;
    }
    
    /**
     * @notice Get total amount owed for a loan
     * @param loanId ID of the loan
     * @return uint256 Total amount owed
     */
    function getTotalOwed(uint256 loanId) external view returns (uint256) {
        Loan memory loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        return _calculateTotalOwed(loan);
    }
    
    /**
     * @notice Get remaining balance for a loan
     * @param loanId ID of the loan
     * @return uint256 Remaining balance
     */
    function getRemainingBalance(uint256 loanId) external view returns (uint256) {
        Loan memory loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        
        if (loan.status == LoanStatus.Repaid) {
            return 0;
        }
        
        uint256 totalOwed = _calculateTotalOwed(loan);
        return totalOwed - loan.repaid;
    }
    
    /**
     * @notice Get all loan IDs for a user
     * @param user Address of the user
     * @return uint256[] Array of loan IDs
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
    
    /**
     * @notice Get loan details
     * @param loanId ID of the loan
     * @return Loan struct
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        require(loans[loanId].id != 0, "LoanEngine: Loan does not exist");
        return loans[loanId];
    }
    
    /**
     * @notice Repay loan with any supported token
     * @param loanId ID of the loan to repay
     * @param token Token address for repayment
     * @param amount Amount to repay in the specified token
     */
    function repayLoanWithToken(
        uint256 loanId,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(address(multiCurrencyManager) != address(0), "LoanEngine: Multi-currency not enabled");
        
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "LoanEngine: Loan does not exist");
        require(loan.status == LoanStatus.Disbursed, "LoanEngine: Loan not disbursed");
        require(amount > 0, "LoanEngine: Amount must be greater than 0");
        require(multiCurrencyManager.isTokenSupported(token), "LoanEngine: Token not supported");
        
        // Convert to USDC equivalent
        uint256 usdcEquivalent = multiCurrencyManager.convertToUSDC(token, amount);
        
        uint256 totalOwed = _calculateTotalOwed(loan);
        uint256 remaining = totalOwed - loan.repaid;
        require(usdcEquivalent <= remaining, "LoanEngine: Amount exceeds balance");
        
        // Transfer token from borrower to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // If not USDC, convert to USDC for treasury
        if (token != address(usdc)) {
            // In production: swap through DEX or Circle Gateway
            // For hackathon: assume 1:1 conversion is handled
            IERC20(token).approve(address(treasuryPool), amount);
        }
        
        // Update repayment in USDC terms
        loan.repaid += usdcEquivalent;
        
        emit LoanRepaid(loanId, msg.sender, usdcEquivalent, loan.repaid);
        
        // Check if fully repaid
        if (loan.repaid >= totalOwed) {
            loan.status = LoanStatus.Repaid;
            
            // Transfer to treasury (in USDC)
            if (token == address(usdc)) {
                usdc.approve(address(treasuryPool), loan.repaid);
                treasuryPool.receiveRepayment(loan.repaid);
            }
            
            // Update credit score positively for on-time repayment
            if (block.timestamp <= loan.dueAt) {
                _updateCreditScore(loan.borrower, 50, true);
            } else {
                _updateCreditScore(loan.borrower, 10, true);
            }
            
            emit LoanFullyRepaid(loanId, loan.borrower);
        }
    }
}

