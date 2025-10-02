import { render, screen } from '@testing-library/react';
import AboutSubscriptions from '@/components/about/AboutSubscriptions';

describe('AboutSubscriptions', () => {
  it('renders heading', () => {
    render(<AboutSubscriptions />);
    expect(screen.getByRole('heading', { name: /Subscription/ })).toBeInTheDocument();
  });
});
