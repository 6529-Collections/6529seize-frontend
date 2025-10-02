import { render, screen } from '@testing-library/react';
import DistributionPlanToolNotConnected from '@/components/distribution-plan-tool/connect/distribution-plan-tool-not-connected';

describe('DistributionPlanToolNotConnected', () => {
  it('shows headings prompting user to connect', () => {
    render(<DistributionPlanToolNotConnected />);
    expect(screen.getByRole('heading', { level: 1, name: /EMMA/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Connect Your Wallet/i })).toBeInTheDocument();
  });

  it('displays explanatory paragraphs', () => {
    render(<DistributionPlanToolNotConnected />);
    expect(screen.getByText(/Connect with an address/)).toBeInTheDocument();
    expect(screen.getByText(/No gas is needed to sign in/)).toBeInTheDocument();
  });
});
