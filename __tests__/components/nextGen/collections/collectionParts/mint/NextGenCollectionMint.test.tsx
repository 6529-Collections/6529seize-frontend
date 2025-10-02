import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NextGenCollectionMint from '@/components/nextGen/collections/collectionParts/mint/NextGenCollectionMint';
import { useReadContract } from 'wagmi';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
  };
});

const MockNextGenMint = jest.fn((props: any) => (
  <div data-testid="mint-props">{props.mint_price}:{props.burn_amount}</div>
));

jest.mock('@/components/nextGen/collections/collectionParts/mint/NextGenMint', () => ({
  __esModule: true,
  default: (props: any) => MockNextGenMint(props),
}));

jest.mock('@/components/nextGen/collections/NextGenNavigationHeader', () => () => <div data-testid="header" />);

jest.mock('wagmi', () => ({ useReadContract: jest.fn() }));

const readMock = useReadContract as jest.Mock;

const collection = { id: 1 } as any;

let callIndex: number;

beforeEach(() => {
  jest.clearAllMocks();
  callIndex = 0;
});

function setupBurnAndPrice(burnData: any, priceData: any) {
  readMock.mockImplementation(() => {
    return (callIndex++ % 2 === 0) ? burnData : priceData;
  });
  render(<NextGenCollectionMint collection={collection} />);
}

describe('NextGenCollectionMint', () => {
  it('renders mint component with parsed values', async () => {
    setupBurnAndPrice({ data: '10', isSuccess: true }, { data: '5', isSuccess: true });
    await waitFor(() => {
      expect(MockNextGenMint).toHaveBeenLastCalledWith(
        expect.objectContaining({ burn_amount: 10, mint_price: 5, collection })
      );
    });
    expect(screen.getByTestId('mint-props').textContent).toBe('5:10');
  });

  it('skips rendering when data not loaded', () => {
    setupBurnAndPrice({ data: '2', isSuccess: true }, { data: undefined, isSuccess: false });
    expect(screen.queryByTestId('mint-props')).toBeNull();
  });

  it('falls back to 0 when price not numeric', async () => {
    setupBurnAndPrice({ data: '3', isSuccess: true }, { data: 'abc', isSuccess: true });
    await waitFor(() => {
      expect(MockNextGenMint).toHaveBeenLastCalledWith(
        expect.objectContaining({ burn_amount: 3, mint_price: 0 })
      );
    });
    expect(screen.getByTestId('mint-props').textContent).toBe('0:3');
  });
});

