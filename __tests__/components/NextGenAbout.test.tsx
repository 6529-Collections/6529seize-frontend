import { render, screen } from '@testing-library/react';
import NextGenAbout from '@/components/nextGen/collections/NextGenAbout';

describe('NextGenAbout', () => {
  it('renders heading and paragraph content', () => {
    render(<NextGenAbout />);
    expect(screen.getByRole('heading', { name: /about nextgen/i })).toBeInTheDocument();
    expect(screen.getByText(/generative art NFT contract/i)).toBeInTheDocument();
  });
});
