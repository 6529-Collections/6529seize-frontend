import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileProxyEndTimeEdit from '../../../../../../../../components/user/proxy/proxy/action/utils/time/ProfileProxyEndTimeEdit';
import { AuthContext } from '../../../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

jest.mock('../../../../../../../../components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigEndTimeSwitch', () => ({
  __esModule: true,
  default: ({ isActive, setIsActive }: any) => <button onClick={() => setIsActive(!isActive)}>toggle</button>
}));

jest.mock('../../../../../../../../components/utils/time/CommonTimeSelect', () => ({
  __esModule: true,
  default: ({ onMillis }: any) => <button onClick={() => onMillis(Date.now() + 1000)}>time</button>
}));

describe('ProfileProxyEndTimeEdit', () => {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);
  (useMutation as jest.Mock).mockReturnValue({ mutateAsync });

  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() };
  const qctx = { onProfileProxyModify: jest.fn() };

  it('submits new end time', async () => {
    render(
      <AuthContext.Provider value={auth as any}>
        <ReactQueryWrapperContext.Provider value={qctx as any}>
          <ProfileProxyEndTimeEdit profileProxy={{ id: '1', granted_to: { handle: 'g' }, created_by: { handle: 'c' } } as any} profileProxyAction={{ id: 'a', end_time: Date.now() + 2000 } as any} setViewMode={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByText('time'));
    await userEvent.click(screen.getByText('Update'));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
  });
});
