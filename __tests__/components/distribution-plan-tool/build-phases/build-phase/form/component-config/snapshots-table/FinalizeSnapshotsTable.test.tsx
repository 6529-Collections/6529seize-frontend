import { render, screen } from '@testing-library/react';
import FinalizeSnapshotsTable from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTable';
import { TopHolderType } from '@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableRow', () => (props: any) => (
  <tr><td>{props.row.snapshot?.name}</td><td>{props.row.excludeSnapshotsText}</td><td>{props.row.topHoldersFilter}</td></tr>
));
jest.mock('@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper', () => (props: any) => <tbody>{props.children}</tbody>);

const groupSnapshots = [
  {
    groupSnapshotId: 'g1',
    snapshotId: 's1',
    excludeSnapshots: [{ snapshotId: 's2', snapshotType: 'MINT' }],
    excludeComponentWinners: [],
    tokenIds: '1,2',
    topHoldersFilter: { type: TopHolderType.TOTAL_TOKENS_COUNT, from: 1, to: null },
    uniqueWalletsCount: 5,
  },
];

const snapshots = [{ id: 's1', name: 'Snap1', poolType: 'MINT' }];

describe('FinalizeSnapshotsTable', () => {
  it('maps snapshots to rows and renders text', () => {
    render(
      <FinalizeSnapshotsTable
        onRemoveGroupSnapshot={jest.fn()}
        groupSnapshots={groupSnapshots as any}
        snapshots={snapshots as any}
        phases={[]}
      />
    );
    expect(screen.getByText('Snap1')).toBeInTheDocument();
    expect(screen.getByText('1 snapshot')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens Top 1+')).toBeInTheDocument();
  });
});
