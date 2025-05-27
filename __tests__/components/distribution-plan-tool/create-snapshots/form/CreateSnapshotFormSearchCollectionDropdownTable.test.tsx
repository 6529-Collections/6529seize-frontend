import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateSnapshotFormSearchCollectionDropdownTable from '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownTable';

const itemMock = jest.fn(({ collection }: any) => <tr data-testid="row">{collection.name}</tr>);

jest.mock(
  '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownItem',
  () => (props: any) => itemMock(props)
);

describe('CreateSnapshotFormSearchCollectionDropdownTable', () => {
  const sample = {
    id: '1',
    address: '0xabc',
    name: 'One',
    tokenType: 'erc721',
    floorPrice: 1,
    imageUrl: null,
    description: null,
    allTimeVolume: 2,
    openseaVerified: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table headers', () => {
    render(
      <CreateSnapshotFormSearchCollectionDropdownTable collections={[sample]} onCollection={jest.fn()} />
    );
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('All time volume')).toBeInTheDocument();
    expect(screen.getByText('Floor')).toBeInTheDocument();
  });

  it('renders an item row for each collection', () => {
    const collections = [sample, { ...sample, id: '2', name: 'Two' }];
    const onCollection = jest.fn();
    render(
      <CreateSnapshotFormSearchCollectionDropdownTable collections={collections} onCollection={onCollection} />
    );
    expect(screen.getAllByTestId('row')).toHaveLength(2);
    expect(itemMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ collection: collections[0], onCollection }));
    expect(itemMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ collection: collections[1], onCollection }));
  });
});
