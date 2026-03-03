/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: X402 payment processing
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

/**
 * @swagger
 * /payments/create:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - payee
 *             properties:
 *               amount:
 *                 type: string
 *                 description: Payment amount in wei
 *               payee:
 *                 type: string
 *                 description: Recipient wallet address
 *               taskId:
 *                 type: string
 *                 description: Associated task ID
 *               privateKey:
 *                 type: string
 *                 description: Optional private key for signing
 *     responses:
 *       200:
 *         description: Payment created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/create', async (req, res) => {
  try {
    const { amount, payee, taskId, privateKey } = req.body;

    // Validate input
    if (!amount || !payee) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, payee'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.createPayment(amount, payee, taskId || '0', signer);

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
 * /payments/{paymentId}/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       500:
 *         description: Server error
 */
router.post('/:paymentId/process', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { privateKey } = req.body;

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.processPayment(paymentId, signer);

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
 * /payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment data
 *       500:
 *         description: Server error
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await blockchain.getPayment(paymentId);
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
