import { render, screen, fireEvent } from '@testing-library/react';
import SelectSnapshotDropdownListItem from '../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdownListItem';
import { Pool } from '../../../../../../../../components/allowlist-tool/allowlist-tool.types';

describe('SelectSnapshotDropdownListItem', () => {
  const snapshot = { id: 's1', name: 'Snap', poolType: Pool.TOKEN_POOL, walletsCount: 3 } as any;
  it('renders subtitle based on pool type and toggles selection', () => {
    const setSelected = jest.fn();
    render(
      <SelectSnapshotDropdownListItem
        snapshot={snapshot}
        selectedSnapshot={null}
        setSelectedSnapshot={setSelected}
      />
    );
    expect(screen.getByText('Snapshot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option'));
    expect(setSelected).toHaveBeenCalledWith(snapshot);
  });

  it('shows checkmark when selected', () => {
    render(
      <SelectSnapshotDropdownListItem
        snapshot={{ ...snapshot, poolType: Pool.CUSTOM_TOKEN_POOL }}
        selectedSnapshot={snapshot}
        setSelectedSnapshot={jest.fn()}
      />
    );
    expect(screen.getByText('Custom Snapshot')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
