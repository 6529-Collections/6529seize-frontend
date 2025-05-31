import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapDelegations from '../../../../components/distribution-plan-tool/map-delegations/MapDelegations';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '../../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('../../../../components/distribution-plan-tool/common/StepHeader', () => ({ step }: any) => <div data-testid="header">{step}</div>);
jest.mock('../../../../components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);
jest.mock('../../../../components/distribution-plan-tool/map-delegations/MapDelegationsForm', () => () => <div data-testid="form" />);
jest.mock('../../../../components/distribution-plan-tool/map-delegations/MapDelegationsDone', () => ({ contract }: any) => <div data-testid="done">{contract}</div>);
jest.mock('../../../../components/distribution-plan-tool/common/DistributionPlanNextStepBtn', () => ({ showRunAnalysisBtn, showNextBtn, showSkipBtn, onNextStep }: any) => (
  <button data-testid="next" onClick={onNextStep}>
    {showRunAnalysisBtn && 'run'}{showNextBtn && 'next'}{showSkipBtn && 'skip'}
  </button>
));

function renderComponent(operations: any[]) {
  const setStep = jest.fn();
  return {
    setStep,
    ...render(
      <DistributionPlanToolContext.Provider value={{ operations, setStep } as any}>
        <MapDelegations />
      </DistributionPlanToolContext.Provider>
    )
  };
}

describe('MapDelegations', () => {
  it('shows done and next when contract exists and operations ran', () => {
    const ops = [
      { code: AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS, params: { delegationContract: '0xABC' }, hasRan: true }
    ];
    const { setStep } = renderComponent(ops);
    expect(screen.getByTestId('done')).toHaveTextContent('0xABC');
    const btn = screen.getByTestId('next');
    expect(btn).toHaveTextContent('next');
    fireEvent.click(btn);
    expect(setStep).toHaveBeenCalledWith(DistributionPlanToolStep.REVIEW);
  });

  it('shows run analysis when operations have not run', () => {
    const ops = [
      { code: AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS, params: { delegationContract: '0xDEF' }, hasRan: false }
    ];
    renderComponent(ops);
    expect(screen.getByTestId('done')).toHaveTextContent('0xDEF');
    expect(screen.getByTestId('next')).toHaveTextContent('run');
  });

  it('shows form and skip when no contract', () => {
    const ops: any[] = [];
    renderComponent(ops);
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByTestId('next')).toHaveTextContent('skip');
  });
});
