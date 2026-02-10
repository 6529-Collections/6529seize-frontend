import { render, screen } from '@testing-library/react';
import React from 'react';
import DistributionPlanWarnings from '@/components/distribution-plan-tool/common/DistributionPlanWarnings';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistRunStatus } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('@/components/distribution-plan-tool/common/DistributionPlanErrorWarning', () => ({
  __esModule: true,
  default: () => <div data-testid="error-warning" />,
}));

describe('DistributionPlanWarnings', () => {
  function renderWith(status: AllowlistRunStatus | undefined) {
    const value = {
      operations: [],
      distributionPlan: status ? { activeRun: { status } } : null,
    } as any;
    return render(
      <DistributionPlanToolContext.Provider value={value}>
        <DistributionPlanWarnings />
      </DistributionPlanToolContext.Provider>
    );
  }

  it('shows error warning when run failed', () => {
    renderWith(AllowlistRunStatus.FAILED);
    expect(screen.getByTestId('error-warning')).toBeInTheDocument();
  });

  it('does not show warning when run succeeded', () => {
    renderWith(AllowlistRunStatus.CLAIMED);
    expect(screen.queryByTestId('error-warning')).toBeNull();
  });
});
