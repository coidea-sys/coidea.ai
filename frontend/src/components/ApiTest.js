import React from 'react';
import { useTasks, useHealth } from '../hooks/useApi';

// Test component to verify API connection
function ApiTest() {
  const { healthy, loading: healthLoading } = useHealth();
  const { tasks, loading: tasksLoading, error } = useTasks();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Health Check</h3>
        {healthLoading ? (
          <p>Checking...</p>
        ) : healthy ? (
          <p style={{ color: 'green' }}>✅ Backend API is healthy</p>
        ) : (
          <p style={{ color: 'red' }}>❌ Backend API is down</p>
        )}
      </div>

      <div>
        <h3>Active Tasks</h3>
        {tasksLoading ? (
          <p>Loading tasks...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : tasks.length === 0 ? (
          <p>No active tasks found</p>
        ) : (
          <ul>
            {tasks.map((taskId) => (
              <li key={taskId}>Task ID: {taskId}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL}</p>
        <p><strong>Network:</strong> {process.env.REACT_APP_NETWORK_NAME}</p>
      </div>
    </div>
  );
}

export default ApiTest;
