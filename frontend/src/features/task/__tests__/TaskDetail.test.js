import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetail } from '../components/TaskDetail';
import { useTask } from '../hooks/useTask';

// Mock useTask hook
jest.mock('../hooks/useTask');

const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'Test Description',
  reward: '0.1',
  state: 1, // Open
  publisher: '0x1234567890abcdef1234567890abcdef12345678',
  worker: null,
};

describe('TaskDetail', () => {
  const mockGetTask = jest.fn();
  const mockApplyForTask = jest.fn();
  const mockSubmitWork = jest.fn();

  beforeEach(() => {
    useTask.mockReturnValue({
      getTask: mockGetTask,
      applyForTask: mockApplyForTask,
      submitWork: mockSubmitWork,
      isLoading: false,
      error: null,
    });
    mockGetTask.mockResolvedValue(mockTask);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display task details', async () => {
    render(<TaskDetail taskId={1} account="0xabcdef1234567890abcdef1234567890abcdef12" onBack={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText(/0.1 POL/)).toBeInTheDocument();
  });

  it('should show back button', async () => {
    const onBack = jest.fn();
    render(<TaskDetail taskId={1} account="0xabcdef1234567890abcdef1234567890abcdef12" onBack={onBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('← 返回列表')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('← 返回列表'));
    expect(onBack).toHaveBeenCalled();
  });
});
