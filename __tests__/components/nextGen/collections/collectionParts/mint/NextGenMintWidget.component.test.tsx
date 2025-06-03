import React from 'react';
import { render, screen } from '@testing-library/react';
import NextGenMintWidget from '../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMintWidget';
import { Status } from '../../../../../../components/nextGen/nextgen_entities';

let minting = false;
jest.mock('../../../../../../components/nextGen/nextgen_helpers', () => ({
  useMintSharedState: () => ({
    proofResponse: [],
    setProofResponse: jest.fn(),
    mintForAddress: '',
    setMintForAddress: jest.fn(),
    salt: 0,
    mintCount: 1,
    setMintCount: jest.fn(),
    mintToInput: '',
    setMintToInput: jest.fn(),
    mintToAddress: '',
    setMintToAddress: jest.fn(),
    isMinting: minting,
    setIsMinting: jest.fn(),
    errors: [],
    setErrors: jest.fn(),
  }),
  getStatusFromDates: () => Status.LIVE,
}));

jest.mock('../../../../../../services/6529api', () => ({ fetchUrl: jest.fn() }));
jest.mock('../../../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div />);
jest.mock('../../../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock('wagmi', () => ({
  useChainId: jest.fn(),
  useEnsAddress: () => ({ data: undefined }),
  useEnsName: () => ({ data: undefined }),
  useWriteContract: () => ({
    writeContract: jest.fn(),
    isSuccess: false,
    isError: false,
    isPending: false,
    reset: jest.fn(),
    data: undefined,
    error: undefined,
  }),
}));
jest.mock('../../../../../../components/dotLoader/DotLoader', () => () => <div />);
jest.mock('../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMintShared', () => ({
  NextGenMintingFor: () => <div />,
}));
jest.mock('../../../../../../helpers/Helpers', () => {
  const original = jest.requireActual('../../../../../../helpers/Helpers');
  return { ...original, getNetworkName: () => 'Ethereum' };
});
jest.mock('../../../../../../components/nextGen/nextgen_contracts', () => ({
  NEXTGEN_CHAIN_ID: 1,
  NEXTGEN_MINTER: { 1: '0x0', abi: [] },
}));

const useChainId = require('wagmi').useChainId as jest.Mock;
const useSeizeConnectContext = require('../../../../../../components/auth/SeizeConnectContext').useSeizeConnectContext as jest.Mock;

const baseProps = {
  collection: {
    id: 1,
    allowlist_start: 0,
    allowlist_end: 0,
    public_start: 0,
    public_end: 0,
    merkle_root: '',
    max_purchases: 1,
  } as any,
  available_supply: 1,
  mint_price: 1,
  mint_counts: { allowlist: 0, public: 0, airdrop: 0, total: 0 },
  delegators: [],
  mintForAddress: jest.fn(),
  fetchingMintCounts: false,
  refreshMintCounts: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows connect wallet when not connected', () => {
  useChainId.mockReturnValue(1);
  useSeizeConnectContext.mockReturnValue({ isConnected: false, address: undefined, seizeConnect: jest.fn() });
  render(<NextGenMintWidget {...baseProps} />);
  expect(screen.getByRole('button')).toHaveTextContent('Connect Wallet');
});

test('shows switch network when wrong chain', () => {
  useChainId.mockReturnValue(5);
  useSeizeConnectContext.mockReturnValue({ isConnected: true, address: '0x1', seizeConnect: jest.fn() });
  render(<NextGenMintWidget {...baseProps} />);
  expect(screen.getByRole('button')).toHaveTextContent('Switch to Ethereum');
});

test('shows processing state when minting', () => {
  useChainId.mockReturnValue(1);
  useSeizeConnectContext.mockReturnValue({ isConnected: true, address: '0x1', seizeConnect: jest.fn() });
  minting = true;
  render(<NextGenMintWidget {...baseProps} />);
  minting = false;
  expect(screen.getByRole('button')).toHaveTextContent('Processing...');
});
