import { render, screen } from '@testing-library/react';
import React from 'react';
import MemeWinnerHeader from '@/components/memes/drops/MemeWinnerHeader';

describe('MemeWinnerHeader', () => {
  it('renders provided title', () => {
    render(<MemeWinnerHeader title="Winner" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Winner');
  });
});
