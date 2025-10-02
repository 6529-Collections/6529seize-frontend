import { render } from '@testing-library/react';
import FinalizeSnapshotsTable, { FinalizeSnapshotRow } from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTable';
import { Pool } from '@/components/allowlist-tool/allowlist-tool.types';
import { TopHolderType } from '@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableRow', () => (props: any) => {
  // push rows for assertion
  rows.push(props.row);
  return <tr data-testid={`row-${props.row.groupSnapshotId}`} />;
});

jest.mock('@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper', () => (props: any) => <tbody>{props.children}</tbody>);

const rows: FinalizeSnapshotRow[] = [];

describe('FinalizeSnapshotsTable', () => {
  it('maps snapshot configs to rows', () => {
    const groupSnapshots = [
      {
        groupSnapshotId: 'gs1',
        snapshotId: 's1',
        snapshotType: Pool.TOKEN_POOL,
        snapshotSchema: null,
        excludeComponentWinners: ['c1'],
        excludeSnapshots: [
          { snapshotId: 's2', snapshotType: Pool.TOKEN_POOL, extraWallets: [] },
          { snapshotId: 's3', snapshotType: Pool.TOKEN_POOL, extraWallets: [] },
        ],
        topHoldersFilter: { type: TopHolderType.TOTAL_TOKENS_COUNT, from: 1, to: 3, tdhBlockNumber: null },
        tokenIds: '1,2',
        uniqueWalletsCount: 10,
      },
    ];
    const snapshots = [
      { id: 's1', name: 'Snap1', poolType: Pool.TOKEN_POOL, walletsCount: 5 },
    ];
    render(
      <FinalizeSnapshotsTable
        groupSnapshots={groupSnapshots as any}
        snapshots={snapshots as any}
        phases={[]}
        onRemoveGroupSnapshot={() => {}}
      />
    );
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.excludeSnapshotsText).toBe('2 snapshots');
    expect(row.excludeComponentWinnersText).toBe('1 component');
    expect(row.topHoldersFilter).toBe('Total Tokens Top 1 - 3');
    expect(row.snapshot?.name).toBe('Snap1');
    expect(row.requiredTokens).toBe('1,2');
  });

  it('handles empty top holder filter', () => {
    rows.length = 0;
    const groupSnapshots = [
      {
        groupSnapshotId: 'gs2',
        snapshotId: 's2',
        snapshotType: Pool.TOKEN_POOL,
        snapshotSchema: null,
        excludeComponentWinners: [],
        excludeSnapshots: [],
        topHoldersFilter: { type: null, from: null, to: null },
        tokenIds: null,
        uniqueWalletsCount: null,
      },
    ];
    render(
      <FinalizeSnapshotsTable
        groupSnapshots={groupSnapshots as any}
        snapshots={[] as any}
        phases={[]}
        onRemoveGroupSnapshot={() => {}}
      />
    );
    expect(rows[0].topHoldersFilter).toBe('');
  });
});
