import { render, screen } from '@testing-library/react';
import React from 'react';
import HomeSlider from '../../pages/slide-page/homepage-slider';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('homepage slider redirect', () => {
  it('shows redirect message', () => {
    render(<HomeSlider />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });
});
