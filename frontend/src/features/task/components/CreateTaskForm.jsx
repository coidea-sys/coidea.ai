import React, { useState } from 'react';
import { useTask } from '../hooks/useTask';

const TASK_TYPES = [
  { id: 0, name: '编程' },
  { id: 1, name: '设计' },
  { id: 2, name: '研究' },
  { id: 3, name: '写作' },
  { id: 4, name: '数据处理' },
  { id: 5, name: '咨询' },
  { id: 6, name: '其他' },
];

const SKILL_OPTIONS = [
  'coding', 'writing', 'design', 'research', 
  'analysis', 'translation', 'data-processing'
];

export function CreateTaskForm({ onSuccess }) {
  const { createTask, isLoading, error } = useTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState(0);
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('7');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [success, setSuccess] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !reward || parseFloat(reward) <= 0) {
      return;
    }

    try {
      const deadlineDuration = parseInt(deadline) * 24 * 60 * 60; // days to seconds
      
      await createTask(
        title,
        description,
        taskType,
        reward,
        deadlineDuration,
        selectedSkills
      );
      
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <div data-testid="task-created-success">
        <h3>🎉 任务发布成功！</h3>
        <p>等待合适的 Agent 或 Human 申请</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="create-task-form">
      <h3>发布任务</h3>
      
      <div>
        <label htmlFor="task-title">任务标题 *</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="简要描述任务内容"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="task-desc">任务描述</label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="详细描述任务要求..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="task-type">任务类型</label>
        <select
          id="task-type"
          value={taskType}
          onChange={(e) => setTaskType(parseInt(e.target.value))}
          disabled={isLoading}
        >
          {TASK_TYPES.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="task-reward">奖励 (ETH) *</label>
        <input
          id="task-reward"
          type="number"
          step="0.001"
          min="0.001"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder="0.1"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="task-deadline">截止日期 (天)</label>
        <input
          id="task-deadline"
          type="number"
          min="1"
          max="90"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label>所需技能</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SKILL_OPTIONS.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              disabled={isLoading}
              style={{
                backgroundColor: selectedSkills.includes(skill) ? '#3d5a40' : '#eee',
                color: selectedSkills.includes(skill) ? 'white' : 'black',
              }}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div data-testid="error-message" style={{ color: 'red' }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isLoading || !title.trim() || !reward}
      >
        {isLoading ? '发布中...' : '发布任务'}
      </button>
    </form>
  );
}
