import { render, screen } from '@testing-library/react';
import UserPageRepHeader from '@/components/user/rep/header/UserPageRepHeader';

const mockProfile = {
  handle: 'testuser',
  display: 'Test User',
  query: 'testuser',
} as any;

describe('UserPageRepHeader', () => {
  it('shows rep totals when provided', () => {
    const overview = {
      total_rep: 1500,
      contributor_count: 25,
      authenticated_user_contribution: null,
      contributors: { data: [], page: 1, next: false },
    } as any;
    render(<UserPageRepHeader overview={overview} categories={[]} profile={mockProfile} repDirection="received" onRepDirectionChange={() => {}} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('renders without overview', () => {
    const { container } = render(<UserPageRepHeader overview={null} categories={[]} profile={mockProfile} repDirection="received" onRepDirectionChange={() => {}} />);
    expect(container).toHaveTextContent('Rep');
  });
});
