import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '@/components/allowlist-tool/allowlist-tool.types';

describe('FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot', () => {
  const tokenPools = [{ id: '1', name: 'Pool', tokenIds: '1', walletsCount: 2, tokensCount: 3 } as any];
  const operations = [{ code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '1', contract: '0xabc', blockNo: '10', consolidateBlockNo: '20' } } as any];

  it('renders rows with values', () => {
    render(
      <DistributionPlanToolContext.Provider value={{ tokenPools, operations } as any}>
        <FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot snapshotId="1" />
      </DistributionPlanToolContext.Provider>
    );
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Contract number:')).toBeInTheDocument();
    expect(screen.getByText('0xabc')).toBeInTheDocument();
  });
});
