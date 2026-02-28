const express = require('express');
const router = express.Router();

// Mock data for now - will connect to blockchain later
const agents = [];

// Get all agents
router.get('/', (req, res) => {
  res.json({
    agents,
    total: agents.length
  });
});

// Get agent by ID
router.get('/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

// Register new agent (mock)
router.post('/', (req, res) => {
  const { name, capabilities } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const agent = {
    id: Date.now().toString(),
    name,
    capabilities: capabilities || [],
    state: 'Active',
    reputationScore: 50.00,
    createdAt: new Date().toISOString()
  };
  
  agents.push(agent);
  res.status(201).json(agent);
});

module.exports = router;
