import { render, screen } from '@testing-library/react';
import React from 'react';
import SixFam2021 from '../../pages/museum/6529-fam-2021';
import ChromieSquiggle from '../../pages/museum/6529-fund-szn1/chromie-squiggle';
import ConflictingMetaphysics from '../../pages/museum/6529-fund-szn1/conflicting-metaphysics';
import SixFundSzn2 from '../../pages/museum/6529-fund-szn2';
import TwentySevenBitDigital from '../../pages/museum/genesis/27-bit-digital';
import Algobots from '../../pages/museum/genesis/algobots';
import Asemica from '../../pages/museum/genesis/asemica';
import Chimera from '../../pages/museum/genesis/chimera';
import CosmicReef from '../../pages/museum/genesis/cosmic-reef';
import GenesisDca from '../../pages/museum/genesis/genesis-dca';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('museum static pages render', () => {
  it('renders 6529 FAM 2021 page', () => {
    render(<SixFam2021 />);
    expect(screen.getAllByText(/6529 FAM 2021/i).length).toBeGreaterThan(0);
  });

  it('renders Chromie Squiggle page', () => {
    render(<ChromieSquiggle />);
    expect(screen.getAllByText(/CHROMIE SQUIGGLE/i).length).toBeGreaterThan(0);
  });

  it('renders Conflicting Metaphysics page', () => {
    render(<ConflictingMetaphysics />);
    expect(screen.getAllByText(/CONFLICTING METAPHYSICS/i).length).toBeGreaterThan(0);
  });

  it('renders 6529 Fund Season 2 page', () => {
    render(<SixFundSzn2 />);
    expect(screen.getAllByText(/6529 FUND SZN2/i).length).toBeGreaterThan(0);
  });

  it('renders 27 Bit Digital page', () => {
    render(<TwentySevenBitDigital />);
    expect(screen.getAllByText(/27 BIT DIGITAL/i).length).toBeGreaterThan(0);
  });

  it('renders Algobots page', () => {
    render(<Algobots />);
    expect(screen.getAllByText(/ALGOBOTS/i).length).toBeGreaterThan(0);
  });

  it('renders Asemica page', () => {
    render(<Asemica />);
    expect(screen.getAllByText(/ASEMICA/i).length).toBeGreaterThan(0);
  });

  it('renders Chimera page', () => {
    render(<Chimera />);
    expect(screen.getAllByText(/CHIMERA/i).length).toBeGreaterThan(0);
  });

  it('renders Cosmic Reef page', () => {
    render(<CosmicReef />);
    expect(screen.getAllByText(/COSMIC REEF/i).length).toBeGreaterThan(0);
  });

  it('renders Genesis DCA page', () => {
    render(<GenesisDca />);
    expect(screen.getAllByText(/GENESIS/i).length).toBeGreaterThan(0);
  });
});
