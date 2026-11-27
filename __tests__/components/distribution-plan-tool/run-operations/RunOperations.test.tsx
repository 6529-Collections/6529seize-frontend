import React from 'react';
import { render, screen } from '@testing-library/react';
import RunOperations from '@/components/distribution-plan-tool/run-operations/RunOperations';
import { AllowlistRunStatus } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('react-use', () => ({ useInterval: jest.fn() }));
jest.mock('@/services/distribution-plan-api', () => ({ distributionPlanApiFetch: jest.fn() }));

const useInterval = require('react-use').useInterval as jest.Mock;

function renderOperations(props: any) {
  return render(<RunOperations isOpeningPlan={false} {...props} />);
}

describe('RunOperations', () => {
  beforeEach(() => {
    useInterval.mockClear();
  });

  it('does not overlay the initial loader, but still polls a pending analysis', () => {
    renderOperations({
      isOpeningPlan: true,
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.PENDING } },
      setState: jest.fn(),
      fetching: true,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('shows the overlay for a refresh after opening the plan', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.FAILED } },
      setState: jest.fn(),
      fetching: true,
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets interval when loading', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.CLAIMED } },
      setState: jest.fn(),
      fetching: false,
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('no interval when not loading', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.FAILED } },
      setState: jest.fn(),
      fetching: false,
    });
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('fetches updated run via interval callback', async () => {
    const api = require('@/services/distribution-plan-api');
    const setState = jest.fn();
    api.distributionPlanApiFetch.mockResolvedValue({ success: true, data: { activeRun: { status: AllowlistRunStatus.FAILED } } });

    renderOperations({
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
