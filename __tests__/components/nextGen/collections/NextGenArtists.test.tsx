// @ts-nocheck
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenArtists from '../../../../components/nextGen/collections/NextGenArtists';
import { fetchUrl } from '../../../../services/6529api';

jest.mock('../../../../services/6529api', () => ({ fetchUrl: jest.fn() }));

const MockArtist = jest.fn((props: any) => <div data-testid="artist" />);
jest.mock('../../../../components/nextGen/collections/collectionParts/NextGenCollectionArtist', () => ({
  __esModule: true,
  // @ts-ignore
  default: (props: any) => MockArtist(props),
}));

describe('NextGenArtists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches collections and groups by artist', async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, artist_address: '0xa', artist: 'A' },
        { id: 2, artist_address: '0xa', artist: 'A' },
        { id: 3, artist_address: '0xb', artist: 'B' },
      ],
    });

    render(<NextGenArtists />);

    await waitFor(() => expect(MockArtist).toHaveBeenCalledTimes(2));

    expect(MockArtist).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: expect.objectContaining({ id: 1 }),
        link_collections: [
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
        ],
      })
    );
    expect(MockArtist).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: expect.objectContaining({ id: 3 }),
        link_collections: [expect.objectContaining({ id: 3 })],
      })
    );
  });
});
