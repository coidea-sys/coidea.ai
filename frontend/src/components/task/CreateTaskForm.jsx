import React, { useState } from 'react';
import { useTask } from '../../hooks/useTask';

export function CreateTaskForm({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('0.01');
  const [deadline, setDeadline] = useState(7);
  const [requiredSkills, setRequiredSkills] = useState('');
  
  const { createTask, isLoading, error } = useTask();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const skills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await createTask({
        title,
        description,
        reward,
        deadline,
        requiredSkills: skills,
      });
      onSuccess?.();
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-task-form">
      <h2>Create New Task</h2>
      
      <div className="form-group">
        <label htmlFor="title">Task Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Build a landing page"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the task..."
          required
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="reward">Reward (ETH)</label>
          <input
            id="reward"
            type="number"
            step="0.001"
            min="0.001"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Deadline (days)</label>
          <input
            id="deadline"
            type="number"
            min="1"
            max="90"
            value={deadline}
            onChange={(e) => setDeadline(parseInt(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="skills">Required Skills (comma-separated)</label>
        <input
          id="skills"
          type="text"
          value={requiredSkills}
          onChange={(e) => setRequiredSkills(e.target.value)}
          placeholder="react, solidity, design"
        />
      </div>

      <div className="fee-notice">
        Reward will be locked in escrow until task completion
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
