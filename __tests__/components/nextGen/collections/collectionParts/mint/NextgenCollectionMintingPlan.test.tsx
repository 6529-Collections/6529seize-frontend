import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NextgenCollectionMintingPlan from '@/components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Dropdown: any = (p: any) => <div {...p} />;
  Dropdown.Toggle = (p: any) => <button {...p} />;
  Dropdown.Menu = (p: any) => <div {...p} />;
  Dropdown.Item = (p: any) => <button {...p} />;
  const Table: any = (p: any) => <table>{p.children}</table>;
  return {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
    Dropdown,
    Table,
    Form: { Control: (p: any) => <input {...p} /> },
  };
});

jest.mock('next/dynamic', () => () => () => <div data-testid='pdf' />);

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock('@/components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => () => <div data-testid='header' />);
jest.mock('@/components/pagination/Pagination', () => (props: any) => (
  <div data-testid='pagination'>
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));
jest.mock('@/components/searchModal/SearchModal', () => ({
  SearchModalDisplay: () => <div data-testid='search-modal' />,
  SearchWalletsDisplay: () => <div data-testid='search-wallets' />,
}));

const { commonApiFetch } = require('@/services/api/common-api');

const collection = { id: 1, name: 'COL', public_start: 0, public_end: 0, distribution_plan: 'plan.pdf' } as any;
const phases = [{ phase: 'Phase1', start_time: 0, end_time: 0 }];
const allowlist = [
  { address: '0x1', keccak: 'k1', spots: 1, info: '{}', phase: 'Phase1', wallet_display: '' },
  { address: '0x1', keccak: 'k2', spots: 3, info: '{}', phase: 'Phase1', wallet_display: '' },
];

beforeEach(() => {
  jest.clearAllMocks();
  (commonApiFetch as jest.Mock).mockImplementation(({ endpoint }: any) => {
    if (endpoint.startsWith('nextgen/allowlist_phases')) return Promise.resolve(phases);
    return Promise.resolve({ count: allowlist.length, page: 1, next: null, data: allowlist });
  });
});

describe('NextgenCollectionMintingPlan', () => {
  it('computes adjusted spots per address', async () => {
    render(<NextgenCollectionMintingPlan collection={collection} />);
    await screen.findAllByText('0x1');
    const rows = screen.getAllByRole('row');
    expect(rows.some(r => r.textContent?.includes("Phase1"))).toBe(true);
    await waitFor(() => {
      const cells = screen.getAllByText(/^[0-9]+$/);
      expect(cells.map(c => c.textContent)).toEqual(expect.arrayContaining(['1', '2']));
    });
  });
});
