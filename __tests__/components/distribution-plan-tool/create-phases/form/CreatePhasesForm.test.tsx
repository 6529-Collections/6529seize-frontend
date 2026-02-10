jest.mock('@/services/distribution-plan-api');
jest.mock('@/helpers/AllowlistToolHelpers', () => {
  const actual = jest.requireActual('../../../../../helpers/AllowlistToolHelpers');
  return { __esModule: true, ...actual, getRandomObjectId: jest.fn(() => 'phase-1') };
});
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn', () => ({ children, loading }: any) => (
  <button type="submit" disabled={loading}>{children}</button>
));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePhasesForm from '@/components/distribution-plan-tool/create-phases/form/CreatePhasesForm';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiPost } from '@/services/distribution-plan-api';
import { AllowlistOperationCode } from '@/components/allowlist-tool/allowlist-tool.types';

function renderForm(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = { distributionPlan: { id: 'dp1' }, fetchOperations: jest.fn(), setToasts: jest.fn() } as any;
  return {
    ctx: { ...defaultCtx, ...ctx },
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <CreatePhasesForm />
      </DistributionPlanToolContext.Provider>
    )
  };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('CreatePhasesForm', () => {
  it('submits phase and resets input on success', async () => {
    (distributionPlanApiPost as jest.Mock).mockResolvedValue({ success: true, data: {} });
    const { ctx } = renderForm();
    const input = screen.getByPlaceholderText('Name of Phase');
    await userEvent.type(input, 'Phase 1');
    await userEvent.click(screen.getByRole('button', { name: /add phase/i }));
    await waitFor(() => expect(distributionPlanApiPost).toHaveBeenCalled());
    const call = (distributionPlanApiPost as jest.Mock).mock.calls[0][0];
    expect(call).toEqual(expect.objectContaining({
      endpoint: '/allowlists/dp1/operations'
    }));
    expect(call.body.code).toBe(AllowlistOperationCode.ADD_PHASE);
    await waitFor(() => expect(ctx.fetchOperations).toHaveBeenCalledWith('dp1'));
    expect(input).toHaveValue('');
  });

  it('keeps input when request fails', async () => {
    (distributionPlanApiPost as jest.Mock).mockResolvedValue({ success: false });
    const { ctx } = renderForm();
    const input = screen.getByPlaceholderText('Name of Phase');
    await userEvent.type(input, 'Phase 1');
    await userEvent.click(screen.getByRole('button', { name: /add phase/i }));
    await waitFor(() => expect(distributionPlanApiPost).toHaveBeenCalled());
    expect(ctx.fetchOperations).not.toHaveBeenCalled();
    expect(input).toHaveValue('Phase 1');
  });
});
