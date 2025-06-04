import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreate from '../../../../../components/user/proxy/create/ProxyCreate';
import { ProxyMode } from '../../../../../components/user/proxy/UserPageProxy';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../components/react-query-wrapper/ReactQueryWrapper';

let onTargetSelect: any;
let onActionCreated: any;

jest.mock('../../../../../components/user/proxy/create/target/ProxyCreateTargetSearch', () => (props: any) => {
  onTargetSelect = props.onTargetSelect;
  return <button onClick={() => props.onTargetSelect({ profile_id: '1', handle: 'bob' })}>select-target</button>;
});

jest.mock('../../../../../components/user/proxy/proxy/create-action/ProxyCreateAction', () => (props: any) => {
  onActionCreated = props.onActionCreated;
  return <button onClick={props.onActionCreated}>action</button>;
});

jest.mock('@tanstack/react-query');

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockImplementation((config) => {
  return {
    mutateAsync: async (arg: any) => {
      mutateAsync(arg);
      config.onSuccess?.({ id: 'new', granted_to: { handle: 'bob' }, created_by: { handle: 'alice' }, actions: [] });
    },
  };
});

const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
const rq = { setProfileProxy: jest.fn(), onProfileProxyModify: jest.fn() } as any;

it('calls onModeChange when back clicked', async () => {
  const onModeChange = jest.fn();
  const user = userEvent.setup();
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rq}>
        <ProxyCreate profileProxies={[]} onModeChange={onModeChange} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  await user.click(screen.getByText('Back'));
  expect(onModeChange).toHaveBeenCalledWith(ProxyMode.LIST);
});

it('creates proxy and handles action created', async () => {
  const user = userEvent.setup();
  const onModeChange = jest.fn();
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rq}>
        <ProxyCreate profileProxies={[]} onModeChange={onModeChange} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  await user.click(screen.getByText('select-target'));
  expect(mutateAsync).toHaveBeenCalledWith({ target_id: '1' });
  // ProxyCreateAction should appear now
  await user.click(screen.getByText('action'));
  expect(rq.setProfileProxy).toHaveBeenCalled();
  expect(rq.onProfileProxyModify).toHaveBeenCalled();
  expect(onModeChange).toHaveBeenCalledWith(ProxyMode.LIST);
});
