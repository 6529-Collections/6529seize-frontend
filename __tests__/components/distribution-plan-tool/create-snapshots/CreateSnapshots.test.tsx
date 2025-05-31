import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CreateSnapshots from '../../../../components/distribution-plan-tool/create-snapshots/CreateSnapshots';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode, DistributionPlanTokenPoolDownloadStatus } from '../../../../components/allowlist-tool/allowlist-tool.types';

// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/create-snapshots/table/CreateSnapshotTable', () => ({ snapshots }: any) => <div data-testid="table">{snapshots.length}</div>);
// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotForm', () => () => <div data-testid="form" />);
// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/common/StepHeader', () => () => <div data-testid="header" />);
// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/common/DistributionPlanNextStepBtn', () => ({ showNextBtn, showRunAnalysisBtn }: any) => <div data-testid="next">{showNextBtn && 'next'}{showRunAnalysisBtn && 'run'}</div>);
// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => ({ children }: any) => <div>{children}</div>);
// eslint-disable-next-line react/display-name
jest.mock('../../../../components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder', () => ({ title }: any) => <div data-testid="empty">{title}</div>);

jest.mock('react-use', () => ({ useInterval: jest.fn() }));

jest.mock('../../../../services/distribution-plan-api', () => ({
  distributionPlanApiFetch: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('CreateSnapshots', () => {
  it('redirects to create plan when distribution plan is missing', async () => {
    const setStep = jest.fn();
    await act(async () => {
      render(
        <DistributionPlanToolContext.Provider value={{ distributionPlan: null, setStep, operations: [] } as any}>
          <CreateSnapshots />
        </DistributionPlanToolContext.Provider>
      );
    });
    expect(setStep).toHaveBeenCalledWith(DistributionPlanToolStep.CREATE_PLAN);
  });

  it('renders table when snapshot operations exist', async () => {
    const operations = [
      {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        hasRan: false,
        params: { id: '1', name: 'snap', description: '', contract: '0x1', blockNo: 1 },
      },
    ];
    const tokenPools = [
      {
        id: '1',
        allowlistId: 'a1',
        name: 'tok',
        description: '',
        walletsCount: 1,
        tokensCount: 2,
      },
    ];
    await act(async () => {
      render(
        <DistributionPlanToolContext.Provider value={{ distributionPlan: { id: 'a1' }, setStep: jest.fn(), operations, tokenPools } as any}>
          <CreateSnapshots />
        </DistributionPlanToolContext.Provider>
      );
    });
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });

  it('shows placeholder when no snapshot operations', async () => {
    await act(async () => {
      render(
        <DistributionPlanToolContext.Provider value={{ distributionPlan: { id: 'p' }, setStep: jest.fn(), operations: [], tokenPools: [] } as any}>
          <CreateSnapshots />
        </DistributionPlanToolContext.Provider>
      );
    });
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });
});
