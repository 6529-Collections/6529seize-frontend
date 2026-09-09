import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanStepUpcoming from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepUpcoming';
import type { DistributionPlanStepDescription } from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar';
import { DistributionPlanToolStep } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

describe('DistributionPlanStepUpcoming', () => {
  it('shows connector when not last step', () => {
    const step = {
      label: 'Create Plan',
      description: 'Create a new distribution plan',
      key: DistributionPlanToolStep.CREATE_PLAN,
      order: 0,
    } satisfies DistributionPlanStepDescription;
    render(<ul><DistributionPlanStepUpcoming step={step} /></ul>);
    expect(screen.getByRole('listitem').firstChild).toHaveClass('tw-absolute');
  });

  it('hides connector for last step', () => {
    const step = {
      label: 'Review',
      description: 'Review the distribution plan',
      key: DistributionPlanToolStep.REVIEW,
      order: 6,
    } satisfies DistributionPlanStepDescription;
    render(<ul><DistributionPlanStepUpcoming step={step} /></ul>);
    expect(screen.queryByRole('listitem')?.firstChild).not.toHaveClass('tw-absolute');
  });
});
