import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityHeaderCICRate from '../../../../../../components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation, useQuery } from '@tanstack/react-query';

jest.mock('../../../../../../components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRateStats', () => () => <div data-testid="stats" />);
jest.mock('../../../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));
jest.mock('@tanstack/react-query');
jest.mock('../../../../../../services/api/common-api', () => ({ commonApiFetch: jest.fn(), commonApiPost: jest.fn() }));
jest.mock('react-use', () => ({ createBreakpoint: () => () => 'MD' }));

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;

describe('UserPageIdentityHeaderCICRate', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({ data: { cic_rating_by_rater: 0, cic_ratings_left_to_give_by_rater: 5 } });
    useMutationMock.mockImplementation((opts: any) => ({ mutateAsync: jest.fn(opts.mutationFn) }));
  });

  function setup(auth?: any) {
    const authValue = {
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      setToast: jest.fn(),
      connectedProfile: { handle: 'alice' },
      activeProfileProxy: null,
      ...auth,
    } as any;
    const queryCtx = { onProfileCICModify: jest.fn() } as any;
    render(
      <AuthContext.Provider value={authValue}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageIdentityHeaderCICRate profile={{ query: 'bob', handle: 'bob' } as any} isTooltip={false} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    return { authValue, queryCtx };
  }

  it('submits rating when authenticated', async () => {
    const user = userEvent.setup();
    const { authValue } = setup();
    await user.type(screen.getByLabelText(/Your total NIC Rating/), '3');
    await user.click(screen.getByRole('button', { name: 'Rate' }));
    expect(authValue.requestAuth).toHaveBeenCalled();
  });

  it('shows toast when auth fails', async () => {
    const user = userEvent.setup();
    const { authValue } = setup({ requestAuth: jest.fn().mockResolvedValue({ success: false }) });
    await user.type(screen.getByLabelText(/Your total NIC Rating/), '1');
    await user.click(screen.getByRole('button', { name: 'Rate' }));
    expect(authValue.setToast).toHaveBeenCalled();
  });
});
