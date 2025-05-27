import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePhasesForm from '../../../../../components/distribution-plan-tool/create-phases/form/CreatePhasesForm';
import { DistributionPlanToolContext } from '../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiPost } from '../../../../../services/distribution-plan-api';
import { getRandomObjectId } from '../../../../../helpers/AllowlistToolHelpers';

jest.mock('../../../../../components/distribution-plan-tool/common/DistributionPlanAddOperationBtn', () => ({ children }: any) => (
  <button type="submit">{children}</button>
));

jest.mock('../../../../../services/distribution-plan-api');
jest.mock('../../../../../helpers/AllowlistToolHelpers');

const postMock = distributionPlanApiPost as jest.Mock;
(getRandomObjectId as jest.Mock).mockReturnValue('phase-id');

const ctx = {
  distributionPlan: { id: 'd1' },
  setToasts: jest.fn(),
  fetchOperations: jest.fn(),
};

function renderForm() {
  return render(
    <DistributionPlanToolContext.Provider value={ctx as any}>
      <CreatePhasesForm />
    </DistributionPlanToolContext.Provider>
  );
}

describe('CreatePhasesForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits and resets on success', async () => {
    postMock.mockResolvedValue({ success: true, data: {} });
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Name of Phase'), 'Phase1');
    await userEvent.click(screen.getByRole('button', { name: /add phase/i }));
    await waitFor(() => expect(postMock).toHaveBeenCalled());
    expect(postMock).toHaveBeenCalledWith({
      endpoint: '/allowlists/d1/operations',
      body: {
        code: 'ADD_PHASE',
        params: { id: 'phase-id', name: 'Phase1', description: 'Phase1' },
      },
    });
    expect(ctx.fetchOperations).toHaveBeenCalledWith('d1');
    expect((screen.getByPlaceholderText('Name of Phase') as HTMLInputElement).value).toBe('');
  });

  it('does not reset when api fails', async () => {
    postMock.mockResolvedValue({ success: false, data: null });
    renderForm();
    const input = screen.getByPlaceholderText('Name of Phase') as HTMLInputElement;
    await userEvent.type(input, 'Fail');
    await userEvent.click(screen.getByRole('button', { name: /add phase/i }));
    await waitFor(() => expect(postMock).toHaveBeenCalled());
    expect(ctx.fetchOperations).not.toHaveBeenCalled();
    expect(input.value).toBe('Fail');
  });
});
