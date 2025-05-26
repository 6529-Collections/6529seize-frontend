import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../../services/distribution-plan-api');
jest.mock('../../../../../helpers/AllowlistToolHelpers', () => {
  const actual = jest.requireActual('../../../../../helpers/AllowlistToolHelpers');
  return {
    __esModule: true,
    ...actual,
    isEthereumAddress: jest.fn(),
    getRandomObjectId: jest.fn(() => 'random-id'),
  };
});

import CreateSnapshotForm from '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotForm';
import { DistributionPlanToolContext } from '../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch, distributionPlanApiPost } from '../../../../../services/distribution-plan-api';
import { AllowlistOperationCode } from '../../../../../components/allowlist-tool/allowlist-tool.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isEthereumAddress } = require('../../../../../helpers/AllowlistToolHelpers');

jest.mock(
  '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollection',
  () => ({ setCollection }: any) => (
    <button data-testid="search" onClick={() => setCollection({ name: 'NFT', address: '0xcollection', tokenIds: '1' })} />
  )
);

jest.mock(
  '../../../../../components/distribution-plan-tool/common/DistributionPlanAddOperationBtn',
  () => ({ children, loading }: any) => (
    <button type="submit" disabled={loading}>{children}</button>
  )
);

const fetchMock = distributionPlanApiFetch as jest.Mock;
const postMock = distributionPlanApiPost as jest.Mock;
const isEthMock = isEthereumAddress as jest.Mock;

function renderForm(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = { distributionPlan: { id: 'dp1' }, fetchOperations: jest.fn() } as any;
  return {
    fetchOperations: ctx?.fetchOperations || defaultCtx.fetchOperations,
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <CreateSnapshotForm />
      </DistributionPlanToolContext.Provider>
    ),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
});

it('loads latest block number on mount', async () => {
  fetchMock.mockResolvedValueOnce({ success: true, data: 100 });
  renderForm();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/other/latest-block-number'));
  await waitFor(() => expect(screen.getByPlaceholderText('Block number')).toHaveValue(100));
  expect(screen.getByPlaceholderText('Consolidate block number')).toHaveValue('100');
});

it('auto fills name from contract metadata', async () => {
  fetchMock.mockResolvedValueOnce({ success: true, data: 100 });
  fetchMock.mockResolvedValueOnce({ success: true, data: { name: 'CoolToken' } });
  isEthMock.mockImplementation((val: string) => /^0x[a-fA-F0-9]{40}$/.test(val));
  renderForm();
  const contractInput = screen.getByPlaceholderText('Contract number');
  await userEvent.type(contractInput, '0x1234567890123456789012345678901234567890');
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/other/contract-metadata/0x1234567890123456789012345678901234567890'));
  expect((screen.getByPlaceholderText('Snapshot name') as HTMLInputElement).value).toBe('CoolToken');
});

it('submits snapshot and resets form', async () => {
  fetchMock.mockResolvedValueOnce({ success: true, data: 50 });
  postMock.mockResolvedValueOnce({ success: true });
  const fetchOperations = jest.fn();
  renderForm({ fetchOperations });
  await userEvent.type(screen.getByPlaceholderText('Snapshot name'), 'Snap');
  await userEvent.type(screen.getByPlaceholderText('Contract number'), '0x1111111111111111111111111111111111111111');
  await userEvent.type(screen.getByPlaceholderText('Empty for All tokens'), '1,2');
  await userEvent.clear(screen.getByPlaceholderText('Consolidate block number'));
  await userEvent.type(screen.getByPlaceholderText('Consolidate block number'), '60');
  await userEvent.click(screen.getByRole('button', { name: /add snapshot/i }));
  await waitFor(() => expect(postMock).toHaveBeenCalled());
  const call = postMock.mock.calls[0][0];
  expect(call).toEqual({
    endpoint: '/allowlists/dp1/operations',
    body: expect.objectContaining({
      code: AllowlistOperationCode.CREATE_TOKEN_POOL,
      params: expect.objectContaining({
        name: 'Snap',
        description: 'Snap',
        contract: '0x1111111111111111111111111111111111111111',
        blockNo: 50,
        tokenIds: '1,2',
        consolidateBlockNo: 60,
      }),
    }),
  });
  await waitFor(() => expect(fetchOperations).toHaveBeenCalledWith('dp1'));
  expect(screen.getByPlaceholderText('Snapshot name')).toHaveValue('');
  expect(screen.getByPlaceholderText('Contract number')).toHaveValue('');
  expect(screen.getByPlaceholderText('Empty for All tokens')).toHaveValue('');
});

