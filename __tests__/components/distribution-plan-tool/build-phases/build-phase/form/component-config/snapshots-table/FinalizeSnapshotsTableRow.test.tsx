import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FinalizeSnapshotsTableRow from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableRow';

jest.mock('@/components/distribution-plan-tool/common/DistributionPlanTableRowWrapper', () => ({ children }: any) => (
  <tr data-testid="wrapper">{children}</tr>
));

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltip', () => (p: any) => <div data-testid="snapshot-tip">{p.snapshotId}</div>);
jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableExcludedSnapshotsTooltip', () => (p: any) => <div data-testid="excluded-tip">{p.excludedSnapshots.length}</div>);
jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableExcludedComponentsTooltip', () => (p: any) => <div data-testid="components-tip">{p.excludedComponents.length}</div>);

const row: any = {
  groupSnapshotId: 'g1',
  snapshot: { id: 's1', name: 'Snap1', poolType: 'POOL' },
  uniqueWalletsCount: 5,
  excludeSnapshotsText: '1 snapshot',
  excludeSnapshots: [{ snapshotId: 's2', snapshotType: 'POOL' }],
  excludeComponentWinnersText: '1 comp',
  excludeComponentWinners: ['c1'],
  requiredTokens: '10',
  topHoldersFilter: 'All'
};

const phases: any[] = [];

test('renders row data and handles delete click', () => {
  const onRemove = jest.fn();
  render(
    <table><tbody>
      <FinalizeSnapshotsTableRow row={row} phases={phases} onRemoveGroupSnapshot={onRemove} />
    </tbody></table>
  );
  expect(screen.getByText('Snap1')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Delete'));
  expect(onRemove).toHaveBeenCalledWith('g1');
});

test('shows tooltips when exclude lists present', () => {
  render(
    <table><tbody>
      <FinalizeSnapshotsTableRow row={row} phases={phases} onRemoveGroupSnapshot={jest.fn()} />
    </tbody></table>
  );
  
  // Check that all tooltip elements are rendered
  const tooltips = screen.getAllByTestId('react-tooltip');
  expect(tooltips).toHaveLength(3);
  
  // Check tooltip IDs
  expect(tooltips[0]).toHaveAttribute('data-tooltip-id', 'snapshot-info-g1');
  expect(tooltips[1]).toHaveAttribute('data-tooltip-id', 'excluded-snapshots-g1');
  expect(tooltips[2]).toHaveAttribute('data-tooltip-id', 'excluded-components-g1');
  
  // Check tooltip content components
  expect(screen.getByTestId('snapshot-tip')).toHaveTextContent('s1');
  expect(screen.getByTestId('excluded-tip')).toHaveTextContent('1');
  expect(screen.getByTestId('components-tip')).toHaveTextContent('1');
});

