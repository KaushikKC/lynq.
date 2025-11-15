import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// NOTE: This controller handles operations that REQUIRE special roles
// Regular user operations should be done from frontend with user's wallet

const VERIFICATION_SBT_ABI = [
  'function mintSBT(address to, string calldata metadataURI) external',
  'function isVerified(address user) external view returns (bool)',
];

const CONTRACTS = {
  VerificationSBT: '0xa993CFC2dE1C1dAc43aB227FA699f0DeAa2F4B16',
};

/**
 * Mint SBT via agent (requires VERIFIER_ROLE)
 * This is a special case - user cannot mint their own SBT due to access control
 */
export const mintSBTViaAgent = async (req: Request, res: Response) => {
  try {
    const { address, metadataURI } = req.body;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
      });
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
    );

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    if (!agentPrivateKey) {
      logger.error('AGENT_PRIVATE_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Agent wallet not configured',
      });
    }

    const agentWallet = new ethers.Wallet(agentPrivateKey, provider);
    const contract = new ethers.Contract(
      CONTRACTS.VerificationSBT,
      VERIFICATION_SBT_ABI,
      agentWallet
    );

    // Check if already verified
    const isVerified = await contract.isVerified(address);
    if (isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Already verified',
        alreadyMinted: true,
      });
    }

    // Mint SBT
    logger.info(`Agent minting SBT for ${address}`);
    const tx = await contract.mintSBT(address, metadataURI || `ipfs://verified/${address}`);
    const receipt = await tx.wait();

    logger.info(`SBT minted: ${receipt.hash}`);

    return res.status(200).json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    logger.error('Error minting SBT:', error);
    return res.status(500).json({
      success: false,
      error: error.reason || 'Failed to mint SBT',
    });
  }
};
