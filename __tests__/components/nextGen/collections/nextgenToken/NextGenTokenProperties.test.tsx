import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const { displayScore, NextgenRarityToggle, NextgenTokenTraits } = require('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenProperties');

describe('displayScore', () => {
  it('formats numbers based on size', () => {
    expect(displayScore(0.02)).toBe('0.020');
    expect(displayScore(0.0005)).toBe('5.000e-4');
    expect(displayScore(0.005)).toBe('0.00500');
  });
});

describe('NextgenRarityToggle', () => {
  it('calls setShow when toggled', () => {
    const setShow = jest.fn();
    render(<NextgenRarityToggle title="Trait Count" show={true} setShow={setShow} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(setShow).toHaveBeenCalledWith(false);
    expect(screen.getByText('Trait Count')).toBeInTheDocument();
  });
});

describe('NextgenTokenTraits', () => {
  it('lists traits with correct link and counts', () => {
    const props: any = {
      collection: { name: 'Collection Name' },
      token: {} ,
      traits: [{ trait: 'Color', value: 'Red', value_count: 2, token_count: 10 }],
      tokenCount: 10,
    };
    render(<NextgenTokenTraits {...props} />);
    expect(screen.getByText('Color:')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Red' });
    expect(link).toHaveAttribute('href', '/nextgen/collection/collection-name/art?traits=Color:Red');
    expect(screen.getByText('2/10')).toBeInTheDocument();
  });
});
