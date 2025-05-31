import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MapDelegationsForm from '../../../../components/distribution-plan-tool/map-delegations/MapDelegationsForm';
import { DistributionPlanToolContext } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiPost } from '../../../../services/distribution-plan-api';
import { AllowlistOperationCode } from '../../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('../../../../services/distribution-plan-api', () => ({
  distributionPlanApiPost: jest.fn(),
}));

function renderComponent(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = {
    distributionPlan: { id: 'plan1', name: '', description: '', createdAt: 0 } as any,
    fetchOperations: jest.fn(),
    setToasts: jest.fn(),
  } as any;

  return {
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <MapDelegationsForm />
      </DistributionPlanToolContext.Provider>
    ),
    fetchOperations: ctx?.fetchOperations || defaultCtx.fetchOperations,
    distributionPlan: ctx?.distributionPlan ?? defaultCtx.distributionPlan,
  };
}

describe('MapDelegationsForm', () => {
  beforeEach(() => {
    (distributionPlanApiPost as jest.Mock).mockReset();
  });

  it('posts delegation and refreshes operations', async () => {
    let resolvePromise: (value: any) => void = () => {};
    (distributionPlanApiPost as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    const { fetchOperations, distributionPlan } = renderComponent();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0xABC' } });
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(distributionPlanApiPost).toHaveBeenCalledWith({
      endpoint: `/allowlists/${distributionPlan.id}/operations`,
      body: {
        code: AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS,
        params: { delegationContract: '0xabc' },
      },
    });
    expect(button).toBeDisabled();
    resolvePromise({ success: true, data: {} });
    await waitFor(() => expect(fetchOperations).toHaveBeenCalledWith(distributionPlan.id));
    expect(button).not.toBeDisabled();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('does nothing without distribution plan', async () => {
    renderComponent({ distributionPlan: null, fetchOperations: jest.fn() });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0xabc' } });
    fireEvent.click(screen.getByRole('button', { name: /Add contract/i }));
    expect(distributionPlanApiPost).not.toHaveBeenCalled();
  });
});
