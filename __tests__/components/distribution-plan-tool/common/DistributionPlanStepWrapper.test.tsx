import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanStepWrapper from '../../../../components/distribution-plan-tool/common/DistributionPlanStepWrapper';

describe('DistributionPlanStepWrapper', () => {
  it('renders children inside wrapper with expected classes', () => {
    render(
      <DistributionPlanStepWrapper>
        <span data-testid="child" />
      </DistributionPlanStepWrapper>
    );
    const wrapper = screen.getByTestId('child').parentElement as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass(
      'tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700/60 tw-mx-auto'
    );
  });
});
