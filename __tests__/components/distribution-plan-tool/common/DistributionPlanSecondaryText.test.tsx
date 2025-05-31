import { render, screen } from '@testing-library/react';
import React from 'react';
import DistributionPlanSecondaryText from '../../../../components/distribution-plan-tool/common/DistributionPlanSecondaryText';

describe('DistributionPlanSecondaryText', () => {
  it('renders children inside paragraph', () => {
    render(<DistributionPlanSecondaryText>Hint</DistributionPlanSecondaryText>);
    const p = screen.getByText('Hint');
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('tw-mb-0 tw-block tw-font-light tw-text-sm tw-text-neutral-400');
  });
});
