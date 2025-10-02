import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsFollowBtn from '@/components/brain/notifications/NotificationsFollowBtn';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');

const followCall = jest.fn();
const unfollowCall = jest.fn();
const mutations: any[] = [];
(useMutation as jest.Mock).mockImplementation((config) => {
  const fn = jest.fn(async () => { config.onSuccess?.(); });
  mutations.push({ mutateAsync: fn });
  return { mutateAsync: fn };
});

const ctxAuth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
const ctxRQ = { onIdentityFollowChange: jest.fn() } as any;

function renderBtn(profile: any) {
  mutations.length = 0;
  return render(
    <AuthContext.Provider value={ctxAuth}>
      <ReactQueryWrapperContext.Provider value={ctxRQ}>
        <NotificationsFollowBtn profile={profile} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
}

it('follows when not currently following', async () => {
  const user = userEvent.setup();
  renderBtn({ handle: 'bob', subscribed_actions: [] });
  await user.click(screen.getByRole('button'));
  expect(mutations[0].mutateAsync).toHaveBeenCalled();
});

it('unfollows when already following', async () => {
  const user = userEvent.setup();
  renderBtn({ handle: 'bob', subscribed_actions: ['x'] });
  await user.click(screen.getByRole('button'));
  expect(mutations[1].mutateAsync).toHaveBeenCalled();
});
