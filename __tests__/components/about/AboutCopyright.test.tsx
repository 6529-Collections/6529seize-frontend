import { render, screen } from '@testing-library/react';
import AboutCopyright from '../../../components/about/AboutCopyright';

describe('AboutCopyright', () => {
  it('renders headings', () => {
    render(<AboutCopyright />);
    expect(screen.getByRole('heading', { name: /copyright/i })).toBeInTheDocument();
    expect(screen.getByText(/Repeat Infringer Policy/i)).toBeInTheDocument();
  });

  it('shows DMCA contact email', () => {
    render(<AboutCopyright />);
    const email = screen.getAllByRole('link', { name: /6529Ops@6529.io/i })[0];
    expect(email).toHaveAttribute('href', 'mailto:6529Ops@6529.io');
  });

  it('mentions DMCA compliance address', () => {
    render(<AboutCopyright />);
    expect(
      screen.getAllByText(/6529 Collection LLC/)[0]
    ).toBeInTheDocument();
  });
});
