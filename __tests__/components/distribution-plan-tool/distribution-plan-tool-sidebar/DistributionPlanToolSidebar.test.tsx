import React from 'react';
import { render, screen, within } from '@testing-library/react';
import DistributionPlanToolSidebar from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

jest.mock('@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStep', () => (p: any) => <li data-testid="step" data-order={p.activeStepOrder}>{p.step.label}</li>);

describe('DistributionPlanToolSidebar', () => {
  const expectedStepLabels = [
    'Create Plan',
    'Create Snapshots',
    'Create Custom Snapshot',
    'Create Phases',
    'Build Phases',
    'Map Delegations',
    'Review',
  ];

  const wrapper = ({ step, children }: any) => (
    <DistributionPlanToolContext.Provider value={{ step, setStep: jest.fn() } as any}>
      {children}
    </DistributionPlanToolContext.Provider>
  );

  it('renders all steps with active order', () => {
    render(<DistributionPlanToolSidebar />, { wrapper: ({ children }) => wrapper({ step: DistributionPlanToolStep.MAP_DELEGATIONS, children }) });
    const activeStepOrder = expectedStepLabels.indexOf('Map Delegations').toString();
    const progressNavigations = screen.getAllByRole('navigation', { name: 'Progress' });

    expect(progressNavigations).toHaveLength(2);
    progressNavigations.forEach((navigation) => {
      const items = within(navigation).getAllByTestId('step');
      expect(items.map((item) => item.textContent)).toEqual(expectedStepLabels);
      items.forEach((item) => {
        expect(item).toHaveAttribute('data-order', activeStepOrder);
      });
    });
  });
});
