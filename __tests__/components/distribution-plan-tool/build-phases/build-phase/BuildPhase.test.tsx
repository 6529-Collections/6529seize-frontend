import React from 'react';
import { render, screen } from '@testing-library/react';
import BuildPhase from '../../../../../components/distribution-plan-tool/build-phases/build-phase/BuildPhase';
import { BuildPhasesPhase } from '../../../../../components/distribution-plan-tool/build-phases/BuildPhases';

jest.mock('../../../../../components/distribution-plan-tool/common/StepHeader', () => ({ title }: any) => <div data-testid="header">{title}</div>);
jest.mock('../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseForm', () => ({ selectedPhase }: any) => <div data-testid="form">{selectedPhase.name}</div>);
jest.mock('../../../../../components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);
jest.mock('../../../../../components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTable', () => ({ phase }: any) => <div data-testid="table">{phase.id}</div>);
jest.mock('../../../../../components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder', () => ({ title }: any) => <div data-testid="placeholder">{title}</div>);
jest.mock('../../../../../components/distribution-plan-tool/common/DistributionPlanNextStepBtn', () => ({ showRunAnalysisBtn, showNextBtn }: any) => <div data-testid="next">{showNextBtn && 'next'}{showRunAnalysisBtn && 'run'}</div>);

const phases: BuildPhasesPhase[] = [
  {
    id: 'phase1',
    allowlistId: 'a1',
    name: 'Phase 1',
    description: '',
    hasRan: true,
    order: 1,
    components: [
      { id: 'c1', allowlistId: 'a1', name: 'Comp', description: '', spotsNotRan: false, spots: 3, order: 1 },
    ],
  },
  {
    id: 'phase2',
    allowlistId: 'a1',
    name: 'Phase 2',
    description: '',
    hasRan: false,
    order: 2,
    components: [],
  },
];

describe('BuildPhase', () => {
  it('renders table and hides run analysis when components have ran', () => {
    render(<BuildPhase selectedPhase={phases[0]} phases={phases} onNextStep={jest.fn()} />);

    expect(screen.getByTestId('header')).toHaveTextContent('Phase 1 - 1/2');
    expect(screen.getByTestId('form')).toHaveTextContent('Phase 1');
    expect(screen.getByTestId('table')).toHaveTextContent('phase1');
    expect(screen.queryByTestId('placeholder')).toBeNull();
    expect(screen.getByTestId('next')).toHaveTextContent('next');
    expect(screen.getByTestId('next')).not.toHaveTextContent('run');
  });

  it('renders placeholder and disables next when no components', () => {
    render(<BuildPhase selectedPhase={phases[1]} phases={phases} onNextStep={jest.fn()} />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('No Collection Groups Added');
    expect(screen.getByTestId('next')).not.toHaveTextContent('next');
  });

  it('shows run analysis button when any component has not ran', () => {
    const modified = { ...phases[0], components: [{ ...phases[0].components[0], spotsNotRan: true }] };
    render(<BuildPhase selectedPhase={modified} phases={phases} onNextStep={jest.fn()} />);

    expect(screen.getByTestId('next')).toHaveTextContent('run');
  });
});
