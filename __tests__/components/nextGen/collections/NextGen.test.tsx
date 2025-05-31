import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGen, { DistributionLink } from '../../../../components/nextGen/collections/NextGen';
import { NextGenView } from '../../../../components/nextGen/collections/NextGenNavigationHeader';

jest.mock('../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({
  __esModule: true,
  NextGenCountdown: () => <div data-testid="countdown" />,
  NextGenMintCounts: () => <div data-testid="counts" />,
  NextGenPhases: () => <div data-testid="phases" />,
}));
jest.mock('../../../../components/nextGen/collections/collectionParts/NextGenCollectionArtist', () => ({ __esModule: true, default: () => <div data-testid="artist" /> }));
jest.mock('../../../../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow', () => ({ __esModule: true, default: () => <div data-testid="slideshow" /> }));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  __esModule: true,
  formatNameForUrl: (n: string) => n.toLowerCase(),
  getStatusFromDates: jest.fn(),
}));

const collection: any = {
  banner: 'banner',
  name: 'Cool Art',
  artist: 'Alice',
  artist_address: '0x1',
  total_supply: 10,
  mint_count: 2,
  allowlist_start: 0,
  allowlist_end: 0,
  public_start: 0,
  public_end: 0
};

describe('NextGen component', () => {
  it('calls setView when Learn More clicked', async () => {
    const setView = jest.fn();
    render(<NextGen collection={collection} setView={setView} />);
    await userEvent.click(screen.getByText('Learn More'));
    expect(setView).toHaveBeenCalledWith(NextGenView.ABOUT);
  });
});

describe('DistributionLink', () => {
  const { getStatusFromDates } = require('../../../../components/nextGen/nextgen_helpers');
  it('renders link when status upcoming', () => {
    getStatusFromDates.mockReturnValueOnce('UPCOMING').mockReturnValueOnce('COMPLETE');
    render(<DistributionLink collection={collection} />);
    expect(screen.getByText('Distribution Plan')).toBeInTheDocument();
  });

  it('renders nothing when complete', () => {
    getStatusFromDates.mockReturnValue('COMPLETE');
    const { container } = render(<DistributionLink collection={collection} />);
    expect(container.firstChild).toBeNull();
  });
});
