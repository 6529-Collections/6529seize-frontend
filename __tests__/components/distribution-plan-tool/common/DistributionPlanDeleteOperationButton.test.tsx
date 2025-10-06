import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanDeleteOperationButton from '@/components/distribution-plan-tool/common/DistributionPlanDeleteOperationButton';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiDelete } from '@/services/distribution-plan-api';

jest.mock('@/services/distribution-plan-api');

const mockedDelete = distributionPlanApiDelete as jest.Mock;

function renderButton(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const runOperations = jest.fn();
  const contextValue = { runOperations, ...(ctx || {}) } as any;
  render(
    <DistributionPlanToolContext.Provider value={contextValue}>
      <DistributionPlanDeleteOperationButton allowlistId="a1" order={2} />
    </DistributionPlanToolContext.Provider>
  );
  return { runOperations };
}

describe('DistributionPlanDeleteOperationButton', () => {
  beforeEach(() => {
    mockedDelete.mockReset();
  });

  it('calls api and runOperations on success', async () => {
    mockedDelete.mockResolvedValue({ success: true });
    const { runOperations } = renderButton();
    await userEvent.click(screen.getByRole('button'));
    expect(mockedDelete).toHaveBeenCalledWith({ endpoint: '/allowlists/a1/operations/2' });
    await waitFor(() => expect(runOperations).toHaveBeenCalled());
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('does not run operations on failure', async () => {
    mockedDelete.mockResolvedValue({ success: false });
    const { runOperations } = renderButton();
    await userEvent.click(screen.getByRole('button'));
    expect(mockedDelete).toHaveBeenCalled();
    await waitFor(() => expect(runOperations).not.toHaveBeenCalled());
  });
});
