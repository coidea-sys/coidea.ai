const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');

// Get task by ID
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await blockchain.getTask(taskId);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tasks by publisher
router.get('/publisher/:address', async (req, res) => {
  try {
    const { address } = req.params;
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

// Get tasks by worker
router.get('/worker/:address', async (req, res) => {
  try {
    const { address } = req.params;
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
