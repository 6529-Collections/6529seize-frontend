import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DistributionPlanErrorWarning from '@/components/distribution-plan-tool/common/DistributionPlanErrorWarning';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

describe('DistributionPlanErrorWarning', () => {
  it('displays error reason and reruns analysis when button clicked', () => {
    const runOperations = jest.fn();
    const value = {
      distributionPlan: { activeRun: { errorReason: 'Something went wrong' } },
      runOperations,
    } as any;
    render(
      <DistributionPlanToolContext.Provider value={value}>
        <DistributionPlanErrorWarning />
      </DistributionPlanToolContext.Provider>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Run Analysis'));
    expect(runOperations).toHaveBeenCalled();
  });
});
