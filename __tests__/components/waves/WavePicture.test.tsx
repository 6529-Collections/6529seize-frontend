import React from 'react';
import { render, screen } from '@testing-library/react';
import WavePicture from '../../../components/waves/WavePicture';

describe('WavePicture', () => {
  it('renders picture image when provided', () => {
    render(<WavePicture name="wave" picture="pic.jpg" contributors={[]} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'pic.jpg');
    expect(img).toHaveAttribute('alt', 'wave');
  });

  it('renders gradient when no picture and no contributors', () => {
    const { container } = render(<WavePicture name="wave" picture={null} contributors={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders contributor images sliced', () => {
    const contributors = [
      { pfp: 'a.png' },
      { pfp: 'b.png' },
      { pfp: 'c.png' },
    ];
    render(<WavePicture name="wave" picture={null} contributors={contributors} />);
    expect(screen.getAllByRole('img').length).toBe(3);
  });
});
