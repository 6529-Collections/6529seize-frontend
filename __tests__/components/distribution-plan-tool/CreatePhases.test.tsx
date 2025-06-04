import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreatePhases from '../../../components/distribution-plan-tool/create-phases/CreatePhases';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('../../../components/distribution-plan-tool/common/StepHeader', () => () => <div data-testid="header" />);
jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => ({ children }: any) => <div>{children}</div>);
jest.mock('../../../components/distribution-plan-tool/create-phases/form/CreatePhasesForm', () => () => <div data-testid="form" />);
jest.mock('../../../components/distribution-plan-tool/create-phases/table/CreatePhasesTable', () => ({ phases }: any) => <div data-testid="table">{phases.length}</div>);
jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanNextStepBtn', () => ({ onNextStep, showNextBtn }: any) => (
  <button data-testid="next" onClick={onNextStep}>{showNextBtn && 'next'}</button>
));
jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder', () => ({ title }: any) => <div data-testid="empty">{title}</div>);

describe('CreatePhases', () => {
  function renderWithOps(operations: any[], setStep = jest.fn()) {
    return {
      setStep,
      ...render(
        <DistributionPlanToolContext.Provider value={{ operations, setStep } as any}>
          <CreatePhases />
        </DistributionPlanToolContext.Provider>
      )
    };
  }

  it('shows table and allows advancing when phases exist', () => {
    const ops = [{
      code: AllowlistOperationCode.ADD_PHASE,
      params: { id: 'p1', name: 'Phase1', description: '' },
      hasRan: false,
      order: 1,
      allowlistId: 'a'
    }];
    const { setStep } = renderWithOps(ops);
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
    const btn = screen.getByTestId('next');
    expect(btn).toHaveTextContent('next');
    fireEvent.click(btn);
    expect(setStep).toHaveBeenCalledWith(DistributionPlanToolStep.BUILD_PHASES);
  });

  it('shows placeholder and hides next when no phases', () => {
    renderWithOps([]);
    expect(screen.getByTestId('empty')).toHaveTextContent('No Phases Added');
    expect(screen.getByTestId('next')).toHaveTextContent('');
  });
});
