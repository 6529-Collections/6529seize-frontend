import { render, screen } from '@testing-library/react';
import React from 'react';
import DistributionPlanStepCurrent from '@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanStepCurrent';

describe('DistributionPlanStepCurrent', () => {
  const baseStep = {
    label: 'Step Label',
    description: 'Step Description',
    key: 'ANY',
    order: 1,
  } as any;

  it('renders connector line when not last step', () => {
    render(<DistributionPlanStepCurrent step={baseStep} />);
    expect(screen.getByText('Step Label')).toBeInTheDocument();
    expect(screen.getByText('Step Description')).toBeInTheDocument();
    // line div is present
    expect(document.querySelector('div.tw-absolute')).not.toBeNull();
  });

  it('omits connector line for last step', () => {
    const lastStep = { ...baseStep, order: 6 };
    render(<DistributionPlanStepCurrent step={lastStep} />);
    // line div should not be present
    expect(document.querySelector('div.tw-absolute')).toBeNull();
  });
});
