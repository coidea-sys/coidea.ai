import React, { useState, useEffect } from 'react';
import { useTask } from '../hooks/useTask';
import { TaskApplications } from './TaskApplications';

const TASK_STATES = ['草稿', '开放', '已分配', '已提交', '审核中', '已完成', '已取消', '争议'];

export function TaskDetail({ taskId, account, onBack }) {
  const { getTask, applyForTask, submitWork, isLoading, error } = useTask();
  const [task, setTask] = useState(null);
  const [applicationPrice, setApplicationPrice] = useState('');
  const [workResult, setWorkResult] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadTask = async () => {
    const data = await getTask(taskId);
    setTask(data);
    if (data) {
      setApplicationPrice(data.reward);
    }
  };

  const handleApply = async () => {
    try {
      await applyForTask(taskId, applicationPrice);
      setActionSuccess('申请已提交！');
      await loadTask();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleSubmitWork = async () => {
    try {
      await submitWork(taskId, workResult);
      setActionSuccess('工作已提交！');
      await loadTask();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleComplete = async () => {
    // Contract doesn't have completeTask function
    // Task completion is handled by submitWork or publisher action
    setActionSuccess('功能开发中 - 合约暂不支持自动完成');
  };

  if (!task) {
    return <div>加载中...</div>;
  }

  const isPublisher = task.publisher?.toLowerCase() === account?.toLowerCase();
  const isWorker = task.worker?.toLowerCase() === account?.toLowerCase();
  const isOpen = task.state === 1;
  const isAssigned = task.state === 2;
  const isSubmitted = task.state === 3;

  return (
    <div data-testid="task-detail" style={{ padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '16px' }}>
        ← 返回列表
      </button>

      <h2>{task.title}</h2>
      <p>{task.description}</p>

      <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
        <div><strong>奖励:</strong> {task.reward} POL</div>
        <div><strong>状态:</strong> {TASK_STATES[task.state] || '未知'}</div>
        <div><strong>发布者:</strong> {task.publisher}</div>
        {task.worker && <div><strong>执行者:</strong> {task.worker}</div>}
      </div>

      {actionSuccess && (
        <div style={{ 
          padding: '12px', 
          background: '#d4edda', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {actionSuccess}
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#f8d7da', 
          borderRadius: '4px',
          marginBottom: '16px',
          color: '#721c24'
        }}>
          {error}
        </div>
      )}

      {/* 申请任务 */}
      {isOpen && !isPublisher && (
        <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
          <h3>申请任务</h3>
          <div style={{ marginBottom: '12px' }}>
            <label>报价 (ETH): </label>
            <input
              type="number"
              step="0.001"
              value={applicationPrice}
              onChange={(e) => setApplicationPrice(e.target.value)}
              style={{ width: '150px', marginLeft: '8px' }}
            />
          </div>
          <button 
            onClick={handleApply}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '提交中...' : '申请任务'}
          </button>
        </div>
      )}

      {/* 提交工作 */}
      {isAssigned && isWorker && (
        <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
          <h3>提交工作成果</h3>
          <textarea
            value={workResult}
            onChange={(e) => setWorkResult(e.target.value)}
            placeholder="输入工作成果链接或描述..."
            style={{ width: '100%', minHeight: '100px', marginBottom: '12px' }}
          />
          <button 
            onClick={handleSubmitWork}
            disabled={isLoading || !workResult.trim()}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '提交中...' : '提交工作'}
          </button>
        </div>
      )}

      {/* 完成任务 */}
      {isSubmitted && isPublisher && (
        <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
          <h3>验收工作</h3>
          <p>执行者已提交工作成果，请验收。</p>
          <button 
            onClick={handleComplete}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '处理中...' : '确认完成并支付'}
          </button>
        </div>
      )}

      {/* 状态提示 */}
      {isOpen && isPublisher && (
        <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '4px', marginBottom: '16px' }}>
          等待申请者...
        </div>
      )}

      {/* 申请者列表 - 仅发布者可见 */}
      {isOpen && isPublisher && (
        <TaskApplications 
          taskId={taskId} 
          isPublisher={isPublisher}
          onAssigned={loadTask}
        />
      )}

      {isAssigned && isPublisher && (
        <div style={{ padding: '12px', background: '#d1ecf1', borderRadius: '4px' }}>
          任务已分配给 {task.worker?.slice(0, 6)}...{task.worker?.slice(-4)}
        </div>
      )}
    </div>
  );
}
