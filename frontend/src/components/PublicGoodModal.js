import React, { useState } from 'react';
import { ethers } from 'ethers';

function PublicGoodModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [milestones, setMilestones] = useState([
    { amount: '', description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addMilestone = () => {
    setMilestones([...milestones, { amount: '', description: '' }]);
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const totalMilestoneAmount = milestones.reduce((sum, m) => {
      return sum + parseFloat(m.amount || 0);
    }, 0);

    if (Math.abs(totalMilestoneAmount - parseFloat(targetAmount)) > 0.001) {
      alert('Milestone amounts must sum to target amount');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      milestones
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content public-good-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Public Good Project</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Open Source Library for Web4"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the project and its impact..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Target Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="1.0"
              required
            />
          </div>

          <div className="milestones-section">
            <label>Milestones</label>
            {milestones.map((milestone, index) => (
              <div key={index} className="milestone-row">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount (ETH)"
                  value={milestone.amount}
                  onChange={e => updateMilestone(index, 'amount', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Milestone description"
                  value={milestone.description}
                  onChange={e => updateMilestone(index, 'description', e.target.value)}
                  required
                />
                
                {milestones.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-remove"
                    onClick={() => removeMilestone(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addMilestone}>
              + Add Milestone
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project (+50 EXP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublicGoodModal;
