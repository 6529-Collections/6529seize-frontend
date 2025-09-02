import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTImageBalance from '../../../components/nft-image/NFTImageBalance';

// Mock the SCSS module
jest.mock('../../../components/nft-image/NFTImage.module.scss', () => ({
  balance: 'balance',
  balanceBigger: 'balanceBigger',
}));

describe('NFTImageBalance', () => {
  describe('SEIZED state rendering', () => {
    it('renders SEIZED text without quantity when showOwned is true', () => {
      render(
        <NFTImageBalance
          balance={5}
          showOwned={true}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED')).toBeInTheDocument();
      expect(screen.queryByText('x5')).not.toBeInTheDocument();
    });

    it('renders SEIZED with quantity when showOwned is false or undefined', () => {
      const { rerender } = render(
        <NFTImageBalance
          balance={5}
          showOwned={false}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED x5')).toBeInTheDocument();
      
      // Test with showOwned undefined (should show quantity)
      rerender(
        <NFTImageBalance
          balance={3}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED x3')).toBeInTheDocument();
    });

    it('renders with correct CSS classes for different heights', () => {
      const { rerender, container } = render(
        <NFTImageBalance
          balance={1}
          showUnseized={false}
          height={300}
        />
      );
      
      let outerSpan = container.querySelector('span');
      expect(outerSpan).toHaveClass('balance');
      expect(outerSpan).not.toHaveClass('balanceBigger');
      
      // Test height 650 - should have balanceBigger class
      rerender(
        <NFTImageBalance
          balance={1}
          showUnseized={false}
          height={650}
        />
      );
      
      outerSpan = container.querySelector('span');
      expect(outerSpan).toHaveClass('balance');
      expect(outerSpan).toHaveClass('balanceBigger');
      
      // Test height "full" - should not have balanceBigger class
      rerender(
        <NFTImageBalance
          balance={1}
          showUnseized={false}
          height="full"
        />
      );
      
      outerSpan = container.querySelector('span');
      expect(outerSpan).toHaveClass('balance');
      expect(outerSpan).not.toHaveClass('balanceBigger');
    });

    it('handles large balance numbers correctly', () => {
      render(
        <NFTImageBalance
          balance={999999}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED x999999')).toBeInTheDocument();
    });
  });

  describe('UNSEIZED state rendering', () => {
    it('renders UNSEIZED when balance is 0 and showUnseized is true', () => {
      render(
        <NFTImageBalance
          balance={0}
          showUnseized={true}
          height={300}
        />
      );
      
      expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
    });

    it('does not render UNSEIZED when balance is 0 but showUnseized is false', () => {
      render(
        <NFTImageBalance
          balance={0}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
    });

    it('renders UNSEIZED with correct CSS classes', () => {
      const { container } = render(
        <NFTImageBalance
          balance={0}
          showUnseized={true}
          height={300}
        />
      );
      
      const unseizedElement = container.querySelector('span');
      expect(unseizedElement).toHaveClass('balance');
      expect(unseizedElement).not.toHaveClass('balanceBigger');
      expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
    });
  });

  describe('Loading state rendering', () => {
    it('renders loading dots when balance is -1 and showUnseized is true', () => {
      render(
        <NFTImageBalance
          balance={-1}
          showUnseized={true}
          height={300}
        />
      );
      
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
    });

    it('does not render loading dots when balance is -1 but showUnseized is false', () => {
      render(
        <NFTImageBalance
          balance={-1}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.queryByText('...')).not.toBeInTheDocument();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
    });

    it('renders loading dots with correct CSS classes', () => {
      const { container } = render(
        <NFTImageBalance
          balance={-1}
          showUnseized={true}
          height={300}
        />
      );
      
      const loadingElement = container.querySelector('span');
      expect(loadingElement).toHaveClass('balance');
      expect(loadingElement).not.toHaveClass('balanceBigger');
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Edge cases and prop combinations', () => {
    it('renders nothing when balance is 0 and showUnseized is false', () => {
      const { container } = render(
        <NFTImageBalance
          balance={0}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
    });

    it('renders nothing when balance is negative (other than -1) regardless of showUnseized', () => {
      const { container, rerender } = render(
        <NFTImageBalance
          balance={-2}
          showUnseized={true}
          height={300}
        />
      );
      
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
      
      rerender(
        <NFTImageBalance
          balance={-100}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('prioritizes SEIZED state over UNSEIZED when balance is positive', () => {
      render(
        <NFTImageBalance
          balance={1}
          showUnseized={true}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED x1')).toBeInTheDocument();
      expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
    });

    it('handles balance of 1 correctly with different showOwned values', () => {
      const { rerender } = render(
        <NFTImageBalance
          balance={1}
          showOwned={true}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED')).toBeInTheDocument();
      expect(screen.queryByText('x1')).not.toBeInTheDocument();
      
      rerender(
        <NFTImageBalance
          balance={1}
          showOwned={false}
          showUnseized={false}
          height={300}
        />
      );
      
      expect(screen.getByText('SEIZED x1')).toBeInTheDocument();
    });
  });

  describe('Component structure and accessibility', () => {
    it('renders as React fragment containing spans', () => {
      const { container } = render(
        <NFTImageBalance
          balance={5}
          showUnseized={false}
          height={300}
        />
      );
      
      // The component returns a React fragment, so we check for the span elements
      const spans = container.querySelectorAll('span');
      expect(spans).toHaveLength(2); // Outer span and inner span
      
      const outerSpan = spans[0];
      const innerSpan = spans[1];
      
      expect(outerSpan).toHaveClass('balance');
      expect(innerSpan).toHaveTextContent('SEIZED x5');
    });

    it('maintains proper nesting structure for SEIZED state', () => {
      const { container } = render(
        <NFTImageBalance
          balance={3}
          showUnseized={false}
          height={650}
        />
      );
      
      const outerSpan = container.querySelector('span.balance.balanceBigger');
      expect(outerSpan).toBeInTheDocument();
      
      const innerSpan = outerSpan?.querySelector('span');
      expect(innerSpan).toBeInTheDocument();
      expect(innerSpan).toHaveTextContent('SEIZED x3');
    });
  });
});
