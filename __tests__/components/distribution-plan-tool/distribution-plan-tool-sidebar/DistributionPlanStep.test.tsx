import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepDone', () => (props: any) => <div data-testid="done">{props.step.label}</div>);
jest.mock('@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepCurrent', () => (props: any) => <div data-testid="current">{props.step.label}</div>);
jest.mock('@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepUpcoming', () => (props: any) => <div data-testid="upcoming">{props.step.label}</div>);

import DistributionPlanStep from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStep';
import { DistributionPlanStepDescription } from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar';

const step: DistributionPlanStepDescription = { label: 'A', description: 'B', key: 1 as any, order: 1 };

it('renders correct status component', () => {
  const { rerender } = render(<DistributionPlanStep step={step} activeStepOrder={0} />);
  expect(screen.getByTestId('upcoming')).toBeInTheDocument();
  rerender(<DistributionPlanStep step={step} activeStepOrder={1} />);
  expect(screen.getByTestId('current')).toBeInTheDocument();
  rerender(<DistributionPlanStep step={step} activeStepOrder={2} />);
  expect(screen.getByTestId('done')).toBeInTheDocument();
});
