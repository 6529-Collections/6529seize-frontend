import { render, screen } from '@testing-library/react';
import React from 'react';
import SelectSnapshotDropdownList from '../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdownList';

jest.mock('../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdownListItem', () => (props: any) => <li data-testid={`item-${props.snapshot.id}`} />);

describe('SelectSnapshotDropdownList', () => {
  it('renders items and empty state', () => {
    const snapshots = [{ id: '1' }, { id: '2' }] as any;
    const { rerender } = render(
      <SelectSnapshotDropdownList snapshots={snapshots} selectedSnapshot={null} setSelectedSnapshot={jest.fn()} />
    );
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    rerender(<SelectSnapshotDropdownList snapshots={[]} selectedSnapshot={null} setSelectedSnapshot={jest.fn()} />);
    expect(screen.getByText('No snapshots found')).toBeInTheDocument();
  });
});
