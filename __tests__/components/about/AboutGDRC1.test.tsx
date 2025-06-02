import { render, screen } from '@testing-library/react';
import AboutGDRC1 from '../../../components/about/AboutGDRC1';

describe('AboutGDRC1', () => {
  const html = '<div data-testid="content">Charter Content</div>';

  it('shows charter heading and link', () => {
    render(<AboutGDRC1 html={html} />);
    expect(screen.getByRole('heading', { name: /Global Digital Rights Charter/i })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /The Global Digital Rights Charter 1/i });
    expect(link).toHaveAttribute('href', 'https://digitalrightscharter.org/');
  });

  it('renders provided html', () => {
    render(<AboutGDRC1 html={html} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
