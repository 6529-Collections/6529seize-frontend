import { render, screen } from '@testing-library/react';
import AboutDataDecentral from '../../../components/about/AboutDataDecentral';

describe('AboutDataDecentral', () => {
  it('renders data decentralization heading', () => {
    render(<AboutDataDecentral />);
    expect(screen.getByRole('heading', { name: /Data Decentralization/i })).toBeInTheDocument();
  });

  it('contains arweave link for team addresses', () => {
    render(<AboutDataDecentral />);
    const link = screen.getAllByRole('link', { name: 'here' })[0];
    expect(link).toHaveAttribute('href', expect.stringContaining('arweave.net'));
  });

  it('links to open data page', () => {
    render(<AboutDataDecentral />);
    const link = screen.getAllByRole('link', { name: 'here' })[1];
    expect(link).toHaveAttribute('href', '/open-data');
  });

  it('mentions OpenSea API', () => {
    render(<AboutDataDecentral />);
    expect(screen.getByText(/OpenSea API/)).toBeInTheDocument();
  });
});
