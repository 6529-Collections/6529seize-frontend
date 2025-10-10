import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCustomSnapshotForm from '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotForm';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiPost } from '@/services/distribution-plan-api';
import type { CustomTokenPoolParamsToken } from '@/components/allowlist-tool/allowlist-tool.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let mockUploadedTokens: CustomTokenPoolParamsToken[] = [];

jest.mock('@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormUpload', () => () => <div data-testid="upload" />);
jest.mock('@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormTable', () => ({ tokens }: any) => <div data-testid="table">{tokens.length}</div>);
jest.mock('@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormAddWalletsModal', () => ({ addUploadedTokens, onClose, tokens }: any) => (
  <div data-testid="modal">
    <span data-testid="count">{tokens.length}</span>
    <button onClick={() => { addUploadedTokens(mockUploadedTokens); onClose(); }}>upload</button>
  </div>
));
jest.mock('@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper', () => ({ __esModule: true, AllowlistToolModalSize: { X_LARGE: 'X_LARGE' }, default: ({ children }: any) => <div data-testid="wrapper">{children}</div> }));

jest.mock('@/services/distribution-plan-api');

const ctx = {
  distributionPlan: { id: 'd1' },
  setToasts: jest.fn(),
  fetchOperations: jest.fn(),
};

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <DistributionPlanToolContext.Provider value={ctx as any}>
        <CreateCustomSnapshotForm />
      </DistributionPlanToolContext.Provider>
    </QueryClientProvider>
  );

  return { queryClient, ...view };
};

describe('CreateCustomSnapshotForm', () => {
  beforeEach(() => {
    mockUploadedTokens = [{ owner: '0x0000000000000000000000000000000000000001' }];
    (distributionPlanApiPost as jest.Mock).mockResolvedValue({ success: true, data: null });
    (distributionPlanApiPost as jest.Mock).mockClear();
    (ctx.setToasts as jest.Mock).mockClear();
    (ctx.fetchOperations as jest.Mock).mockClear();
  });

  it('adds uploaded tokens and submits form', async () => {
    const { queryClient } = renderWithProviders();

    await userEvent.click(screen.getByRole('button', { name: /add wallets/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'upload' }));
    await waitFor(() => expect(screen.queryByTestId('modal')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('1'));
    await waitFor(() =>
      expect(
        screen.getByText(/will split .* into 1 custom snapshot/i)
      ).toBeInTheDocument()
    );

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Snap');
    await userEvent.click(
      screen.getByRole('button', { name: /add .*custom snapshots?/i })
    );

    await waitFor(() => expect(distributionPlanApiPost).toHaveBeenCalledTimes(1));
    const call = (distributionPlanApiPost as jest.Mock).mock.calls[0][0];
    expect(call.body.params.name).toBe('Snap-1');
    expect(call.body.params.tokens).toHaveLength(1);
    await waitFor(() => expect(ctx.fetchOperations).toHaveBeenCalledWith('d1'));
    await waitFor(() =>
      expect(ctx.setToasts).toHaveBeenCalledWith({
        messages: ['Created 1 custom snapshot.'],
        type: 'success',
      })
    );

    queryClient.clear();
  });

  it('splits uploads into 500 row chunks', async () => {
    mockUploadedTokens = Array.from({ length: 1100 }, (_, index) => ({
      owner: `0x${(index + 1).toString(16).padStart(40, '0')}`,
    }));

    const { queryClient } = renderWithProviders();

    await userEvent.click(screen.getByRole('button', { name: /add wallets/i }));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'upload' }));
    await waitFor(() =>
      expect(
        screen.getByText(/will split .* into 3 custom snapshots/i)
      ).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /add 3 custom snapshots/i })
      ).toBeInTheDocument()
    );

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'BulkSnap');
    await userEvent.click(
      screen.getByRole('button', { name: /add .*custom snapshots?/i })
    );

    await waitFor(() => expect(distributionPlanApiPost).toHaveBeenCalledTimes(3));
    const calls = (distributionPlanApiPost as jest.Mock).mock.calls;
    expect(calls[0][0].body.params.name).toBe('BulkSnap-1');
    expect(calls[0][0].body.params.tokens).toHaveLength(500);
    expect(calls[1][0].body.params.name).toBe('BulkSnap-2');
    expect(calls[1][0].body.params.tokens).toHaveLength(500);
    expect(calls[2][0].body.params.name).toBe('BulkSnap-3');
    expect(calls[2][0].body.params.tokens).toHaveLength(100);
    await waitFor(() =>
      expect(ctx.setToasts).toHaveBeenCalledWith({
        messages: ['Created 3 custom snapshots.'],
        type: 'success',
      })
    );

    queryClient.clear();
  });
});
