import React from 'react';
import { render, screen } from '@testing-library/react';
import DropListItemContentNftDetails from '../../../../../../../components/drops/view/item/content/nft-tag/DropListItemContentNftDetails';
import { getScaledImageUri } from '../../../../../../../helpers/image.helpers';

jest.mock('../../../../../../../helpers/image.helpers', () => ({
  getScaledImageUri: jest.fn(() => 'scaled'),
  ImageScale: { W_AUTO_H_50: 'W_AUTO_H_50' },
}));

describe('DropListItemContentNftDetails', () => {
  const referencedNft = { contract: 'c', token: '1', name: 'Token' } as any;
  const nft = { token: { collection: { image: 'url' } } } as any;

  it('renders image and name', () => {
    render(<DropListItemContentNftDetails referencedNft={referencedNft} nft={nft} />);
    expect(getScaledImageUri).toHaveBeenCalledWith('url', 'W_AUTO_H_50');
    expect(screen.getByAltText('Seize')).toHaveAttribute('src', 'scaled');
    expect(screen.getByText('Token')).toBeInTheDocument();
  });

  it('handles missing image', () => {
    render(<DropListItemContentNftDetails referencedNft={referencedNft} nft={null} />);
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.queryByAltText('Seize')).toBeNull();
  });
});
