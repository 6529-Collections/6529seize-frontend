import { render, screen } from '@testing-library/react';
import React from 'react';
import AboutRules from '../../pages/about/rules';
import CasaBatllo from '../../pages/casabatllo';
import Museum from '../../pages/museum';
import ElementColumns from '../../pages/element_category/columns';
import MemeLabDistribution from '../../pages/meme-lab/[id]/distribution';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('static pages render', () => {
  it('renders about rules page', () => {
    render(<AboutRules />);
    expect(screen.getAllByText(/6529 FAM RULES/i).length).toBeGreaterThan(0);
  });

  it('renders casa batllo page', () => {
    render(<CasaBatllo />);
    expect(screen.getAllByText(/CASA BATLLO/i).length).toBeGreaterThan(0);
  });

  it('renders museum page', () => {
    render(<Museum />);
    expect(screen.getAllByText(/MUSEUM OF ART/i).length).toBeGreaterThan(0);
  });

  it('element columns page redirects', () => {
    render(<ElementColumns />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('meme lab distribution page loads', () => {
    render(<MemeLabDistribution />);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });
});
