import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateSnapshotFormSearchCollectionDropdownTable from '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownTable';

let itemProps: any[] = [];
jest.mock('../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownItem', () => (props: any) => { itemProps.push(props); return <tr data-testid={`item-${props.collection.id}`} />; });

describe('CreateSnapshotFormSearchCollectionDropdownTable', () => {
  beforeEach(() => { itemProps = []; });

  it('renders table headers and items', () => {
    const collections = [
      { id: '1', address: '0x1', name: 'One', tokenType: 'erc721' } as any,
      { id: '2', address: '0x2', name: 'Two', tokenType: 'erc1155' } as any,
    ];
    const onCollection = jest.fn();
    render(
      <CreateSnapshotFormSearchCollectionDropdownTable collections={collections} onCollection={onCollection} />
    );
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('All time volume')).toBeInTheDocument();
    expect(screen.getByText('Floor')).toBeInTheDocument();
    expect(screen.getAllByTestId(/item-/)).toHaveLength(2);
    expect(itemProps[0]).toEqual({ collection: collections[0], onCollection });
  });
});
