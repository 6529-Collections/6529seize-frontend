import React from 'react';
import { render, screen } from '@testing-library/react';
import RunOperations from '../../../../components/distribution-plan-tool/run-operations/RunOperations';
import { DistributionPlanToolContext } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistRunStatus } from '../../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('react-use', () => ({ useInterval: jest.fn() }));
jest.mock('../../../../services/distribution-plan-api', () => ({ distributionPlanApiFetch: jest.fn() }));

const useInterval = require('react-use').useInterval as jest.Mock;

function renderWithContext(value: any) {
  return render(
    <DistributionPlanToolContext.Provider value={value}>
      <RunOperations />
    </DistributionPlanToolContext.Provider>
  );
}

describe('RunOperations', () => {
  beforeEach(() => {
    useInterval.mockClear();
  });

  it('shows loader when fetching', () => {
    renderWithContext({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.PENDING } },
      setState: jest.fn(),
      fetching: true,
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets interval when loading', () => {
    renderWithContext({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.CLAIMED } },
      setState: jest.fn(),
      fetching: false,
    });
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('no interval when not loading', () => {
    renderWithContext({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.FAILED } },
      setState: jest.fn(),
      fetching: false,
    });
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('fetches updated run via interval callback', async () => {
    const api = require('../../../../services/distribution-plan-api');
    const setState = jest.fn();
    api.distributionPlanApiFetch.mockResolvedValue({ success: true, data: { activeRun: { status: AllowlistRunStatus.FAILED } } });

    renderWithContext({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.CLAIMED } },
      setState,
      fetching: false,
    });

    const cb = useInterval.mock.calls[0][0];
    await cb();
    expect(api.distributionPlanApiFetch).toHaveBeenCalled();
    expect(setState).toHaveBeenCalledWith({ activeRun: { status: AllowlistRunStatus.FAILED } });
  });
});
