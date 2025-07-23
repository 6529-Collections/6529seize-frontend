import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanToolCreatePlan from '../../../../components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

jest.mock(
  '../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper',
  () => ({
    __esModule: true,
    AllowlistToolModalSize: { X_LARGE: 'X_LARGE' },
    default: ({ children, showModal, onClose }: any) =>
      showModal ? (
        <div data-testid="modal">
          {children}
          <button onClick={onClose} data-testid="close" />
        </div>
      ) : null,
  })
);

const createPlanMock = jest.fn();
jest.mock(
  '../../../../components/distribution-plan-tool/create-plan/CreateDistributionPlan',
  () => ({
    __esModule: true,
    default: ({ onSuccess }: any) => (
      <button
        onClick={() => onSuccess('123')}
        data-testid="create"
      />
    ),
  })
);

const mockedUseRouter = useRouter as jest.Mock;

describe('DistributionPlanToolCreatePlan', () => {
  beforeEach(() => {
    mockedUseRouter.mockReset();
  });

  it('opens modal when button is clicked', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() });
    const user = userEvent.setup();
    render(<DistributionPlanToolCreatePlan />);
    expect(screen.queryByTestId('modal')).toBeNull();
    await user.click(screen.getByRole('button', { name: /create new/i }));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    // close modal
    await user.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('redirects to plan page on success', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ push });
    const user = userEvent.setup();
    render(<DistributionPlanToolCreatePlan />);
    await user.click(screen.getByRole('button', { name: /create new/i }));
    await user.click(screen.getByTestId('create'));
    expect(push).toHaveBeenCalledWith('/emma/plans/123');
  });
});

