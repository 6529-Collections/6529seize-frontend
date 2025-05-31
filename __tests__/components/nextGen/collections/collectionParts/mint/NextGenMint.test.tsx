import React from 'react';
import { render, screen } from '@testing-library/react';
import NextGenMint, { Spinner } from '../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMint';

jest.mock('react-bootstrap', () => ({
  Container: (p: any) => <div data-testid="container" {...p} />,
  Row: (p: any) => <div {...p} />,
  Col: (p: any) => <div {...p} />,
}));

jest.mock('../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMintWidget', () => () => <div data-testid="widget" />);
jest.mock('../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMintBurnWidget', () => () => <div data-testid="burn-widget" />);
jest.mock('../../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({ NextGenCountdown: () => <div data-testid="count" />, NextGenMintCounts: () => <div />, NextGenPhases: () => <div /> }));
jest.mock('../../../../../../components/nextGen/nextgen_helpers', () => ({
  useSharedState: () => ({ mintingDetails: null, setMintingDetails: jest.fn() }),
  useCollectionCostsHook: jest.fn(),
  useMintSharedState: () => ({
    available: 0,
    setAvailable: jest.fn(),
    delegators: [],
    setDelegators: jest.fn(),
    mintForAddress: '',
    setMintForAddress: jest.fn(),
    addressMintCounts: { airdrop:0, allowlist:0, public:0, total:0 },
    setAddressMintCounts: jest.fn(),
    fetchingMintCounts: false,
    setFetchingMintCounts: jest.fn(),
  }),
  getStatusFromDates: () => 'PAUSED',
  formatNameForUrl: (n: string) => n,
}));

jest.mock('../../../../../../services/6529api', () => ({ fetchUrl: jest.fn() }));
jest.mock('../../../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x0', isConnected: true }) }));
jest.mock('wagmi', () => ({
  useReadContract: () => ({ data: null, refetch: jest.fn(), isFetching: false }),
  useReadContracts: () => ({ data: [] })
}));
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('../../../../../../components/dotLoader/DotLoader', () => () => <div data-testid="loader" />);

describe('NextGenMint', () => {
  it('renders loader when allowlist not loaded', () => {
    render(<NextGenMint collection={{ id:1, name:'C', artist:'A', artist_address:'0x', image:'', public_start: '', public_end: '', merkle_root: '' } as any} mint_price={1} burn_amount={1} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('Spinner renders output element', () => {
    const {container}=render(<Spinner />);
    expect(container.querySelector("output")).toBeInTheDocument();
  });
});
