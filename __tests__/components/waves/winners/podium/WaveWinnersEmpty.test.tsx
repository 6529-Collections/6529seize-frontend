import { render, screen } from '@testing-library/react';
import { WaveWinnersEmpty } from '@/components/waves/winners/podium/WaveWinnersEmpty';

describe('WaveWinnersEmpty', () => {
  it('shows empty text', () => {
    render(<WaveWinnersEmpty />);
    expect(screen.getByText('No Winners to Display')).toBeInTheDocument();
    expect(screen.getByText('This wave ended without any submissions')).toBeInTheDocument();
  });
});
