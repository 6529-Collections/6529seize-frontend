import { render, screen } from '@testing-library/react';
import React from 'react';
import Inspirals from '../../pages/museum/genesis/inspirals';
import Unigrids from '../../pages/museum/genesis/unigrids';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('museum genesis pages render', () => {
  it('renders Inspirals page', () => {
    render(<Inspirals />);
    expect(screen.getAllByText(/INSPIRALS/i).length).toBeGreaterThan(0);
  });

  it('renders Unigrids page', () => {
    render(<Unigrids />);
    expect(screen.getAllByText(/UNIGRIDS/i).length).toBeGreaterThan(0);
  });
});