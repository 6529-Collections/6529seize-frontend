import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserFollowBtn from '../../../../components/user/utils/UserFollowBtn';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;

describe('UserFollowBtn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup(following: boolean, requestSuccess = true, withDM = false) {
    useQueryMock.mockReturnValue({ data: following ? { actions: [1] } : { actions: [] }, isFetching: false });
    const mutateFollow = jest.fn();
    const mutateUnfollow = jest.fn();
    useMutationMock.mockReturnValueOnce({ mutateAsync: mutateFollow }).mockReturnValueOnce({ mutateAsync: mutateUnfollow });
    const requestAuth = jest.fn().mockResolvedValue({ success: requestSuccess });
    render(
      <AuthContext.Provider value={{ setToast: jest.fn(), requestAuth } as any}>
        <ReactQueryWrapperContext.Provider value={{ onIdentityFollowChange: jest.fn() } as any}>
          <UserFollowBtn handle="bob" onDirectMessage={withDM ? jest.fn() : undefined} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    return { mutateFollow, mutateUnfollow, requestAuth };
  }

  it('follows when not following', async () => {
    const user = userEvent.setup();
    const { mutateFollow, requestAuth } = setup(false);
    await user.click(screen.getByRole('button'));
    expect(requestAuth).toHaveBeenCalled();
    expect(mutateFollow).toHaveBeenCalled();
  });

  it('shows DM button when following', () => {
    setup(true, true, true);
    expect(screen.getAllByRole('button').length).toBe(2);
  });
});
