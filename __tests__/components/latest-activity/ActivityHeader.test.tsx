import { render, screen } from '@testing-library/react';
import React from 'react';
import ActivityHeader from '@/components/latest-activity/ActivityHeader';

// Mock the DotLoader component
jest.mock('@/components/dotLoader/DotLoader', () => {
  return function MockDotLoader() {
    return <div data-testid="dot-loader">Loading...</div>;
  };
});

// Mock the SCSS module
jest.mock('@/styles/Home.module.scss', () => ({
  viewAllLink: 'mocked-view-all-link-class',
}));

describe('ActivityHeader', () => {
  it('renders the NFT Activity header text', () => {
    render(<ActivityHeader showViewAll={false} fetching={false} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Activity/)).toBeInTheDocument();
  });

  it('renders with correct Bootstrap column classes', () => {
    const { container } = render(<ActivityHeader showViewAll={false} fetching={false} />);
    
    const colElement = container.firstChild as HTMLElement;
    expect(colElement).toHaveClass('col-sm-12');
    expect(colElement).toHaveClass('col-md-6');
    expect(colElement).toHaveClass('d-flex');
    expect(colElement).toHaveClass('align-items-center');
    expect(colElement).toHaveClass('justify-content-between');
  });

  describe('when showViewAll is true', () => {
    it('renders the View All link', () => {
      render(<ActivityHeader showViewAll={true} fetching={false} />);
      
      const link = screen.getByRole('link', { name: 'View All' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/nft-activity');
      expect(link).toHaveClass('mocked-view-all-link-class');
    });

    it('does not render DotLoader even when fetching is true', () => {
      render(<ActivityHeader showViewAll={true} fetching={true} />);
      
      expect(screen.getByRole('link', { name: 'View All' })).toBeInTheDocument();
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
    });
  });

  describe('when showViewAll is false', () => {
    it('does not render the View All link', () => {
      render(<ActivityHeader showViewAll={false} fetching={false} />);
      
      expect(screen.queryByRole('link', { name: 'View All' })).not.toBeInTheDocument();
    });

    it('renders DotLoader when fetching is true', () => {
      render(<ActivityHeader showViewAll={false} fetching={true} />);
      
      expect(screen.getByTestId('dot-loader')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'View All' })).not.toBeInTheDocument();
    });

    it('does not render DotLoader when fetching is false', () => {
      render(<ActivityHeader showViewAll={false} fetching={false} />);
      
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'View All' })).not.toBeInTheDocument();
    });
  });

  describe('prop combinations', () => {
    it('handles showViewAll=false and fetching=false (minimal state)', () => {
      render(<ActivityHeader showViewAll={false} fetching={false} />);
      
      expect(screen.getByRole('heading', { name: 'NFT Activity' })).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
    });

    it('handles showViewAll=false and fetching=true (loading state)', () => {
      render(<ActivityHeader showViewAll={false} fetching={true} />);
      
      expect(screen.getByRole('heading', { name: 'NFT Activity' })).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByTestId('dot-loader')).toBeInTheDocument();
    });

    it('handles showViewAll=true and fetching=false (view all state)', () => {
      render(<ActivityHeader showViewAll={true} fetching={false} />);
      
      expect(screen.getByRole('heading', { name: 'NFT Activity' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'View All' })).toBeInTheDocument();
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
    });

    it('handles showViewAll=true and fetching=true (view all takes precedence)', () => {
      render(<ActivityHeader showViewAll={true} fetching={true} />);
      
      expect(screen.getByRole('heading', { name: 'NFT Activity' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'View All' })).toBeInTheDocument();
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<ActivityHeader showViewAll={false} fetching={false} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('NFT Activity');
    });

    it('link has proper accessible text', () => {
      render(<ActivityHeader showViewAll={true} fetching={false} />);
      
      const link = screen.getByRole('link', { name: 'View All' });
      expect(link).toHaveAccessibleName('View All');
    });
  });

  describe('styling and layout', () => {
    it('has correct flex container structure', () => {
      const { container } = render(<ActivityHeader showViewAll={false} fetching={false} />);
      
      const spanElement = container.querySelector('span.d-flex');
      expect(spanElement).toHaveClass('d-flex');
      expect(spanElement).toHaveClass('flex-wrap');
      expect(spanElement).toHaveClass('align-items-center');
      expect(spanElement).toHaveClass('gap-3');
    });

    it('displays NFT Activity heading text', () => {
      render(<ActivityHeader showViewAll={false} fetching={false} />);
      expect(
        screen.getByRole('heading', { name: 'NFT Activity' })
      ).toBeInTheDocument();
    });
  });
});
