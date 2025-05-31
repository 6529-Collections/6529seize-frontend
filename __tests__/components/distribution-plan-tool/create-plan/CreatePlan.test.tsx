import React from 'react';
import { render, waitFor } from '@testing-library/react';
import CreatePlan from '../../../../components/distribution-plan-tool/create-plan/CreatePlan';
import { DistributionPlanToolContext } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch } from '../../../../services/distribution-plan-api';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../services/distribution-plan-api');

jest.mock('../../../../components/distribution-plan-tool/common/StepHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));
jest.mock('../../../../components/allowlist-tool/common/AllowlistToolLoader', () => ({
  __esModule: true,
  AllowlistToolLoaderSize: { LARGE: 'LARGE' },
  default: () => <div data-testid="loader" />,
}));

const mockedFetch = distributionPlanApiFetch as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe('CreatePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderWithContext() {
    const setState = jest.fn();
    const router = { query: { id: '1' }, push: jest.fn() };
    mockedUseRouter.mockReturnValue(router);
    return {
      setState,
      push: router.push,
      ...render(
        <DistributionPlanToolContext.Provider value={{ setState } as any}>
          <CreatePlan />
        </DistributionPlanToolContext.Provider>
      )
    };
  }

  it('fetches allowlist and sets state on success', async () => {
    const data = { id: '1', name: 'plan', description: '' };
    mockedFetch.mockResolvedValue({ success: true, data });
    const { setState } = renderWithContext();
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledWith('/allowlists/1'));
    expect(setState).toHaveBeenCalledWith(data);
  });

  it('redirects when fetch fails', async () => {
    mockedFetch.mockResolvedValue({ success: false, data: null });
    const { push } = renderWithContext();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/emma'));
  });
});
