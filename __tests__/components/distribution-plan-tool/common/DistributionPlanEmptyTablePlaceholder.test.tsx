import { render, screen } from '@testing-library/react';
import React from 'react';
import DistributionPlanEmptyTablePlaceholder from '@/components/distribution-plan-tool/common/DistributionPlanEmptyTablePlaceholder';

describe('DistributionPlanEmptyTablePlaceholder', () => {
  const title = 'No Data';
  const description = 'Please add items to see them here.';

  it('renders title and description', () => {
    render(<DistributionPlanEmptyTablePlaceholder title={title} description={description} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('contains svg with expected attributes', () => {
    const { container } = render(
      <DistributionPlanEmptyTablePlaceholder title={title} description={description} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('stroke', 'currentColor');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
  });
});
