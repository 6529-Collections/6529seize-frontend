import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanStepUpcoming from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepUpcoming';
import { DISTRIBUTION_PLAN_STEPS } from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar';

describe('DistributionPlanStepUpcoming', () => {
  it('shows connector when not last step', () => {
    const step = Object.values(DISTRIBUTION_PLAN_STEPS)[0];
    render(<ul><DistributionPlanStepUpcoming step={step} /></ul>);
    expect(screen.getByRole('listitem').firstChild).toHaveClass('tw-absolute');
  });

  it('hides connector for last step', () => {
    const step = Object.values(DISTRIBUTION_PLAN_STEPS).at(-1)!;
    render(<ul><DistributionPlanStepUpcoming step={step} /></ul>);
    expect(screen.queryByRole('listitem')?.firstChild).not.toHaveClass('tw-absolute');
  });
});
