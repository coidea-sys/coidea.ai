/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const config = require('../config');

/**
 * @swagger
 * /tasks/create:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - reward
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               taskType:
 *                 type: integer
 *                 description: 0=Coding, 1=Design, 2=Research, etc.
 *               reward:
 *                 type: string
 *                 description: Reward in wei
 *               deadline:
 *                 type: integer
 *                 description: Unix timestamp
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               minReputation:
 *                 type: integer
 *               isMultiAgent:
 *                 type: boolean
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/publish:
 *   post:
 *     summary: Publish a task (move from Draft to Open)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *         description: Task published successfully
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/apply:
 *   post:
 *     summary: Apply for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposal
 *             properties:
 *               agentId:
 *                 type: integer
 *               proposal:
 *                 type: string
 *               proposedPrice:
 *                 type: string
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/assign:
 *   post:
 *     summary: Assign task to an applicant
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *             properties:
 *               applicationId:
 *                 type: string
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/submit:
 *   post:
 *     summary: Submit work for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliverableURI
 *             properties:
 *               deliverableURI:
 *                 type: string
 *                 description: IPFS URI of deliverable
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work submitted successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/complete:
 *   post:
 *     summary: Complete task and release payment
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *         description: Task completed successfully
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task data
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/{taskId}/applications:
 *   get:
 *     summary: Get applications for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of applications
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/publisher/{address}:
 *   get:
 *     summary: Get tasks by publisher address
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of task IDs
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/worker/{address}:
 *   get:
 *     summary: Get tasks by worker address
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of task IDs
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /tasks/list/active:
 *   get:
 *     summary: Get all active (Open) tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of task IDs
 *       500:
 *         description: Server error
 */
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
