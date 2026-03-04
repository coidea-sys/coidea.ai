import React, { useState, useEffect } from 'react';
import { useTask } from '../hooks/useTask';

const TASK_STATES = ['草稿', '开放', '已分配', '已提交', '审核中', '已完成', '已取消', '争议'];

export function TaskList({ onSelectTask, filter = 'all' }) {
  const { getAllTasks, isLoading, error } = useTask();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    const allTasks = await getAllTasks();
    
    if (filter === 'open') {
      setTasks(allTasks.filter(t => t.state === 1));
    } else if (filter === 'my') {
      // Would filter by current user
      setTasks(allTasks);
    } else {
      setTasks(allTasks);
    }
  };

  if (isLoading) {
    return (<div data-testid="task-list-loading">加载任务中...</div>);
  }

  if (error) {
    return (<div data-testid="task-list-error" style={{ color: 'red' }}>{error}</div>);
  }

  if (tasks.length === 0) {
    return (
      <div data-testid="no-tasks">
        <p>暂无任务</p>
      </div>
    );
  }

  return (
    <div data-testid="task-list">
      <div style={{ display: 'grid', gap: '16px' }}>
        {tasks.map(task => (
          <div 
            key={task.id}
            onClick={() => onSelectTask?.(task)}
            style={{
              border: '1px solid #ddd',
              padding: '16px',
              borderRadius: '8px',
              cursor: onSelectTask ? 'pointer' : 'default',
            }}
          >
            <h4>{task.title}</h4>
            <div>奖励: {task.reward} ETH</div>
            <div>状态: {TASK_STATES[task.state] || '未知'}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              发布者: {task.publisher?.slice(0, 6)}...{task.publisher?.slice(-4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
