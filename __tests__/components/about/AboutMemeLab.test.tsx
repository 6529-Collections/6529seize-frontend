import { render, screen } from '@testing-library/react';
import AboutMemeLab from '../../../components/about/AboutMemeLab';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('AboutMemeLab', () => {
  it('renders memelab image', () => {
    render(<AboutMemeLab />);
    const img = screen.getByRole('img', { name: /memelab/i });
    expect(img).toHaveAttribute('src', '/memelab.png');
  });

  it('mentions experimental contract', () => {
    render(<AboutMemeLab />);
    expect(screen.getByText(/experimental CC0 contract/i)).toBeInTheDocument();
  });
});
