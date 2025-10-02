import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyList, { ProfileProxyListType } from '@/components/user/proxy/list/ProxyList';
import { ProxyMode } from '@/components/user/proxy/UserPageProxy';

jest.mock('@/components/user/proxy/list/filters/ProxyListFilters', () => ({
  __esModule: true,
  default: ({ setSelected, selected }: any) => (
    <div>
      <button onClick={() => setSelected(ProfileProxyListType.RECEIVED)}>Received</button>
      <span data-testid="selected">{selected}</span>
    </div>
  ),
}));

jest.mock('@/components/user/proxy/list/ProxyListItem', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="item">{props.profileProxy.id}</div>,
}));

jest.mock('@/components/utils/button/PrimaryButton', () => ({
  __esModule: true,
  default: ({ onClicked, children }: any) => <button onClick={onClicked}>{children}</button>,
}));

describe('ProxyList', () => {
  const received = [{ id: 'r1' } as any];
  const granted = [{ id: 'g1' } as any];
  it('shows button for self and handles click', async () => {
    const onModeChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ProxyList
        onModeChange={onModeChange}
        receivedProfileProxies={received}
        grantedProfileProxies={granted}
        isSelf={true}
        profile={{} as any}
        loading={false}
      />
    );
    await user.click(screen.getByRole('button', { name: /Assign Proxy/i }));
    expect(onModeChange).toHaveBeenCalledWith(ProxyMode.CREATE);
    expect(screen.getAllByTestId('item')).toHaveLength(2);
  });

  it('changes filter', async () => {
    const user = userEvent.setup();
    render(
      <ProxyList
        onModeChange={() => {}}
        receivedProfileProxies={received}
        grantedProfileProxies={granted}
        isSelf={false}
        profile={{} as any}
        loading={false}
      />
    );
    await user.click(screen.getByText('Received'));
    expect(screen.getByTestId('selected').textContent).toBe(ProfileProxyListType.RECEIVED);
  });
});
