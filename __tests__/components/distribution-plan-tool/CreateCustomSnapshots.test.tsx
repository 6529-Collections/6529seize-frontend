import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateCustomSnapshots from '@/components/distribution-plan-tool/create-custom-snapshots/CreateCustomSnapshots';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('@/components/distribution-plan-tool/create-custom-snapshots/table/CreateCustomSnapshotTable', () => ({ customSnapshots }: any) => <div data-testid="table">{customSnapshots.length}</div>);
jest.mock('@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotForm', () => () => <div data-testid="form" />);
jest.mock('@/components/distribution-plan-tool/common/StepHeader', () => () => <div data-testid="header" />);
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanNextStepBtn', () => ({ showNextBtn, showSkipBtn }: any) => <div data-testid="next">{showNextBtn && 'next'}{showSkipBtn && 'skip'}</div>);
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder', () => ({ title }: any) => <div data-testid="empty">{title}</div>);
jest.mock('@/components/allowlist-tool/icons/AllowlistToolCsvIcon', () => () => <svg data-testid="csv" />);

describe('CreateCustomSnapshots', () => {
  it('redirects to create plan when distribution plan is missing', () => {
    const setStep = jest.fn();
    render(
      <DistributionPlanToolContext.Provider value={{ distributionPlan: null, setStep, operations: [] } as any}>
        <CreateCustomSnapshots />
      </DistributionPlanToolContext.Provider>
    );
    expect(setStep).toHaveBeenCalledWith(DistributionPlanToolStep.CREATE_PLAN);
  });

  it('renders table when custom snapshot operations exist', () => {
    const ops = [
      {
        code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
        params: { id: 'c1', name: 'snap', description: '', tokens: [{ owner: '0x1' }] },
      },
    ];
    render(
      <DistributionPlanToolContext.Provider value={{ distributionPlan: { id: '1' }, setStep: jest.fn(), operations: ops } as any}>
        <CreateCustomSnapshots />
      </DistributionPlanToolContext.Provider>
    );
    expect(screen.getByTestId('table')).toHaveTextContent('1');
    expect(screen.getByTestId('next')).toHaveTextContent('next');
  });
});
