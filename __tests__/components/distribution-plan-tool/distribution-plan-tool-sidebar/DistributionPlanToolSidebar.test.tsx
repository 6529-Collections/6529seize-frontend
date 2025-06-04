import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanToolSidebar, { DISTRIBUTION_PLAN_STEPS } from '../../../../components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';

jest.mock('../../../../components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStep', () => (p: any) => <li data-testid="step" data-order={p.activeStepOrder}>{p.step.label}</li>);

describe('DistributionPlanToolSidebar', () => {
  const wrapper = ({ step, children }: any) => (
    <DistributionPlanToolContext.Provider value={{ step, setStep: jest.fn() } as any}>
      {children}
    </DistributionPlanToolContext.Provider>
  );

  it('renders all steps with active order', () => {
    render(<DistributionPlanToolSidebar />, { wrapper: ({ children }) => wrapper({ step: DistributionPlanToolStep.MAP_DELEGATIONS, children }) });
    const items = screen.getAllByTestId('step');
    expect(items).toHaveLength(Object.keys(DISTRIBUTION_PLAN_STEPS).length);
    items.forEach((item) => {
      expect(item).toHaveAttribute('data-order', DISTRIBUTION_PLAN_STEPS[DistributionPlanToolStep.MAP_DELEGATIONS].order.toString());
    });
  });
});
