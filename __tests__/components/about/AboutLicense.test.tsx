import { render, screen } from '@testing-library/react';
import AboutLicense from '@/components/about/AboutLicense';

describe('AboutLicense', () => {
  it('renders heading and date', () => {
    render(<AboutLicense />);
    expect(screen.getByRole('heading', { name: /License/i })).toBeInTheDocument();
    expect(screen.getByText(/Last Updated: February 23, 2023/)).toBeInTheDocument();
  });

  it('links to CC0 license', () => {
    render(<AboutLicense />);
    const link = screen.getByRole('link', { name: /^https:\/\/creativecommons\.org\/share-your-work\/public-domain\/cc0\/$/ });
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/share-your-work/public-domain/cc0/');
  });

  it('links to artist twitter', () => {
    render(<AboutLicense />);
    const link = screen.getByRole('link', { name: '6529er' });
    expect(link).toHaveAttribute('href', 'https://x.com/6529er');
  });
});
