import { render, screen } from '@testing-library/react';
import React from 'react';
import Art1of1 from '../../pages/museum/1-of-1-art';
import Cryptocubes from '../../pages/museum/6529-fund-szn1/cryptocubes';
import Faraway from '../../pages/museum/6529-fund-szn1/faraway';
import NeuralBricolage from '../../pages/museum/6529-fund-szn1/primary-colors-of-neural-bricolage';
import Subscapes from '../../pages/museum/6529-fund-szn1/subscapes';
import Bonafidehan from '../../pages/museum/bonafidehan-museum';
import GeneralAssembly from '../../pages/museum/general-assembly';
import ChromieSquiggle from '../../pages/museum/genesis/chromie-squiggle';
import GenesisDca from '../../pages/museum/genesis/genesis-dca';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('additional museum pages render', () => {
  it('renders 1 of 1 art page', () => {
    render(<Art1of1 />);
    expect(screen.getAllByText(/1 OF 1 ART/i).length).toBeGreaterThan(0);
  });

  it('renders Cryptocubes page', () => {
    render(<Cryptocubes />);
    expect(screen.getAllByText(/CRYPTOCUBES/i).length).toBeGreaterThan(0);
  });

  it('renders Faraway page', () => {
    render(<Faraway />);
    expect(screen.getAllByText(/FARAWAY/i).length).toBeGreaterThan(0);
  });

  it('renders Neural Bricolage page', () => {
    render(<NeuralBricolage />);
    expect(screen.getAllByText(/PRIMARY COLORS OF NEURAL BRICOLAGE/i).length).toBeGreaterThan(0);
  });

  it('renders Subscapes page', () => {
    render(<Subscapes />);
    expect(screen.getAllByText(/SUBSCAPES/i).length).toBeGreaterThan(0);
  });

  it('renders Bonafidehan page', () => {
    render(<Bonafidehan />);
    expect(screen.getAllByText(/BONAFIDEHAN GALLERY/i).length).toBeGreaterThan(0);
  });

  it('renders General Assembly page', () => {
    render(<GeneralAssembly />);
    expect(screen.getAllByText(/GENERAL ASSEMBLY/i).length).toBeGreaterThan(0);
  });

  it('renders Chromie Squiggle page', () => {
    render(<ChromieSquiggle />);
    expect(screen.getAllByText(/CHROMIE SQUIGGLE/i).length).toBeGreaterThan(0);
  });

  it('renders Genesis DCA page', () => {
    render(<GenesisDca />);
    expect(screen.getAllByText(/GENESIS/i).length).toBeGreaterThan(0);
  });
});
