import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageCollectedCardsNoCards from '@/components/user/collected/cards/UserPageCollectedCardsNoCards';
import { CollectedCollectionType, CollectionSeized } from '@/entities/IProfile';
import { MEMES_SEASON } from '@/enums';

describe('UserPageCollectedCardsNoCards messages', () => {
  function renderComponent(filters: any) {
    return render(<UserPageCollectedCardsNoCards filters={filters} />);
  }

  it('shows generic message when seized filter active', () => {
    renderComponent({ seized: CollectionSeized.SEIZED, collection: null, szn: null });
    expect(screen.getByText('No cards to display')).toBeInTheDocument();
  });

  it('shows full setter when no collection selected', () => {
    renderComponent({ seized: CollectionSeized.NOT_SEIZED, collection: null, szn: null });
    expect(screen.getByText('Congratulations, full setter!')).toBeInTheDocument();
  });

  it('shows season specific message for memes season', () => {
    renderComponent({ seized: CollectionSeized.NOT_SEIZED, collection: CollectedCollectionType.MEMES, szn: MEMES_SEASON.SZN4 });
    expect(screen.getByText('Congratulations, SZN4 full setter!')).toBeInTheDocument();
  });

  it('shows gradient message', () => {
    renderComponent({ seized: CollectionSeized.NOT_SEIZED, collection: CollectedCollectionType.GRADIENTS, szn: null });
    expect(screen.getByText('Congratulations, Gradient full setter!')).toBeInTheDocument();
  });
});
