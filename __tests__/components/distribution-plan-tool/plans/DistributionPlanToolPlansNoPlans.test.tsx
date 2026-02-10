import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanToolPlansNoPlans from '@/components/distribution-plan-tool/plans/DistributionPlanToolPlansNoPlans';

describe('DistributionPlanToolPlansNoPlans', () => {
  it('renders the no plans message', () => {
    render(<DistributionPlanToolPlansNoPlans />);
    expect(screen.getByText('No plan')).toBeInTheDocument();
    expect(
      screen.getByText('Get started by creating a new distribution plan.')
    ).toBeInTheDocument();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
