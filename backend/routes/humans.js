const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

// Register new human
router.post('/register', async (req, res) => {
  try {
    const { name, wallet, privateKey } = req.body;

    // Validate input
    if (!name || !wallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, wallet'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.registerHuman(name, wallet, signer);

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

// Get human by ID
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const human = await blockchain.getHuman(tokenId);
    res.json({
      success: true,
      data: human
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get human by wallet
router.get('/wallet/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const human = await blockchain.getHumanByWallet(wallet);
    res.json({
      success: true,
      data: human
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get human level
router.get('/:tokenId/level', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const level = await blockchain.getHumanLevel(tokenId);
    const levelName = await blockchain.getHumanLevelName(tokenId);
    res.json({
      success: true,
      data: {
        level,
        levelName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get human permissions
router.get('/:tokenId/permissions', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const [canPublishTask, canArbitrate, canGovern] = await Promise.all([
      blockchain.canPublishTask(tokenId),
      blockchain.canArbitrate(tokenId),
      blockchain.canGovern(tokenId)
    ]);
    res.json({
      success: true,
      data: {
        canPublishTask,
        canArbitrate,
        canGovern
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
