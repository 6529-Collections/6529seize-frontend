import { render, screen } from '@testing-library/react';
import AboutNFTDelegation from '../../../components/about/AboutNFTDelegation';

describe('AboutNFTDelegation', () => {
  it('renders heading and link', () => {
    render(<AboutNFTDelegation />);
    expect(screen.getByRole('heading', { name: /NFT.*Delegation/i })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /delegation center/i });
    expect(link).toHaveAttribute('href', '/delegation/delegation-center');
  });
});
