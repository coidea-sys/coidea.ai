import React from 'react';
import { render, screen } from '@testing-library/react';
import { WalletManager } from './WalletManager';

const mockDeposit = jest.fn();
const mockWithdraw = jest.fn();
const mockGetBalance = jest.fn();

jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    deposit: mockDeposit,
    withdraw: mockWithdraw,
    getBalance: mockGetBalance,
    isLoading: false,
    error: null,
  }),
}));

describe('WalletManager', () => {
  beforeEach(() => {
    mockGetBalance.mockResolvedValue({
      available: '5.0',
      locked: '1.0',
      invested: '2.0',
      totalDeposited: '10.0',
      totalWithdrawn: '3.0',
    });
  });

  it('should render wallet manager', async () => {
    render(<WalletManager address="0x123" />);
    
    expect(await screen.findByTestId('wallet-manager')).toBeInTheDocument();
  });

  it('should display balance', async () => {
    render(<WalletManager address="0x123" />);
    
    expect(await screen.findByText(/可用余额:/)).toBeInTheDocument();
    expect(await screen.findByText(/5.0 ETH/)).toBeInTheDocument();
  });

  it('should have deposit button', async () => {
    render(<WalletManager address="0x123" />);
    
    expect(await screen.findByTestId('deposit-btn')).toBeInTheDocument();
  });

  it('should have withdraw button', async () => {
    render(<WalletManager address="0x123" />);
    
    expect(await screen.findByTestId('withdraw-btn')).toBeInTheDocument();
  });
});
