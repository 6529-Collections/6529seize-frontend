import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateSnapshotFormSearchCollectionDropdown from '@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdown';

const tableMock = jest.fn(({ collections }: any) => (
  <table data-testid="table">{collections.map((c: any) => c.name).join(',')}</table>
));

jest.mock(
  '@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownTable',
  () => (props: any) => tableMock(props)
);

const sampleCollection = {
  id: '1',
  address: '0x1',
  name: 'One',
  tokenType: 'erc721',
  floorPrice: 1,
  imageUrl: null,
  description: null,
  allTimeVolume: 2,
  openseaVerified: false,
};

const sampleDefault = {
  id: '2',
  address: '0x2',
  name: 'Two',
  tokenType: 'erc1155',
  floorPrice: 3,
  imageUrl: null,
  description: null,
  allTimeVolume: 4,
  openseaVerified: true,
};

describe('CreateSnapshotFormSearchCollectionDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tables for collections and default collections', () => {
    render(
      <CreateSnapshotFormSearchCollectionDropdown
        collections={[sampleCollection] as any}
        defaultCollections={[sampleDefault] as any}
        onCollection={jest.fn()}
      />
    );
    expect(screen.getAllByTestId('table')).toHaveLength(2);
    expect(tableMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ collections: [sampleCollection] }));
    expect(tableMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ collections: [sampleDefault] }));
  });

  it('renders only default collections when collections list is empty', () => {
    render(
      <CreateSnapshotFormSearchCollectionDropdown
        collections={[]}
        defaultCollections={[sampleDefault] as any}
        onCollection={jest.fn()}
      />
    );
    expect(screen.getAllByTestId('table')).toHaveLength(1);
    expect(tableMock).toHaveBeenCalledWith(expect.objectContaining({ collections: [sampleDefault] }));
  });

  it('renders no table when both lists are empty', () => {
    render(
      <CreateSnapshotFormSearchCollectionDropdown
        collections={[]}
        defaultCollections={[]}
        onCollection={jest.fn()}
      />
    );
    expect(screen.queryByTestId('table')).toBeNull();
  });
});
