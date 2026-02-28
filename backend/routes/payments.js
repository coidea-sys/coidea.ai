const express = require('express');
const router = express.Router();

// Payment authorization endpoint
router.post('/authorize', (req, res) => {
  const { amount, payee, duration } = req.body;
  
  if (!amount || !payee) {
    return res.status(400).json({ error: 'Amount and payee are required' });
  }
  
  const authorization = {
    id: Date.now().toString(),
    amount,
    payee,
    duration: duration || 3600,
    state: 'Pending',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(authorization);
});

// Settlement endpoint
router.post('/settle', (req, res) => {
  const { authorizationId, amount } = req.body;
  
  res.json({
    authorizationId,
    settledAmount: amount,
    state: 'Settled',
    settledAt: new Date().toISOString()
  });
});

module.exports = router;
