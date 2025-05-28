import { render, screen } from '@testing-library/react';
import React from 'react';
import Century from '../../pages/museum/genesis/century';
import Meridian from '../../pages/museum/genesis/meridian';
import PublicDomain from '../../pages/museum/6529-public-domain';
import Archetype from '../../pages/museum/genesis/archetype';
import FragmentsOfAnInfiniteField from '../../pages/museum/genesis/fragments-of-an-infinite-field';
import Nimbuds from '../../pages/museum/genesis/nimbuds';
import NftPhotography from '../../pages/museum/nft-photography';

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

  it('renders 6529 Public Domain page', () => {
    render(<PublicDomain />);
    expect(screen.getAllByText(/6529 PUBLIC DOMAIN/i).length).toBeGreaterThan(0);
  });

  it('renders Archetype page', () => {
    render(<Archetype />);
    expect(screen.getAllByText(/ARCHETYPE/i).length).toBeGreaterThan(0);
  });

  it('renders Fragments of an Infinite Field page', () => {
    render(<FragmentsOfAnInfiniteField />);
    expect(screen.getAllByText(/FRAGMENTS OF AN INFINITE FIELD/i).length).toBeGreaterThan(0);
  });

  it('renders Nimbuds page', () => {
    render(<Nimbuds />);
    expect(screen.getAllByText(/NIMBUDS/i).length).toBeGreaterThan(0);
  });

  it('renders NFT Photography page', () => {
    render(<NftPhotography />);
    expect(screen.getAllByText(/NFT PHOTOGRAPHY/i).length).toBeGreaterThan(0);
  });

  it('renders Archetype with artist information', () => {
    render(<Archetype />);
    expect(screen.getByText(/Kjetil Golid/i)).toBeInTheDocument();
    expect(screen.getByText(/02\/27\/2021/i)).toBeInTheDocument();
  });

  it('renders public domain with visit button', () => {
    render(<PublicDomain />);
    expect(screen.getByRole('link', { name: /VISIT 6529 PUBLIC DOMAIN/i })).toBeInTheDocument();
  });

  it('renders Archetype with NFT images', () => {
    render(<Archetype />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
