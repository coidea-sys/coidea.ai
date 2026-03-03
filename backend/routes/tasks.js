const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

// Create new task
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      taskType,
      reward,
      deadline,
      requiredSkills,
      minReputation,
      isMultiAgent,
      privateKey
    } = req.body;

    // Validate input
    if (!title || !description || !reward || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, reward, deadline'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.createTask({
      title,
      description,
      taskType: taskType || 0,
      reward,
      deadline,
      requiredSkills: requiredSkills || [],
      minReputation: minReputation || 0,
      isMultiAgent: isMultiAgent || false
    }, signer);

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

// Publish task (move from Draft to Open)
router.post('/:taskId/publish', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { privateKey } = req.body;

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.publishTask(taskId, signer);

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

// Apply for task
router.post('/:taskId/apply', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { agentId, proposal, proposedPrice, privateKey } = req.body;

    if (!proposal) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: proposal'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.applyForTask(taskId, agentId || 0, proposal, proposedPrice || 0, signer);

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

// Assign task to applicant
router.post('/:taskId/assign', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { applicationId, privateKey } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: applicationId'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.assignTask(taskId, applicationId, signer);

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

// Submit work
router.post('/:taskId/submit', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { deliverableURI, privateKey } = req.body;

    if (!deliverableURI) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: deliverableURI'
      });
    }

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.submitWork(taskId, deliverableURI, signer);

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

// Complete task (publisher approves and pays)
router.post('/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { privateKey } = req.body;

    const signerKey = privateKey || config.localPrivateKey;
    const signer = blockchain.getSigner(signerKey);

    const result = await blockchain.completeTask(taskId, signer);

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

// Get task applications
router.get('/:taskId/applications', async (req, res) => {
  try {
    const { taskId } = req.params;
    const applications = await blockchain.getTaskApplications(taskId);
    res.json({
      success: true,
      data: applications
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
    const taskIds = await blockchain.getPublisherTasks(address);
    res.json({
      success: true,
      data: taskIds
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
    const taskIds = await blockchain.getWorkerTasks(address);
    res.json({
      success: true,
      data: taskIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active tasks
router.get('/list/active', async (req, res) => {
  try {
    const taskIds = await blockchain.getActiveTasks();
    res.json({
      success: true,
      data: taskIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
