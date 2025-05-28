// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import Azuki from '../../pages/museum/6529-fund-szn1/azuki';
import Cod from '../../pages/museum/6529-fund-szn1/cod';
import InvisibleFriends from '../../pages/museum/6529-fund-szn1/invisible-friends';
import Nouns from '../../pages/museum/6529-fund-szn1/nouns';
import Screens from '../../pages/museum/6529-fund-szn1/screens';
import TwinFlames from '../../pages/museum/6529-fund-szn1/twin-flames';
import PhotoA from '../../pages/museum/6529-photo-a';
import Batsoupyum from '../../pages/museum/batsoupyum-museum-2';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('additional museum pages render', () => {
  it('renders Azuki page', () => {
    render(<Azuki />);
    expect(screen.getAllByText(/AZUKI/i).length).toBeGreaterThan(0);
  });

  it('renders COD page', () => {
    render(<Cod />);
    expect(screen.getAllByText(/COD/i).length).toBeGreaterThan(0);
  });

  it('renders Invisible Friends page', () => {
    render(<InvisibleFriends />);
    expect(screen.getAllByText(/INVISIBLE FRIENDS/i).length).toBeGreaterThan(0);
  });

  it('renders Nouns page', () => {
    render(<Nouns />);
    expect(screen.getAllByText(/NOUNS/i).length).toBeGreaterThan(0);
  });

  it('renders Screens page', () => {
    render(<Screens />);
    expect(screen.getAllByText(/SCREENS/i).length).toBeGreaterThan(0);
  });

  it('renders Twin Flames page', () => {
    render(<TwinFlames />);
    expect(screen.getAllByText(/TWIN FLAMES/i).length).toBeGreaterThan(0);
  });

  it('renders 6529 Photo A page', () => {
    render(<PhotoA />);
    expect(screen.getAllByText(/6529 PHOTO A/i).length).toBeGreaterThan(0);
  });

  it('renders Batsoupyum museum page', () => {
    render(<Batsoupyum />);
    expect(screen.getAllByText(/BATSOUPLOUNGE/i).length).toBeGreaterThan(0);
  });
});
