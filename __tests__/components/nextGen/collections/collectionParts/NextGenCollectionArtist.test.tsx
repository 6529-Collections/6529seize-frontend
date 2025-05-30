import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenCollectionArtist from '../../../../../components/nextGen/collections/collectionParts/NextGenCollectionArtist';
import { formatNameForUrl } from '../../../../../components/nextGen/nextgen_helpers';
import { STATEMENT_TYPE } from '../../../../../helpers/Types';

jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img {...p} /> }));
jest.mock('../../../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));
jest.mock('../../../../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

const { useIdentity } = require('../../../../../hooks/useIdentity');
const { commonApiFetch } = require('../../../../../services/api/common-api');

const collection = {
  id: 1,
  name: 'Cool Collection',
  artist: 'Artist',
  artist_address: '0x1',
} as any;

const linked = [
  { id: 2, name: 'Another' },
  { id: 3, name: 'More' },
] as any[];

beforeEach(() => {
  (useIdentity as jest.Mock).mockReturnValue({ profile: { pfp: 'pfp.jpg', handle: 'alice' } });
  (commonApiFetch as jest.Mock).mockResolvedValue([
    { statement_type: STATEMENT_TYPE.BIO, statement_value: 'bio text' },
  ]);
});

describe('NextGenCollectionArtist', () => {
  it('renders profile info and bio', async () => {
    render(<NextGenCollectionArtist collection={collection} link_collections={linked} />);

    expect(screen.getByRole('img')).toHaveAttribute('src', 'pfp.jpg');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Artist');
    expect(screen.getByRole('link', { name: '@alice' })).toHaveAttribute('href', '/alice');

    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('bio text')).toBeInTheDocument());

    const links = screen.getAllByRole('link');
    expect(links[1]).toHaveAttribute('href', `/nextgen/collection/${formatNameForUrl('Another')}`);
    expect(links[2]).toHaveAttribute('href', `/nextgen/collection/${formatNameForUrl('More')}`);
  });
});
