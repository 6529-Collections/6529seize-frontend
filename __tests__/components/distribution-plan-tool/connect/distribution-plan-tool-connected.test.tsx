import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanToolConnected from '@/components/distribution-plan-tool/connect/distribution-plan-tool-connected';
import { renderWithAuth } from '@/__tests__/utils/testContexts';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

const { useRouter } = require('next/navigation');

describe('DistributionPlanToolConnected', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('calls requestAuth and redirects on success', async () => {
    const requestAuth = jest.fn(async () => ({ success: true }));
    renderWithAuth(<DistributionPlanToolConnected />, { requestAuth });
    await userEvent.click(screen.getByRole('button', { name: /sign in with web3/i }));
    expect(requestAuth).toHaveBeenCalled();
    expect(useRouter().push).toHaveBeenCalledWith('/emma/plans');
  });

  it('does not redirect when auth fails', async () => {
    const requestAuth = jest.fn(async () => ({ success: false }));
    renderWithAuth(<DistributionPlanToolConnected />, { requestAuth });
    await userEvent.click(screen.getByRole('button', { name: /sign in with web3/i }));
    expect(useRouter().push).not.toHaveBeenCalled();
  });
});
