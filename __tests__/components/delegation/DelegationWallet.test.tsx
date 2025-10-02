import React from 'react';
import { render, screen } from '@testing-library/react';
import DelegationWallet from '@/components/delegation/DelegationWallet';
import { useEnsName } from 'wagmi';

jest.mock('wagmi');

const mockEns = useEnsName as jest.Mock;

describe('DelegationWallet', () => {
  it('shows ENS name when resolved', () => {
    mockEns.mockReturnValue({ data: 'name.eth' });
    render(<DelegationWallet address="0x1" />);
    expect(screen.getByText('name.eth - 0x1')).toBeInTheDocument();
  });

  it('shows address when ENS missing', () => {
    mockEns.mockReturnValue({ data: undefined });
    render(<DelegationWallet address="0x2" />);
    expect(screen.getByText('0x2')).toBeInTheDocument();
  });
});
