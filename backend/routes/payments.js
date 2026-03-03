const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

// Create new payment
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

// Process payment
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

// Get payment by ID
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
