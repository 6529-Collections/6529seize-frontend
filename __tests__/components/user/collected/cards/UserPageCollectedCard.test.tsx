import { render, screen } from '@testing-library/react';
import UserPageCollectedCard from '@/components/user/collected/cards/UserPageCollectedCard';
import { CollectedCollectionType } from '@/entities/IProfile';

const memeCard = {
  collection: CollectedCollectionType.MEMES,
  token_id: 1,
  token_name: 'Card',
  img: '/img.png',
  tdh: 2,
  rank: 3,
  seized_count: 1,
};

describe('UserPageCollectedCard', () => {
  it('shows data row and seized count for memes', () => {
    render(<UserPageCollectedCard card={memeCard as any} showDataRow={true} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('TDH')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('handles memelab collection', () => {
    const card = { ...memeCard, collection: CollectedCollectionType.MEMELAB, seized_count: 0 };
    render(<UserPageCollectedCard card={card as any} showDataRow={true} />);
    expect(screen.getAllByText('N/A').length).toBe(2);
  });
});
