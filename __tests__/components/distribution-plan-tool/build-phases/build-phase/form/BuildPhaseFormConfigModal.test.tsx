import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BuildPhaseFormConfigModal from '../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';
import { DistributionPlanToolContext } from '../../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode, Pool } from '../../../../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshot', () => ({
  __esModule: true,
  default: ({ onSelectSnapshot }: any) => <button onClick={() => onSelectSnapshot({ snapshotId: '1', snapshotType: Pool.TOKEN_POOL, uniqueWalletsCount: null })}>select</button>,
}));

jest.mock('../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotExcludeOtherSnapshots', () => ({
  __esModule: true,
  default: () => <div data-testid="exclude" />,
}));

const contextValue = {
  operations: [
    { code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '1', name: 'A' } },
    { code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '2', name: 'B' } },
  ],
  distributionPlan: null,
  tokenPools: [],
  customTokenPools: [],
  fetchOperations: jest.fn(),
  runOperations: jest.fn(),
  phases: [],
  setToasts: jest.fn(),
} as any;

function renderModal() {
  return render(
    <DistributionPlanToolContext.Provider value={contextValue}>
      <BuildPhaseFormConfigModal name="g" description="d" selectedPhase={{ id: 'p', components: [] }} phases={[{ id: 'p', components: [] }]} onClose={jest.fn()} />
    </DistributionPlanToolContext.Provider>
  );
}

test('initial step renders select snapshot', () => {
  renderModal();
  expect(screen.getByText('select')).toBeInTheDocument();
});

import { waitFor } from '@testing-library/react';

test('moves to next step on select', async () => {
  renderModal();
  fireEvent.click(screen.getByText('select'));
  await waitFor(() => expect(screen.getByTestId('exclude')).toBeInTheDocument());
});

jest.mock('../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotExcludeComponentWinners', () => ({
  __esModule: true,
  default: () => <div data-testid="exclude-winners" />,
}));

jest.mock('../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotSelectTokenIds', () => ({
  __esModule: true,
  default: () => <div data-testid="token-ids" />,
}));

function renderWithContext(ctx: any) {
  return render(
    <DistributionPlanToolContext.Provider value={ctx}>
      <BuildPhaseFormConfigModal name="g" description="d" selectedPhase={{ id: 'p', components: ctx.phaseComponents ?? [] }} phases={[{ id: 'p', components: ctx.phaseComponents ?? [] }]} onClose={jest.fn()} />
    </DistributionPlanToolContext.Provider>
  );
}

test('select snapshot goes to exclude winners when single snapshot with components', async () => {
  const ctx = { ...contextValue, operations: [{ code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '1', name: 'A' } }], phaseComponents: [{}] } as any;
  renderWithContext(ctx);
  fireEvent.click(screen.getByText('select'));
  await screen.findByTestId('exclude-winners');
});

test('select snapshot skips to token ids when no components', async () => {
  const ctx = { ...contextValue, operations: [{ code: AllowlistOperationCode.CREATE_TOKEN_POOL, params: { id: '1', name: 'A' } }], phaseComponents: [] } as any;
  renderWithContext(ctx);
  fireEvent.click(screen.getByText('select'));
  await screen.findByTestId('token-ids');
});
