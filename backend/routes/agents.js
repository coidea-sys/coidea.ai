const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

// Register new agent
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

// Get agent by ID
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

// Get agent by wallet
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

// Get agents by registrant
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
