const express = require('express');
const router = express.Router();

const tasks = [];

// Get all tasks
router.get('/', (req, res) => {
  res.json({
    tasks,
    total: tasks.length
  });
});

// Get task by ID
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create new task
router.post('/', (req, res) => {
  const { title, description, reward } = req.body;
  
  if (!title || !reward) {
    return res.status(400).json({ error: 'Title and reward are required' });
  }
  
  const task = {
    id: Date.now().toString(),
    title,
    description: description || '',
    reward,
    state: 'Draft',
    createdAt: new Date().toISOString()
  };
  
  tasks.push(task);
  res.status(201).json(task);
});

module.exports = router;
