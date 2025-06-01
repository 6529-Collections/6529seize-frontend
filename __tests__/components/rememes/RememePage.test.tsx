import React from 'react';
import { render, screen } from '@testing-library/react';
import { printMemeReferences } from '../../../components/rememes/RememePage';

jest.mock('../../../components/nft-image/NFTImage', () => () => <div data-testid="nft-image" />);
jest.mock('../../../components/the-memes/ArtistProfileHandle', () => () => <span>Artist</span>);

const meme = {
  id: 1,
  name: 'Meme',
  artist: 'Bob',
  contract: '0x1',
} as any;

describe('RememePage helpers', () => {
  it('prints references list', () => {
    const { container } = render(printMemeReferences([meme], 'path', true));
    expect(screen.getByTestId('nft-image')).toBeInTheDocument();
    expect(container.querySelectorAll('a').length).toBe(1);
  });

  it('shows loading text when memes not loaded', () => {
    render(printMemeReferences([], 'path', false));
    expect(screen.getByText('Fetching references')).toBeInTheDocument();
  });

  it('shows placeholder when no memes found', () => {
    const { container } = render(printMemeReferences([], 'path', true));
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    // Ensure no links rendered
    expect(container.querySelectorAll('a').length).toBe(0);
  });
});
