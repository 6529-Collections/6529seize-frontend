import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanToolNotConnected from '../../../../components/distribution-plan-tool/connect/distribution-plan-tool-not-connected';

describe('DistributionPlanToolNotConnected', () => {
  it('renders headings and explanatory text', () => {
    render(<DistributionPlanToolNotConnected />);

    expect(screen.getByRole('heading', { level: 1, name: 'EMMA' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /connect your wallet/i })).toBeInTheDocument();
    expect(
      screen.getByText(/connect with an address from within your consolidated account/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/no gas is needed to sign in/i)).toBeInTheDocument();
  });
});
