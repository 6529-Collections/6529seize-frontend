import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuildPhases from '../../../../components/distribution-plan-tool/build-phases/BuildPhases';
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '../../../../components/allowlist-tool/allowlist-tool.types';

// Mock child BuildPhase component to simplify rendering and expose props
jest.mock(
  '../../../../components/distribution-plan-tool/build-phases/build-phase/BuildPhase',
  () => ({ selectedPhase, phases, onNextStep }: any) => (
    <div data-testid="mock-build-phase">
      <div data-testid="phase-name">{selectedPhase.name}</div>
      <div data-testid="phases-count">{phases.length}</div>
      <button onClick={onNextStep}>next</button>
    </div>
  )
);

const defaultContext = {
  step: DistributionPlanToolStep.BUILD_PHASES,
  setStep: jest.fn(),
  fetching: false,
  runOperations: jest.fn(),
  operations: [] as any[],
  fetchOperations: jest.fn(),
  setState: jest.fn(),
  distributionPlan: { id: 'allowlist', name: '', description: '', createdAt: 0 } as any,
  transferPools: [],
  setTransferPools: jest.fn(),
  tokenPools: [],
  setTokenPools: jest.fn(),
  customTokenPools: [],
  setCustomTokenPools: jest.fn(),
  phases: [] as any[],
  setPhases: jest.fn(),
  setToasts: jest.fn(),
};

function renderComponent(ctx?: Partial<typeof defaultContext>) {
  return render(
    <DistributionPlanToolContext.Provider value={{ ...defaultContext, ...ctx }}>
      <BuildPhases />
    </DistributionPlanToolContext.Provider>
  );
}

describe('BuildPhases', () => {
  const operations = [
    {
      id: 'op-phase1',
      code: AllowlistOperationCode.ADD_PHASE,
      allowlistId: '1',
      order: 1,
      createdAt: 0,
      hasRan: true,
      params: { id: 'phase1', name: 'Phase 1', description: '' },
    },
    {
      id: 'op-comp1',
      code: AllowlistOperationCode.ADD_COMPONENT,
      allowlistId: '1',
      order: 2,
      createdAt: 0,
      hasRan: true,
      params: { id: 'comp1', phaseId: 'phase1', name: 'Comp1', description: '' },
    },
    {
      id: 'op-spot1',
      code: AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
      allowlistId: '1',
      order: 3,
      createdAt: 0,
      hasRan: false,
      params: { componentId: 'comp1' },
    },
    {
      id: 'op-phase2',
      code: AllowlistOperationCode.ADD_PHASE,
      allowlistId: '1',
      order: 4,
      createdAt: 0,
      hasRan: false,
      params: { id: 'phase2', name: 'Phase 2', description: '' },
    },
    {
      id: 'op-comp2',
      code: AllowlistOperationCode.ADD_COMPONENT,
      allowlistId: '1',
      order: 5,
      createdAt: 0,
      hasRan: true,
      params: { id: 'comp2', phaseId: 'phase2', name: 'Comp2', description: '' },
    },
  ];

  const phases = [
    {
      id: 'phase1',
      allowlistId: '1',
      name: 'Phase 1',
      description: '',
      insertionOrder: 1,
      walletsCount: 0,
      tokensCount: 0,
      winnersWalletsCount: 0,
      winnersSpotsCount: 5,
      components: [
        {
          id: 'comp1',
          allowlistId: '1',
          phaseId: 'phase1',
          insertionOrder: 1,
          name: 'Comp1',
          description: '',
          walletsCount: 0,
          tokensCount: 0,
          winnersWalletsCount: 0,
          winnersSpotsCount: 5,
          items: [],
        },
      ],
    },
    {
      id: 'phase2',
      allowlistId: '1',
      name: 'Phase 2',
      description: '',
      insertionOrder: 2,
      walletsCount: 0,
      tokensCount: 0,
      winnersWalletsCount: 0,
      winnersSpotsCount: 2,
      components: [
        {
          id: 'comp2',
          allowlistId: '1',
          phaseId: 'phase2',
          insertionOrder: 1,
          name: 'Comp2',
          description: '',
          walletsCount: 0,
          tokensCount: 0,
          winnersWalletsCount: 0,
          winnersSpotsCount: 2,
          items: [],
        },
      ],
    },
  ];

  it('renders first phase from operations', () => {
    renderComponent({ operations, phases });
    expect(screen.getByTestId('phase-name')).toHaveTextContent('Phase 1');
    expect(screen.getByTestId('phases-count')).toHaveTextContent('2');
  });

  it('moves to next phase when onNextStep is invoked', async () => {
    renderComponent({ operations, phases });
    await screen.findByText('Phase 1');
    await userEvent.click(screen.getByText('next'));
    await screen.findByText('Phase 2');
    expect(screen.getByTestId('phase-name')).toHaveTextContent('Phase 2');
  });

  it('runs pending operations and sets next step after last phase', async () => {
    const setStep = jest.fn();
    const runOperations = jest.fn();
    renderComponent({ operations, phases, setStep, runOperations });
    await screen.findByText('Phase 1');
    await userEvent.click(screen.getByText('next')); // move to second
    await screen.findByText('Phase 2');
    await userEvent.click(screen.getByText('next')); // finish
    expect(runOperations).toHaveBeenCalled();
    expect(setStep).toHaveBeenCalledWith(
      DistributionPlanToolStep.MAP_DELEGATIONS
    );
  });
});

