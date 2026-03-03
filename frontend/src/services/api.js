/**
 * API Service for coidea.ai frontend
 * Connects to backend REST API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }
  
  return data;
}

// Agents API
export const agentsApi = {
  // Get agent by ID
  getById: (tokenId) => apiCall(`/agents/${tokenId}`),
  
  // Get agent by wallet
  getByWallet: (wallet) => apiCall(`/agents/wallet/${wallet}`),
  
  // Register new agent
  register: (agentData) => apiCall('/agents/register', {
    method: 'POST',
    body: JSON.stringify(agentData)
  })
};

// Tasks API
export const tasksApi = {
  // Get task by ID
  getById: (taskId) => apiCall(`/tasks/${taskId}`),
  
  // Get active tasks
  getActive: () => apiCall('/tasks/list/active'),
  
  // Get tasks by publisher
  getByPublisher: (address) => apiCall(`/tasks/publisher/${address}`),
  
  // Get tasks by worker
  getByWorker: (address) => apiCall(`/tasks/worker/${address}`),
  
  // Create new task
  create: (taskData) => apiCall('/tasks/create', {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),
  
  // Publish task
  publish: (taskId, privateKey) => apiCall(`/tasks/${taskId}/publish`, {
    method: 'POST',
    body: JSON.stringify({ privateKey })
  }),
  
  // Apply for task
  apply: (taskId, applicationData) => apiCall(`/tasks/${taskId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData)
  })
};

// Humans API
export const humansApi = {
  // Get human by ID
  getById: (tokenId) => apiCall(`/humans/${tokenId}`),
  
  // Get human by wallet
  getByWallet: (wallet) => apiCall(`/humans/wallet/${wallet}`),
  
  // Get human level
  getLevel: (tokenId) => apiCall(`/humans/${tokenId}/level`),
  
  // Get human permissions
  getPermissions: (tokenId) => apiCall(`/humans/${tokenId}/permissions`),
  
  // Register new human
  register: (humanData) => apiCall('/humans/register', {
    method: 'POST',
    body: JSON.stringify(humanData)
  })
};

// Health check
export const healthApi = {
  check: () => apiCall('/health')
};

export default {
  agents: agentsApi,
  tasks: tasksApi,
  humans: humansApi,
  health: healthApi
};
