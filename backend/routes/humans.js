const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');

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

module.exports = router;
