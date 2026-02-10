import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextGenMintingFor } from '@/components/nextGen/collections/collectionParts/mint/NextGenMintShared';

jest.mock('wagmi', () => ({ useEnsName: jest.fn(() => ({ data: null })) }));
jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ address: '0xabc' })
}));

describe('NextGenMintingFor', () => {
  it('renders options for account and delegators', () => {
    render(
      <NextGenMintingFor
        title="Mint For"
        delegators={['0xdef']}
        mintForAddress=""
        setMintForAddress={jest.fn()}
      />
    );
    expect(screen.getAllByRole('option')).toHaveLength(3); // placeholder + 2 addresses
  });

  it('calls setMintForAddress on change', async () => {
    const setMintForAddress = jest.fn();
    render(
      <NextGenMintingFor
        title="Mint For"
        delegators={['0xdef']}
        mintForAddress=""
        setMintForAddress={setMintForAddress}
      />
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), '0xdef');
    expect(setMintForAddress).toHaveBeenCalledWith('0xdef');
  });
});
