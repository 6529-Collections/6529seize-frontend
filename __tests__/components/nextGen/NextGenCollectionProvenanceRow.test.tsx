import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextGenCollectionProvenanceRow } from '../../../components/nextGen/collections/collectionParts/NextGenCollectionProvenance';
import { NextGenCollection, NextGenLog } from '../../../entities/INextgen';

jest.mock('next/image', () => ({__esModule:true, default: (props:any) => <img {...props} />}));

const collection: NextGenCollection = {
  id: 2,
  created_at: '',
  updated_at: '',
  name: 'Test Collection',
  artist: '',
  description: '',
  website: '',
  licence: '',
  base_uri: '',
  library: '',
  dependency_script: '',
  image: '',
  banner: '',
  distribution_plan: '',
  artist_address: '',
  artist_signature: '',
  max_purchases: 0,
  total_supply: 0,
  final_supply_after_mint: 0,
  mint_count: 0,
  on_chain: false,
  allowlist_start: 0,
  allowlist_end: 0,
  public_start: 0,
  public_end: 0,
  tokens: [],
};

const baseLog: NextGenLog = {
  created_at: '',
  id: 1,
  transaction: '0xabc',
  block: 0,
  block_timestamp: 1000,
  heading: '',
  log: 'Minted Test Collection #5 to 0x1',
  collection_id: 2,
  source: '',
  from_address: '0x0',
  to_address: '0x1',
  from_display: '',
  to_display: 'Alice',
  value: 0,
  royalties: 0,
  gas_gwei: 0,
  gas_price: 0,
  gas: 0,
  gas_price_gwei: 0,
};

function renderRow(disable = false) {
  return render(
    <NextGenCollectionProvenanceRow collection={collection} log={baseLog} disable_link={disable} />
  );
}

describe('NextGenCollectionProvenanceRow', () => {
  it('renders token link when not disabled', () => {
    renderRow();
    const tokenId = collection.id * 10000000000 + 5;
    expect(screen.getByRole('link', { name: /Test Collection #5/ })).toHaveAttribute('href', `/nextgen/token/${tokenId}`);
  });

  it('hides link when disable_link', () => {
    renderRow(true);
    expect(screen.queryByRole('link', { name: /Test Collection #5/ })).toBeNull();
    expect(screen.getByText(/Minted/)).toBeInTheDocument();
  });
});
