import { render, screen } from '@testing-library/react';
import AboutContactUs from '@/components/about/AboutContactUs';

describe('AboutContactUs', () => {
  it('shows contact header', () => {
    render(<AboutContactUs />);
    expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument();
  });

  it('contains twitter link', () => {
    render(<AboutContactUs />);
    const link = screen.getByRole('link', { name: 'https://x.com/6529collections' });
    expect(link).toHaveAttribute('href', 'https://x.com/6529collections');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('provides support email', () => {
    render(<AboutContactUs />);
    const email = screen.getByRole('link', { name: /support@6529.io/i });
    expect(email).toHaveAttribute('href', 'mailto:support@6529.io');
  });

  it('mentions OM Discord link', () => {
    render(<AboutContactUs />);
    const discord = screen.getByRole('link', { name: 'https://discord.gg/join-om' });
    expect(discord).toHaveAttribute('href', 'https://discord.gg/join-om');
  });

  it('displays postal address', () => {
    render(<AboutContactUs />);
    expect(screen.getByText(/6529 Collection LLC/)).toBeInTheDocument();
    expect(screen.getByText(/Wilmington, DE/)).toBeInTheDocument();
  });
});
