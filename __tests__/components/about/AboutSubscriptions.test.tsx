import { render, screen } from '@testing-library/react';
import AboutSubscriptions from '@/components/about/AboutSubscriptions';

describe('AboutSubscriptions', () => {
  it('renders heading', () => {
    render(<AboutSubscriptions />);
    expect(screen.getByRole('heading', { name: /Subscription/ })).toBeInTheDocument();
  });

  it('links to the subscriptions report', () => {
    render(<AboutSubscriptions />);

    expect(screen.getByRole('link', { name: 'Subscriptions Report' })).toHaveAttribute(
      'href',
      '/tools/subscriptions-report'
    );
  });
});
