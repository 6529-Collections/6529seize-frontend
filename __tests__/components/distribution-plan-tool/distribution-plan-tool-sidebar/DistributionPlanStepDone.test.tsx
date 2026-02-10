import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DistributionPlanStepDone from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepDone';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

const step = { label: 'Review', description: 'desc', key: DistributionPlanToolStep.REVIEW, order: 5 } as any;

describe('DistributionPlanStepDone', () => {
  it('calls context setStep when clicked', () => {
    const setStep = jest.fn();
    render(
      <DistributionPlanToolContext.Provider value={{ setStep } as any}>
        <DistributionPlanStepDone step={step} />
      </DistributionPlanToolContext.Provider>
    );
    fireEvent.click(screen.getByText('Review'));
    expect(setStep).toHaveBeenCalledWith(DistributionPlanToolStep.REVIEW);
  });

  it('hides connector on last step', () => {
    const { container } = render(
      <DistributionPlanToolContext.Provider value={{ setStep: jest.fn() } as any}>
        <DistributionPlanStepDone step={{ ...step, order: 6 }} />
      </DistributionPlanToolContext.Provider>
    );
    expect(container.querySelector('div.tw-absolute')).toBeNull();
  });
});
