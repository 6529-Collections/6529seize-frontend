import { render, screen } from '@testing-library/react';
import React from 'react';
import Century from '../../pages/museum/genesis/century';
import Meridian from '../../pages/museum/genesis/meridian';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('museum genesis pages', () => {
  it('renders Century page', () => {
    render(<Century />);
    expect(screen.getAllByText(/CENTURY/i).length).toBeGreaterThan(0);
  });

  it('renders Meridian page', () => {
    render(<Meridian />);
    expect(screen.getAllByText(/MERIDIAN/i).length).toBeGreaterThan(0);
  });
});
