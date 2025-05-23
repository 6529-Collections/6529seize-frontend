import { render, screen } from '@testing-library/react';
import AboutHTML from '../../../components/about/AboutHTML';

describe('AboutHTML', () => {
  const html = '<div data-testid="content">HTML Content</div>';

  it('splits title when containing spaces', () => {
    render(<AboutHTML title="Test Title" html={html} />);
    const light = screen.getByText('Test');
    expect(light).toHaveClass('font-lightest');
    expect(screen.getByRole('heading', { name: /Test Title/ })).toBeInTheDocument();
  });

  it('renders title without split', () => {
    render(<AboutHTML title="Single" html={html} />);
    expect(screen.getByRole('heading', { name: 'Single' })).toBeInTheDocument();
  });

  it('renders provided html', () => {
    render(<AboutHTML title="Title" html={html} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
