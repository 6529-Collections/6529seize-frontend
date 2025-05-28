import { render, screen } from '@testing-library/react';
import React from 'react';
import AnIncomparableLove from '../../pages/museum/6529-fund-szn1/an-incomparable-love';
import BoredApeYachtClub from '../../pages/museum/6529-fund-szn1/bored-ape-yacht-club';
import IntensifyModeling from '../../pages/museum/6529-fund-szn1/intensify-modeling';
import PrimaryColorsOfNeuralBricolage from '../../pages/museum/6529-fund-szn1/primary-colors-of-neural-bricolage';
import Videodrome from '../../pages/museum/6529-fund-szn1/videodrome';
import XCopy from '../../pages/museum/6529-fund-szn1/xcopy';
import BatsoupyumMuseum1 from '../../pages/museum/batsoupyum-museum-1';
import Autoglyphs from '../../pages/museum/genesis/autoglyphs';
import ConstructionToken from '../../pages/museum/genesis/construction-token';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('additional museum pages render', () => {
  it('renders An Incomparable Love page', () => {
    render(<AnIncomparableLove />);
    expect(screen.getAllByText(/AN INCOMPARABLE LOVE/i).length).toBeGreaterThan(0);
  });

  it('renders Bored Ape Yacht Club page', () => {
    render(<BoredApeYachtClub />);
    expect(screen.getAllByText(/BORED APE YACHT CLUB/i).length).toBeGreaterThan(0);
  });

  it('renders Intensify Modeling page', () => {
    render(<IntensifyModeling />);
    expect(screen.getAllByText(/INTENSIFY MODELING/i).length).toBeGreaterThan(0);
  });

  it('renders Primary Colors of Neural Bricolage page', () => {
    render(<PrimaryColorsOfNeuralBricolage />);
    expect(screen.getAllByText(/PRIMARY COLORS OF NEURAL BRICOLAGE/i).length).toBeGreaterThan(0);
  });

  it('renders Videodrome page', () => {
    render(<Videodrome />);
    expect(screen.getAllByText(/VIDEODROME/i).length).toBeGreaterThan(0);
  });

  it('renders XCopy page', () => {
    render(<XCopy />);
    expect(screen.getAllByText(/XCOPY/i).length).toBeGreaterThan(0);
  });

  it('renders Batsoupyum Museum page', () => {
    render(<BatsoupyumMuseum1 />);
    expect(screen.getAllByText(/BATSOUPCAVE/i).length).toBeGreaterThan(0);
  });

  it('renders Autoglyphs page', () => {
    render(<Autoglyphs />);
    expect(screen.getAllByText(/AUTOGLYPHS/i).length).toBeGreaterThan(0);
  });

  it('renders Construction Token page', () => {
    render(<ConstructionToken />);
    expect(screen.getAllByText(/CONSTRUCTION TOKEN/i).length).toBeGreaterThan(0);
  });
});
