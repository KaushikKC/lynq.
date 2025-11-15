import { Router } from 'express';
import { userController } from '../controllers/userController';
import { loanController } from '../controllers/loanController';
import { screeningController } from '../controllers/screeningController';
import { treasuryController } from '../controllers/treasuryController';
import { historyController } from '../controllers/historyController';
import * as agentController from '../controllers/agentController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User routes
router.get('/user/:address/summary', userController.getUserSummary.bind(userController));
router.get('/user/:address/reputation', userController.getUserReputation.bind(userController));
router.post('/user/create', userController.createUser.bind(userController));
router.put('/user/:address/credit-score', userController.updateCreditScore.bind(userController));
router.post('/user/:address/verification', userController.saveVerification.bind(userController));
router.get('/user/:address/verification', userController.getVerification.bind(userController));

// Agent operations (special role-required operations)
router.post('/agent/mint-sbt', agentController.mintSBTViaAgent);

// Loan routes
router.post('/loan/request', loanController.requestLoan.bind(loanController));
router.get('/loan/:loanId', loanController.getLoan.bind(loanController));
router.get('/loan/user/:address', loanController.getUserLoans.bind(loanController));
router.put('/loan/:loanId/approve', loanController.approveLoan.bind(loanController));
router.post('/loan/:loanId/auto-approve', loanController.autoApproveLoan.bind(loanController));
router.put('/loan/:loanId/disburse', loanController.disburseLoan.bind(loanController));
router.post('/loan/repayment', loanController.recordRepayment.bind(loanController));
router.put('/loan/:loanId/default', loanController.markAsDefaulted.bind(loanController));
router.get('/loan/pending', loanController.getPendingLoans.bind(loanController));

// Screening routes
router.get(
  '/screening/eligibility',
  screeningController.checkEligibility.bind(screeningController)
);
router.get(
  '/screening/recommended-amount',
  screeningController.getRecommendedAmount.bind(screeningController)
);

// Treasury routes
router.get('/treasury/metrics', treasuryController.getMetrics.bind(treasuryController));
router.post('/treasury/deposit', treasuryController.recordDeposit.bind(treasuryController));
router.post('/treasury/withdrawal', treasuryController.recordWithdrawal.bind(treasuryController));
router.post('/treasury/repayment', treasuryController.recordRepayment.bind(treasuryController));

// History routes
router.get('/history', historyController.getHistory.bind(historyController));
router.post('/history/event', historyController.recordEvent.bind(historyController));
router.get('/history/stats', historyController.getStats.bind(historyController));

export default router;
