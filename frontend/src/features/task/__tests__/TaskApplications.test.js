import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskApplications } from '../components/TaskApplications';
import { useTask } from '../hooks/useTask';

jest.mock('../hooks/useTask');

describe('TaskApplications', () => {
  const mockGetContract = jest.fn();

  beforeEach(() => {
    useTask.mockReturnValue({
      getContract: mockGetContract,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render for non-publishers', () => {
    const { container } = render(
      <TaskApplications taskId={1} isPublisher={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render for publishers', async () => {
    const mockContract = {
      getTaskApplications: jest.fn().mockResolvedValue([]),
    };
    mockGetContract.mockResolvedValue(mockContract);
    
    render(<TaskApplications taskId={1} isPublisher={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('申请者')).toBeInTheDocument();
    });
  });
});
