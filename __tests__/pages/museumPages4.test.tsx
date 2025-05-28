import { render, screen } from '@testing-library/react';
import React from 'react';
import CapsuleHouse from '../../pages/museum/6529-fund-szn1/capsule-house';
import IncompleteControl from '../../pages/museum/6529-fund-szn1/incomplete-control';
import Madhouse from '../../pages/museum/6529-fund-szn1/madhouse';
import NuclearNerds from '../../pages/museum/6529-fund-szn1/nuclear-nerds';
import PhotoB from '../../pages/museum/6529-photo-b';
import BharatKrymo2 from '../../pages/museum/bharat-krymo-museum-2';
import GeneralAssembly from '../../pages/museum/general-assembly';
import Phase from '../../pages/museum/genesis/phase';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('additional museum pages render 4', () => {
  it('renders Capsule House page', () => {
    render(<CapsuleHouse />);
    expect(screen.getAllByText(/CAPSULE HOUSE/i).length).toBeGreaterThan(0);
  });

  it('renders Incomplete Control page', () => {
    render(<IncompleteControl />);
    expect(screen.getAllByText(/INCOMPLETE CONTROL/i).length).toBeGreaterThan(0);
  });

  it('renders Madhouse page', () => {
    render(<Madhouse />);
    expect(screen.getAllByText(/MADHOUSE/i).length).toBeGreaterThan(0);
  });

  it('renders Nuclear Nerds page', () => {
    render(<NuclearNerds />);
    expect(
      screen.getAllByText(/NUCLEAR NERDS OF THE ACCIDENTAL APOCALYPSE/i).length
    ).toBeGreaterThan(0);
  });

  it('renders 6529 Photo B page', () => {
    render(<PhotoB />);
    expect(screen.getAllByText(/6529 PHOTO B/i).length).toBeGreaterThan(0);
  });

  it('renders Bharat Krymo Museum 2 page', () => {
    render(<BharatKrymo2 />);
    expect(screen.getAllByText(/BHARAT KRYMO MUSEE D'ART 2/i).length).toBeGreaterThan(0);
  });

  it('renders General Assembly page', () => {
    render(<GeneralAssembly />);
    expect(screen.getAllByText(/GENERAL ASSEMBLY/i).length).toBeGreaterThan(0);
  });

  it('renders Phase page', () => {
    render(<Phase />);
    expect(screen.getAllByText(/PHASE/i).length).toBeGreaterThan(0);
  });
});
