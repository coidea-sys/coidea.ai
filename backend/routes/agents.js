/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: AI Agent management
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

/**
 * @swagger
 * /agents/register:
 *   post:
 *     summary: Register a new AI Agent
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentName
 *               - agentURI
 *               - agentWallet
 *             properties:
 *               agentName:
 *                 type: string
 *                 description: Agent display name
 *               agentURI:
 *                 type: string
 *                 description: Metadata URI (IPFS recommended)
 *               agentWallet:
 *                 type: string
 *                 description: Wallet address for x402 payments
 *               privateKey:
 *                 type: string
 *                 description: Optional private key for signing
 *     responses:
 *       200:
 *         description: Agent registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                     agentName:
 *                       type: string
 *                     transactionHash:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { agentName, agentURI, agentWallet, privateKey } = req.body;

    // Validate input
    if (!agentName || !agentURI || !agentWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentName, agentURI, agentWallet'
      });
    }

    // Use provided private key or default local key
    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    // Register agent
    const result = await blockchain.registerAgent(agentName, agentURI, agentWallet, signer);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /agents/{tokenId}:
 *   get:
 *     summary: Get agent by token ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent token ID
 *     responses:
 *       200:
 *         description: Agent data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     agentName:
 *                       type: string
 *                     agentWallet:
 *                       type: string
 *                     state:
 *                       type: string
 *                     reputationScore:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const agent = await blockchain.getAgent(tokenId);
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /agents/wallet/{wallet}:
 *   get:
 *     summary: Get agent by wallet address
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent wallet address
 *     responses:
 *       200:
 *         description: Agent data
 *       500:
 *         description: Server error
 */
router.get('/wallet/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const agent = await blockchain.getAgentByWallet(wallet);
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /agents/registrant/{address}:
 *   get:
 *     summary: Get agents by registrant address
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Registrant wallet address
 *     responses:
 *       200:
 *         description: List of agents
 *       500:
 *         description: Server error
 */
router.get('/registrant/:address', async (req, res) => {
  try {
    const { address } = req.params;
    // This would query the blockchain for all agents by registrant
    res.json({
      success: true,
      data: [],
      message: 'Query not yet implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
