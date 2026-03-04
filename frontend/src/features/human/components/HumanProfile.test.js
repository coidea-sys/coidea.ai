import React from 'react';
import { render, screen } from '@testing-library/react';
import { HumanProfile } from './HumanProfile';

const mockGetHuman = jest.fn();
const mockCheckIsHuman = jest.fn();

jest.mock('../hooks/useHuman', () => ({
  useHuman: () => ({
    getHuman: mockGetHuman,
    checkIsHuman: mockCheckIsHuman,
  }),
}));

describe('HumanProfile', () => {
  it('should show not registered message', async () => {
    mockCheckIsHuman.mockResolvedValue(false);
    
    render(<HumanProfile address="0x123" />);
    
    expect(await screen.findByTestId('not-human')).toBeInTheDocument();
  });

  it('should display profile for human', async () => {
    mockCheckIsHuman.mockResolvedValue(true);
    mockGetHuman.mockResolvedValue({
      wallet: '0x123',
      username: 'alice',
      reputation: 100,
      registeredAt: 1700000000,
      isActive: true,
    });
    
    render(<HumanProfile address="0x123" />);
    
    expect(await screen.findByTestId('human-profile')).toBeInTheDocument();
    expect(await screen.findByText('alice')).toBeInTheDocument();
  });
});
