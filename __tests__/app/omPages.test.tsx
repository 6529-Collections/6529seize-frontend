import { render, screen } from '@testing-library/react';
import React from 'react';
import OmGroups from '@/app/om/om-groups/page';


describe('OM pages render', () => {
  it('renders OM Groups page', () => {
    render(<OmGroups />);
    expect(screen.getAllByText(/OM GROUPS/i).length).toBeGreaterThan(0);
  });

  it('renders OM Groups with content about building OM together', () => {
    render(<OmGroups />);
    expect(screen.getByText(/We are going to build OM together/i)).toBeInTheDocument();
  });

  it('renders OM Groups with Discord link', () => {
    render(<OmGroups />);
    expect(screen.getByRole('link', { name: /OM Discord channel/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /OM Discord channel/i })).toHaveAttribute('href', 'https://discord.gg/join-om');
  });

  it('renders OM Groups with representative groups list', () => {
    render(<OmGroups />);
    expect(screen.getByText(/Representative groups:/i)).toBeInTheDocument();
    expect(screen.getByText(/Experiences: Art, Fashion, Education, Entertainment, Personal, Work/i)).toBeInTheDocument();
    expect(screen.getByText(/Communities: Art, PFP, Off-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/Governance & Social/i)).toBeInTheDocument();
    expect(screen.getByText(/Decentralized Tech Stack/i)).toBeInTheDocument();
    expect(screen.getByText(/Inclusion/i)).toBeInTheDocument();
    expect(screen.getByText(/Public Policy/i)).toBeInTheDocument();
  });

  it('renders with proper title and meta information', () => {
    render(<OmGroups />);
    expect(document.title).toBe('OM GROUPS - 6529.io');
  });
});