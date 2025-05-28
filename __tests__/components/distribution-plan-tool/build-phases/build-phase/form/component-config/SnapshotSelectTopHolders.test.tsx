import React from 'react';
import { render, screen } from '@testing-library/react';
import SnapshotSelectTopHolders from '../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotSelectTopHolders';
import { DistributionPlanToolContext } from '../../../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode, Pool } from '../../../../../../../components/allowlist-tool/allowlist-tool.types';

const operations = [
  {
    id: '1',
    createdAt: 0,
    order: 0,
    allowlistId: 'a',
    hasRan: false,
    code: AllowlistOperationCode.CREATE_TOKEN_POOL,
    params: {
      id: 'tp1',
      contract: '0x33fd426905f149f8376e227d0c9d3340aad17af1',
      blockNo: 99
    }
  }
] as any;

const config = {
  snapshotId: 'tp1',
  snapshotType: Pool.TOKEN_POOL,
  snapshotSchema: 'erc1155',
  groupSnapshotId: null,
  excludeComponentWinners: [],
  excludeSnapshots: [],
  topHoldersFilter: null,
  tokenIds: null,
  uniqueWalletsCount: 10
} as any;

const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <DistributionPlanToolContext.Provider value={{ operations } as any}>
    {children}
  </DistributionPlanToolContext.Provider>
);

describe('SnapshotSelectTopHolders', () => {
  it('shows tdh and unique token options when conditions met', () => {
    render(
      <SnapshotSelectTopHolders
        onSelectTopHoldersSkip={jest.fn()}
        onSelectTopHoldersFilter={jest.fn()}
        config={config}
        title="title"
        onClose={jest.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('TDH')).toBeInTheDocument();
    expect(screen.getByText('Unique tokens count')).toBeInTheDocument();
  });

  it('shows only total tokens option otherwise', () => {
    const simpleConfig = { ...config, snapshotId: null, snapshotSchema: null };
    render(
      <SnapshotSelectTopHolders
        onSelectTopHoldersSkip={jest.fn()}
        onSelectTopHoldersFilter={jest.fn()}
        config={simpleConfig as any}
        title="title"
        onClose={jest.fn()}
      />,
      { wrapper: ({ children }) => (
        <DistributionPlanToolContext.Provider value={{ operations: [] } as any}>
          {children}
        </DistributionPlanToolContext.Provider>
      ) }
    );
    expect(screen.queryByText('TDH')).toBeNull();
    expect(screen.queryByText('Unique tokens count')).toBeNull();
    expect(screen.getByText('Total tokens count')).toBeInTheDocument();
  });
});
