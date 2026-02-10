import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanStepWrapper from '@/components/distribution-plan-tool/common/DistributionPlanStepWrapper';

const CHILD_TEXT = 'wrapped content';

function renderWrapper() {
  return render(
    <DistributionPlanStepWrapper>
      <span>{CHILD_TEXT}</span>
    </DistributionPlanStepWrapper>
  );
}

describe('DistributionPlanStepWrapper', () => {
  it('renders children inside wrapper', () => {
    renderWrapper();
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it('applies styling classes to wrapper', () => {
    const { container } = renderWrapper();
    const div = container.firstElementChild as HTMLElement;
    expect(div.tagName).toBe('DIV');
    expect(div.className).toContain('tw-mt-8');
    expect(div.className).toContain('tw-pt-8');
    expect(div.className).toContain('tw-border-t');
    expect(div.className).toContain('tw-border-solid');
    expect(div.className).toContain('tw-border-t-iron-700/60');
    expect(div.className).toContain('tw-mx-auto');
  });
});
