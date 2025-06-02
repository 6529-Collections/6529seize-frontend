import { render, screen } from '@testing-library/react';
import React from 'react';
import MemeWinnerDescription from '../../../../components/memes/drops/MemeWinnerDescription';

describe('MemeWinnerDescription', () => {
  it('renders description text', () => {
    render(<MemeWinnerDescription description="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
