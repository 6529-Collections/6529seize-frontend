import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCustomSnapshotForm from '../../../../../components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotForm';
import { DistributionPlanToolContext } from '../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiPost } from '../../../../../services/distribution-plan-api';

jest.mock('../../../../../components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormUpload', () => () => <div data-testid="upload" />);
jest.mock('../../../../../components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormTable', () => ({ tokens }: any) => <div data-testid="table">{tokens.length}</div>);
jest.mock('../../../../../components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormAddWalletsModal', () => ({ addUploadedTokens, onClose, tokens }: any) => (
  <div data-testid="modal">
    <span data-testid="count">{tokens.length}</span>
    <button onClick={() => { addUploadedTokens([{ owner: '0x1' }]); onClose(); }}>upload</button>
  </div>
));
jest.mock('../../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper', () => ({ __esModule: true, AllowlistToolModalSize: { X_LARGE: 'X_LARGE' }, default: ({ children }: any) => <div data-testid="wrapper">{children}</div> }));

jest.mock('../../../../../services/distribution-plan-api');

const ctx = {
  distributionPlan: { id: 'd1' },
  setToasts: jest.fn(),
  fetchOperations: jest.fn(),
};

describe('CreateCustomSnapshotForm', () => {
  beforeEach(() => {
    (distributionPlanApiPost as jest.Mock).mockResolvedValue({ success: true, data: null });
  });

  it('adds uploaded tokens and submits form', async () => {
    render(
      <DistributionPlanToolContext.Provider value={ctx as any}>
        <CreateCustomSnapshotForm />
      </DistributionPlanToolContext.Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: /add wallets/i }));
    await userEvent.click(screen.getByRole('button', { name: 'upload' }));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    // table should now show 1 token
    expect(screen.getByTestId('table')).toHaveTextContent('1');

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Snap');
    await userEvent.click(screen.getByRole('button', { name: /add custom snapshot/i }));

    expect(distributionPlanApiPost).toHaveBeenCalled();
    expect(ctx.fetchOperations).toHaveBeenCalledWith('d1');
  });
});
