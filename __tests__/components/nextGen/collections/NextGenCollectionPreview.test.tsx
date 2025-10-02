import { render, screen, fireEvent } from '@testing-library/react';
import NextGenCollectionPreview from '@/components/nextGen/collections/NextGenCollectionPreview';
import { formatNameForUrl } from '@/components/nextGen/nextgen_helpers';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="img" {...props} />,
}));

jest.mock('@/components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({
  NextGenMintCounts: () => <span data-testid="mint-counts" />,
}));

const collection = {
  id: 1,
  name: 'Test Collection',
  artist: 'Artist',
  image: '/image.png',
} as any;

it('renders link, image and fallback on error', () => {
  const { container } = render(<NextGenCollectionPreview collection={collection} />);
  const link = container.querySelector('a');
  expect(link).toHaveAttribute('href', `/nextgen/collection/${formatNameForUrl(collection.name)}`);

  const img = screen.getByTestId('img') as HTMLImageElement;
  expect(img).toHaveAttribute('src', collection.image);

  fireEvent.error(img);
  expect(img).toHaveAttribute('src', '/pebbles-loading.jpeg');

  expect(screen.getByText(collection.name)).toBeInTheDocument();
  expect(screen.getAllByText('Artist').length).toBeGreaterThan(0);
  expect(screen.getByTestId('mint-counts')).toBeInTheDocument();
});
