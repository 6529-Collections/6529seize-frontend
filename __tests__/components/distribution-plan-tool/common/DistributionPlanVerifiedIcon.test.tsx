import { render } from '@testing-library/react';
import React from 'react';
import DistributionPlanVerifiedIcon from '@/components/distribution-plan-tool/common/DistributionPlanVerifiedIcon';

describe('DistributionPlanVerifiedIcon', () => {
  it('renders SVG with two paths', () => {
    const { container } = render(<DistributionPlanVerifiedIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('tw-h-4 tw-w-4');
    expect(svg?.querySelectorAll('path')).toHaveLength(2);
  });
});
