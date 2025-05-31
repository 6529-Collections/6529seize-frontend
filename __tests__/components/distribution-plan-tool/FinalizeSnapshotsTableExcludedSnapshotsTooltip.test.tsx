import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeSnapshotsTableExcludedSnapshotsTooltip from '../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableExcludedSnapshotsTooltip';
import { DistributionPlanToolContext } from '../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode, Pool } from '../../../components/allowlist-tool/allowlist-tool.types';

const renderWithContext = (ui: React.ReactElement, ctx: any) => {
  return render(
    <DistributionPlanToolContext.Provider value={ctx}>
      {ui}
    </DistributionPlanToolContext.Provider>
  );
};

test('renders token pool rows', () => {
  const ctx: any = {
    operations: [{ code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '1' } }],
    tokenPools: [{ id: '1', name: 'PoolOne', walletsCount: 2, tokensCount: 3 }],
  };
  renderWithContext(
    <FinalizeSnapshotsTableExcludedSnapshotsTooltip excludedSnapshots={[{ snapshotId: '1', snapshotType: Pool.TOKEN_POOL }]} />,
    ctx
  );
  expect(screen.getByText('PoolOne')).toBeInTheDocument();
  expect(screen.getByText('Snapshot')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('throws on wallet pool snapshot', () => {
  const ctx: any = { operations: [], tokenPools: [] };
  expect(() =>
    renderWithContext(
      <FinalizeSnapshotsTableExcludedSnapshotsTooltip excludedSnapshots={[{ snapshotId: 'x', snapshotType: Pool.WALLET_POOL }]} />,
      ctx
    )
  ).toThrow('Operation not found');
});
