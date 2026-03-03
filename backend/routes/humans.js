/**
 * @swagger
 * tags:
 *   name: Humans
 *   description: Human user management
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

/**
 * @swagger
 * /humans/register:
 *   post:
 *     summary: Register a new human user
 *     tags: [Humans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - wallet
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human display name
 *               wallet:
 *                 type: string
 *                 description: Wallet address
 *               privateKey:
 *                 type: string
 *                 description: Optional private key for signing
 *     responses:
 *       200:
 *         description: Human registered successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /humans/{tokenId}:
 *   get:
 *     summary: Get human by token ID
 *     tags: [Humans]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Human data
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /humans/wallet/{wallet}:
 *   get:
 *     summary: Get human by wallet address
 *     tags: [Humans]
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Human data
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /humans/{tokenId}/level:
 *   get:
 *     summary: Get human level and level name
 *     tags: [Humans]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Level information
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
 *                     level:
 *                       type: integer
 *                     levelName:
 *                       type: string
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /humans/{tokenId}/permissions:
 *   get:
 *     summary: Get human permissions
 *     tags: [Humans]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permissions data
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
 *                     canPublishTask:
 *                       type: boolean
 *                     canArbitrate:
 *                       type: boolean
 *                     canGovern:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
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
