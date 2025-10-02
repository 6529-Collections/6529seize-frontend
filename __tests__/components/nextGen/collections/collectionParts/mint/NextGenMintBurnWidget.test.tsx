import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NextGenMintBurnWidget from '@/components/nextGen/collections/collectionParts/mint/NextGenMintBurnWidget';
import { Status } from '@/components/nextGen/nextgen_entities';
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from '@/components/nextGen/nextgen_contracts';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Form = (p: any) => <form {...p}>{p.children}</form>;
  Form.Group = (p: any) => <div data-testid="form-group" {...p} />;
  Form.Label = (p: any) => <label {...p} />;
  Form.Select = (p: any) => <select {...p} />;
  return {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
    Form,
    Button: (p: any) => <button {...p}>{p.children}</button>,
    Table: (p: any) => <table {...p}>{p.children}</table>,
  };
});

jest.mock('@/components/nextGen/collections/collectionParts/mint/NextGenMintShared', () => ({
  NextGenMintingFor: () => <div data-testid="minting-for" />,
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

const mockFetchUrl = jest.fn();
jest.mock('@/services/6529api', () => ({ fetchUrl: (...args: any[]) => mockFetchUrl(...args) }));

const mockGetNfts = jest.fn();
jest.mock('@/services/alchemy-api', () => ({ getNftsForContractAndOwner: (...args: any[]) => mockGetNfts(...args) }));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useChainId: jest.fn(),
  useWriteContract: jest.fn(),
}));

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useMintSharedState: jest.fn(),
  getStatusFromDates: jest.fn(),
}));

const { useChainId, useWriteContract } = require('wagmi');
const { useSeizeConnectContext } = require('@/components/auth/SeizeConnectContext');
const { useMintSharedState, getStatusFromDates } = require('@/components/nextGen/nextgen_helpers');

function createMintState(overrides: Partial<any> = {}) {
  return {
    burnProofResponse: undefined,
    setBurnProofResponse: jest.fn(),
    mintForAddress: '0xabc',
    setMintForAddress: jest.fn(),
    tokenId: '',
    setTokenId: jest.fn(),
    salt: 0,
    isMinting: false,
    setIsMinting: jest.fn(),
    fetchingProofs: false,
    setFetchingProofs: jest.fn(),
    errors: [],
    setErrors: jest.fn(),
    ...overrides,
  };
}

const baseProps = {
  collection: {
    allowlist_start: 0,
    allowlist_end: 0,
    public_start: 0,
    public_end: 0,
    max_purchases: 10,
  } as any,
  collection_merkle: {
    collection_id: 1,
    merkle_root: 'root',
    burn_collection: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
    burn_collection_id: 1,
    min_token_index: 0,
    max_token_index: 0,
    status: true,
  } as any,
  available_supply: 5,
  mint_price: 0,
  mint_counts: { airdrop: 0, allowlist: 0, public: 0, total: 0 },
  delegators: [],
  mintForAddress: jest.fn(),
  fetchingMintCounts: false,
  refreshMintCounts: jest.fn(),
};

function renderWidget(props: Partial<typeof baseProps> = {}, state: any = {}, context: any = {}, chainId?: number) {
  const mintState = createMintState(state);
  (useMintSharedState as jest.Mock).mockReturnValue(mintState);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ isConnected: true, address: '0xabc', seizeConnect: jest.fn(), ...context });
  (useChainId as jest.Mock).mockReturnValue(chainId ?? NEXTGEN_CHAIN_ID);
  (useWriteContract as jest.Mock).mockReturnValue({ writeContract: jest.fn(), reset: jest.fn(), isPending: false, isSuccess: false, isError: false });
  (getStatusFromDates as jest.Mock).mockReturnValue(Status.LIVE);
  return render(<NextGenMintBurnWidget {...baseProps} {...props} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});


describe('NextGenMintBurnWidget', () => {
  it('filters tokens by range and prefix', async () => {
    mockGetNfts.mockResolvedValue([
      { tokenId: 90 },
      { tokenId: 110, name: 'A' },
      { tokenId: 115 },
      { tokenId: 201 },
    ]);

    renderWidget(
      {
        collection_merkle: {
          ...baseProps.collection_merkle,
          min_token_index: 100,
          max_token_index: 200,
          burn_collection_id: 1,
        },
      },
      { mintForAddress: '0xabc' }
    );

    await waitFor(() => {
      expect(mockGetNfts).toHaveBeenCalled();
      expect(screen.getAllByRole('option').length).toBeGreaterThan(1);
    });
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveValue('110');
    expect(options[2]).toHaveValue('115');
  });

  it('shows connect wallet when not connected', () => {
    renderWidget({}, {}, { isConnected: false });
    expect(screen.getByRole('button')).toHaveTextContent('Connect Wallet');
  });

  it('prompts network switch when chain differs', () => {
    renderWidget({}, {}, {}, NEXTGEN_CHAIN_ID + 1);
    expect(screen.getByRole('button')).toHaveTextContent('Switch to');
  });

  it('shows processing state when minting', () => {
    const { container } = renderWidget({}, { isMinting: true });
    expect(screen.getByRole('button')).toHaveTextContent('Processing...');
    expect(container.querySelector('output')).toBeInTheDocument();
  });

  it('disables button when burn not active', () => {
    renderWidget({ collection_merkle: { ...baseProps.collection_merkle, status: false } });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Burn Not Active');
  });
});

