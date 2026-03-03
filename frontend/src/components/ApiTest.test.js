/**
 * ApiTest Component Unit Tests
 * TDD for API connection test component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ApiTest from './ApiTest';
import { useTasks, useHealth } from '../hooks/useApi';

// Mock the hooks
jest.mock('../hooks/useApi');

describe('ApiTest Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state for health check', () => {
    useHealth.mockReturnValue({ healthy: false, loading: true });
    useTasks.mockReturnValue({ tasks: [], loading: false, error: null });

    render(<ApiTest />);

    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('should show healthy status when API is up', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({ tasks: [], loading: false, error: null });

    render(<ApiTest />);

    expect(screen.getByText(/Backend API is healthy/)).toBeInTheDocument();
  });

  it('should show unhealthy status when API is down', () => {
    useHealth.mockReturnValue({ healthy: false, loading: false });
    useTasks.mockReturnValue({ tasks: [], loading: false, error: null });

    render(<ApiTest />);

    expect(screen.getByText(/Backend API is down/)).toBeInTheDocument();
  });

  it('should show loading state for tasks', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({ tasks: [], loading: true, error: null });

    render(<ApiTest />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('should display tasks when loaded', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({
      tasks: ['1', '2', '3'],
      loading: false,
      error: null
    });

    render(<ApiTest />);

    expect(screen.getByText('Task ID: 1')).toBeInTheDocument();
    expect(screen.getByText('Task ID: 2')).toBeInTheDocument();
    expect(screen.getByText('Task ID: 3')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({ tasks: [], loading: false, error: null });

    render(<ApiTest />);

    expect(screen.getByText('No active tasks found')).toBeInTheDocument();
  });

  it('should show error message when tasks fail to load', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: 'Network error'
    });

    render(<ApiTest />);

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();
  });

  it('should display API configuration info', () => {
    useHealth.mockReturnValue({ healthy: true, loading: false });
    useTasks.mockReturnValue({ tasks: [], loading: false, error: null });

    render(<ApiTest />);

    expect(screen.getByText(/API URL:/)).toBeInTheDocument();
    expect(screen.getByText(/Network:/)).toBeInTheDocument();
  });
});
