// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import Fam2021 from '../../pages/museum/6529-fam-2021';
import ActOfKindness from '../../pages/museum/6529-fund-szn1/act-of-kindness';
import Archeology from '../../pages/museum/6529-fund-szn1/archeology-of-the-future';
import ChromieSquiggle from '../../pages/museum/6529-fund-szn1/chromie-squiggle';
import ConflictingMetaphysics from '../../pages/museum/6529-fund-szn1/conflicting-metaphysics';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('museum pages set 4', () => {
  it('renders 6529 Fam 2021 page', () => {
    render(<Fam2021 />);
    expect(screen.getAllByText(/6529 FAM 2021/i).length).toBeGreaterThan(0);
  });

  it('renders Act of Kindness page', () => {
    render(<ActOfKindness />);
    expect(screen.getAllByText(/ACT OF KINDNESS/i).length).toBeGreaterThan(0);
  });

  it('renders Archeology of the Future page', () => {
    render(<Archeology />);
    expect(screen.getAllByText(/ARCHEOLOGY OF THE FUTURE/i).length).toBeGreaterThan(0);
  });

  it('renders Chromie Squiggle page', () => {
    render(<ChromieSquiggle />);
    expect(screen.getAllByText(/CHROMIE SQUIGGLE/i).length).toBeGreaterThan(0);
  });

  it('renders Conflicting Metaphysics page', () => {
    render(<ConflictingMetaphysics />);
    expect(screen.getAllByText(/CONFLICTING METAPHYSICS/i).length).toBeGreaterThan(0);
  });
});
