import React from 'react';
import { render, screen } from '@testing-library/react';
import RunOperations from '@/components/distribution-plan-tool/run-operations/RunOperations';
import { AllowlistRunStatus } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('react-use', () => ({ useInterval: jest.fn() }));

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
      pollRunStatus: jest.fn(),
      fetching: true,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('shows the overlay for a refresh after opening the plan', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.FAILED } },
      pollRunStatus: jest.fn(),
      fetching: true,
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets interval when loading', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.CLAIMED } },
      pollRunStatus: jest.fn(),
      fetching: false,
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('no interval when not loading', () => {
    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.FAILED } },
      pollRunStatus: jest.fn(),
      fetching: false,
    });
    expect(useInterval).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('polls the current plan via the interval callback', () => {
    const pollRunStatus = jest.fn();

    renderOperations({
      distributionPlan: { id: '1', activeRun: { status: AllowlistRunStatus.CLAIMED } },
      pollRunStatus,
      fetching: false,
    });

    const cb = useInterval.mock.calls[0][0];
    cb();
    expect(pollRunStatus).toHaveBeenCalledWith('1');
  });
});
