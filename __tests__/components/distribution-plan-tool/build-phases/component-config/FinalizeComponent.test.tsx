import React from 'react';
import { render, screen } from '@testing-library/react';
import FinalizeComponent from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/FinalizeComponent';
import { RandomHoldersType, PhaseGroupConfig, PhaseGroupSnapshotConfig } from '@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';
import { ComponentRandomHoldersWeightType } from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight';
import { BuildPhasesPhase } from '@/components/distribution-plan-tool/build-phases/BuildPhases';

// Mock child components to keep tests focused
jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle',
  () => ({ title }: any) => <div data-testid="title">{title}</div>
);

jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta',
  () => ({ walletsCount }: any) => <div data-testid="meta">{walletsCount}</div>
);

jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTable',
  () => ({ groupSnapshots }: any) => (
    <div data-testid="table">{groupSnapshots.length}</div>
  )
);

jest.mock(
  '@/components/distribution-plan-tool/common/DistributionPlanSecondaryText',
  () => ({ children }: any) => <div>{children}</div>
);

function createSnapshot(id: string): PhaseGroupSnapshotConfig {
  return {
    groupSnapshotId: id,
    snapshotId: id,
    snapshotType: null,
    snapshotSchema: null,
    excludeComponentWinners: [],
    excludeSnapshots: [],
    topHoldersFilter: null,
    tokenIds: null,
    uniqueWalletsCount: null,
  };
}

const phase: BuildPhasesPhase = {
  id: 'p1',
  allowlistId: '1',
  name: 'phase',
  description: '',
  hasRan: false,
  order: 1,
  components: [],
};

function renderComponent(overrides?: Partial<React.ComponentProps<typeof FinalizeComponent>>) {
  const defaultConfig: PhaseGroupConfig = {
    snapshots: [createSnapshot('s1')],
    randomHoldersFilter: null,
    maxMintCount: 2,
    uniqueWalletsCount: null,
  };

  const props = {
    onSave: jest.fn(),
    onStartAgain: jest.fn(),
    onRemoveGroupSnapshot: jest.fn(),
    phaseGroupConfig: defaultConfig,
    snapshots: [],
    loading: false,
    title: 'Title',
    uniqueWalletsCount: 1,
    isLoadingUniqueWalletsCount: false,
    onClose: jest.fn(),
    phases: [phase],
    ...overrides,
  };

  return {
    ...render(<FinalizeComponent {...props} />),
    props,
  };
}

describe('FinalizeComponent', () => {
  it('calls onStartAgain when snapshots become empty', () => {
    const { rerender, props } = renderComponent();
    expect(props.onStartAgain).not.toHaveBeenCalled();
    // re-render with empty snapshots to trigger effect
    const newConfig = { ...props.phaseGroupConfig, snapshots: [] };
    rerender(<FinalizeComponent {...props} phaseGroupConfig={newConfig} />);
    expect(props.onStartAgain).toHaveBeenCalled();
  });

  it('displays random wallets percentage when filter is BY_PERCENTAGE', () => {
    const randomFilter = {
      type: RandomHoldersType.BY_PERCENTAGE,
      value: 10,
      weightType: ComponentRandomHoldersWeightType.OFF,
      seed: '1',
    };
    renderComponent({
      phaseGroupConfig: {
        snapshots: [createSnapshot('s1')],
        randomHoldersFilter: randomFilter,
        maxMintCount: 2,
        uniqueWalletsCount: null,
      },
    });
    expect(screen.getByText(/Random wallets:/i)).toHaveTextContent('Random wallets: 10%');
  });

  it('shows spinner and disables save button when loading', async () => {
    renderComponent({ loading: true });
  const saveButton = screen.getAllByRole('button')[1];
    expect(saveButton).toBeDisabled();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });
});

