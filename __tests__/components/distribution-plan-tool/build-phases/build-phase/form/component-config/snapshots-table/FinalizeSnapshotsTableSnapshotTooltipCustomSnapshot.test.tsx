import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot from '../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot';
import { DistributionPlanToolContext } from '../../../../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '../../../../../../../../components/allowlist-tool/allowlist-tool.types';

describe('FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot', () => {
  it('renders rows with custom pool info', () => {
    const value = {
      operations: [
        {
          code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
          params: {
            id: 'snap',
            name: 'Pool A',
            tokens: [{ owner: '0x1' }, { owner: '0x2' }, { owner: '0x1' }],
          },
        },
      ],
    } as any;

    render(
      <DistributionPlanToolContext.Provider value={value}>
        <FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot snapshotId="snap" />
      </DistributionPlanToolContext.Provider>
    );

    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Pool A')).toBeInTheDocument();
    expect(screen.getByText('Wallets count:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Tokens count:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
