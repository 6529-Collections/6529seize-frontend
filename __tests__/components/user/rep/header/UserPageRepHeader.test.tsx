import { render, screen } from '@testing-library/react';
import UserPageRepHeader from '@/components/user/rep/header/UserPageRepHeader';

const mockProfile = {
  handle: 'testuser',
  display: 'Test User',
  query: 'testuser',
} as any;

describe('UserPageRepHeader', () => {
  it('shows rep totals when provided', () => {
    const repRates = {
      total_rep_rating: 1500,
      number_of_raters: 25,
      rating_stats: [],
    } as any;
    render(<UserPageRepHeader repRates={repRates} profile={mockProfile} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('renders without repRates', () => {
    const { container } = render(<UserPageRepHeader repRates={null} profile={mockProfile} />);
    expect(container).toHaveTextContent('Reputation');
  });
});
