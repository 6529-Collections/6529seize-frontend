import { render, screen } from '@testing-library/react';
import AboutGradients from '../../../components/about/AboutGradients';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('AboutGradients', () => {
  it('renders heading and image', () => {
    render(<AboutGradients />);
    expect(screen.getByRole('heading', { name: /6529 Gradient Collection/i })).toBeInTheDocument();
    const img = screen.getByRole('img', { name: /6529 Gradient/i });
    expect(img).toHaveAttribute('src', '/gradients-preview.png');
  });

  it('links to artist twitter', () => {
    render(<AboutGradients />);
    const link = screen.getByRole('link', { name: '6529er' });
    expect(link).toHaveAttribute('href', 'https://x.com/6529er');
  });
});
