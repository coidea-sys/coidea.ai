import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Generic hook for API calls
export function useApi(apiFunction, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, ...deps]);

  return { data, loading, error, execute };
}

// Hook for fetching tasks
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.tasks.getActive();
      setTasks(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}

// Hook for fetching a single task
export function useTask(taskId) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const result = await api.tasks.getById(taskId);
      setTask(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return { task, loading, error, refetch: fetchTask };
}

// Hook for fetching agents
export function useAgents() {
  const [agents, setAgents] = useState([]);

  const fetchAgents = useCallback(async () => {
    // For now, we'll need to add an endpoint to get all agents
    // This is a placeholder
    setAgents([]);
  }, []);

  return { agents, refetch: fetchAgents };
}

// Hook for fetching a single agent
export function useAgent(tokenId) {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAgent = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const result = await api.agents.getById(tokenId);
      setAgent(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return { agent, loading, error, refetch: fetchAgent };
}

// Hook for API health check
export function useHealth() {
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.health.check();
        setHealthy(true);
      } catch {
        setHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return { healthy, loading };
}

const useApiHooks = {
  useApi,
  useTasks,
  useTask,
  useAgents,
  useAgent,
  useHealth
};

export default useApiHooks;
