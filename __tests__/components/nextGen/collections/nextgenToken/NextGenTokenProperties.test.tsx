import React from 'react';
import { render, screen } from '@testing-library/react';
import { NextgenTokenTraits, NextgenRarityToggle, displayScore } from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenProperties';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return { Container: (p: any) => <div {...p} />, Row: (p: any) => <div>{p.children}</div>, Col: (p: any) => <div>{p.children}</div> };
});

jest.mock('react-toggle', () => (p: any) => <input type="checkbox" {...p} />);

describe('displayScore', () => {
  it('formats numbers based on size', () => {
    expect(displayScore(1.2345)).toBe('1.235');
    expect(displayScore(0.005)).toBe('0.00500');
    expect(displayScore(0.0005)).toBe('5.000e-4');
  });
});

describe('NextgenRarityToggle', () => {
  it('toggles value when clicked', () => {
    const setShow = jest.fn();
    render(<NextgenRarityToggle title="Trait Count" show={false} setShow={setShow} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    checkbox.click();
    expect(setShow).toHaveBeenCalledWith(true);
  });

  it('shows disabled style', () => {
    render(<NextgenRarityToggle title="Trait Count" show disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    const label = screen.getByText(/Trait Count/).closest('label');
    expect(label).toHaveClass('font-color-h');
  });
});

describe('NextgenTokenTraits', () => {
  it('renders trait rows with links', () => {
    const traits = [{ trait: 'Color', value: 'Red', value_count: 2, token_count: 10, trait_count: 1 } as any];
    render(<NextgenTokenTraits collection={{ name: 'Cool Coll' } as any} token={{} as any} traits={traits} tokenCount={10} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/nextgen/collection/cool-coll/art?traits=Color:Red');
    expect(link.textContent).toBe('Red');
  });
});
