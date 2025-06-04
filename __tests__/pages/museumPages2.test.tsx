import { render, screen } from '@testing-library/react';
import React from 'react';
import ElevatedDeconstructions from '../../pages/museum/genesis/elevated-deconstructions';
import Ringers from '../../pages/museum/genesis/ringers';
import Screens from '../../pages/museum/genesis/screens';
import Skulptuur from '../../pages/museum/genesis/skulptuur';
import Synapses from '../../pages/museum/genesis/synapses';
import BlocksOfArt from '../../pages/museum/genesis/the-blocks-of-art';
import Vortex from '../../pages/museum/genesis/vortex';
import OMRedirect from '../../pages/om/OM';
import TheMemesPage from '../../pages/the-memes';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const renderWithAuth = (ui: React.ReactElement, overrides = {}) => {
  const value = { setTitle: jest.fn(), ...overrides } as any;
  return {
    ...render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>),
    setTitle: value.setTitle,
  };
};

describe('additional museum and misc pages render', () => {
  it('renders Elevated Deconstructions', () => {
    render(<ElevatedDeconstructions />);
    expect(screen.getAllByText(/ELEVATED DECONSTRUCTIONS/i).length).toBeGreaterThan(0);
  });

  it('renders Ringers', () => {
    render(<Ringers />);
    expect(screen.getAllByText(/RINGERS/i).length).toBeGreaterThan(0);
  });

  it('renders Screens', () => {
    render(<Screens />);
    expect(screen.getAllByText(/SCREENS/i).length).toBeGreaterThan(0);
  });

  it('renders Skulptuur', () => {
    render(<Skulptuur />);
    expect(screen.getAllByText(/SKULPTUUR/i).length).toBeGreaterThan(0);
  });

  it('renders Synapses', () => {
    render(<Synapses />);
    expect(screen.getAllByText(/SYNAPSES/i).length).toBeGreaterThan(0);
  });

  it('renders Blocks Of Art', () => {
    render(<BlocksOfArt />);
    expect(screen.getAllByText(/THE BLOCKS OF ART/i).length).toBeGreaterThan(0);
  });

  it('renders Vortex', () => {
    render(<Vortex />);
    expect(screen.getAllByText(/VORTEX/i).length).toBeGreaterThan(0);
  });

  it('renders OM redirect page', () => {
    render(<OMRedirect />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('renders The Memes page and sets title', () => {
    const { setTitle } = renderWithAuth(<TheMemesPage />);
    expect(setTitle).toHaveBeenCalledWith({ title: 'The Memes | Collections' });
  });
});
