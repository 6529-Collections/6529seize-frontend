import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ManifoldMintingWidget from '@/components/manifoldMinting/ManifoldMintingWidget';
import { ManifoldClaimStatus, ManifoldPhase } from '@/hooks/useManifoldClaim';
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';

jest.mock('wagmi');

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(() => ({ address: '0x1' })),
}));

jest.mock('@/components/manifoldMinting/ManifoldMintingConnect', () =>
  function MockConnect(props: any) {
    return <button data-testid="connect" onClick={() => props.onMintFor('0xabc')}>connect</button>;
  }
);

const writeContract = jest.fn();
const reset = jest.fn();
(useWriteContract as jest.Mock).mockReturnValue({ writeContract, reset, isPending: false });
(useWaitForTransactionReceipt as jest.Mock).mockReturnValue({});
(useReadContract as jest.Mock).mockReturnValue({ data: 0 });
(useReadContracts as jest.Mock).mockReturnValue({ data: [{ result: false }] });

const baseProps = {
  contract: '0xC',
  proxy: '0xP',
  abi: [],
  claim: {
    status: ManifoldClaimStatus.ACTIVE,
    phase: ManifoldPhase.PUBLIC,
    instanceId: 1,
    cost: 1,
    startDate: 0,
    isFinalized: false,
  } as any,
  merkleTreeId: 1,
  setFee: jest.fn(),
  setMintForAddress: jest.fn(),
};

describe('ManifoldMintingWidget', () => {
  it('shows mint button after address provided', async () => {
    const user = userEvent.setup();
    render(<ManifoldMintingWidget {...baseProps} />);
    await user.click(screen.getByTestId('connect'));
    expect(screen.getByRole('button', { name: /SEIZE x1/i })).toBeInTheDocument();
  });

  it('allows minting when address provided', async () => {
    const user = userEvent.setup();
    const props = { ...baseProps, claim: { ...baseProps.claim, status: ManifoldClaimStatus.ACTIVE, phase: ManifoldPhase.PUBLIC } };
    render(<ManifoldMintingWidget {...props} />);
    // simulate setting address via connect component
    await user.click(screen.getByTestId('connect'));
    // button should now show seize text
    const btn = await screen.findByRole('button', { name: /SEIZE x1/i });
    expect(btn).toBeTruthy();
    await user.click(btn);
    expect(writeContract).toHaveBeenCalled();
  });
});
