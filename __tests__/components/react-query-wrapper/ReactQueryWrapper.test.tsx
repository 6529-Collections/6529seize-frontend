import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@/helpers/Helpers', () => ({ ...jest.requireActual('../../../helpers/Helpers'), wait: jest.fn(() => Promise.resolve()) }));

const wait = require('@/helpers/Helpers').wait as jest.Mock;

type ContextType = {
  setProfile: (profile: any) => void;
  setWaveDrops: (params: { waveDrops: any; waveId: string }) => void;
  waitAndInvalidateDrops: () => Promise<void>;
  onWaveFollowChange: (params: { waveId: string; following: boolean }) => void;
  invalidateAll: () => void;
  setProfileProxy: (proxy: any) => void;
  onProfileProxyModify: (params: { profileProxyId: string; createdByHandle: string; grantedToHandle: string }) => void;
  setWave: (wave: any) => void;
  setWavesOverviewPage: (waves: any[]) => void;
  onIdentityFollowChange: () => void;
  onGroupCreate: () => void;
  onGroupRemoved: (params: { groupId: string }) => void;
  onGroupChanged: (params: { groupId: string }) => void;
  onIdentityBulkRate: () => void;
  invalidateNotifications: () => void;
};

const createTestSetup = () => {
  const client = new QueryClient();
  jest.spyOn(client, 'invalidateQueries');
  jest.spyOn(client, 'setQueryData');
  let ctx: ContextType;
  function Child() { 
    ctx = useContext(ReactQueryWrapperContext) as ContextType; 
    return null; 
  }
  const renderResult = render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  return { client, ctx: ctx!, renderResult };
};

describe('ReactQueryWrapper context', () => {
  it('sets profile data in query cache', () => {
    const { client, ctx } = createTestSetup();
    const profile = { handle: 'Alice', wallets: [{ wallet: '0x1', display: 'Alice' }] } as any;
    act(() => ctx.setProfile(profile));
    expect(client.getQueryData([QueryKey.PROFILE, 'alice'])).toEqual(profile);
    expect(client.getQueryData([QueryKey.PROFILE, '0x1'])).toEqual(profile);
  });

  it('waits then invalidates drops', async () => {
    const { client, ctx } = createTestSetup();
    await act(async () => {
      await ctx.waitAndInvalidateDrops();
    });
    expect(wait).toHaveBeenCalledWith(500);
    expect((client.invalidateQueries as jest.Mock).mock.calls[0][0]).toEqual({ queryKey: [QueryKey.DROPS] });
  });

  it('onIdentityFollowChange invalidates related queries', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.onIdentityFollowChange());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_FOLLOWERS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] });
  });

  it('onGroupCreate invalidates groups list', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.onGroupCreate());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
  });

  it('onGroupRemoved invalidates all group queries', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.onGroupRemoved({ groupId: '1' }));
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUP, '1'] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_LOGS, { groupId: '1' }] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, { groupId: '1' }] });
  });

  it('onGroupChanged invalidates all group queries', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.onGroupChanged({ groupId: '2' }));
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUP, '2'] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_LOGS, { groupId: '2' }] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, { groupId: '2' }] });
  });

  it('onIdentityBulkRate invalidates all related queries', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.onIdentityBulkRate());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_LOGS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_RATERS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_RATER_CIC_STATE] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_AVAILABLE_CREDIT] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROFILE_PROXIES] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROXY] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_REP_RATINGS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUP] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
  });

  it('invalidateNotifications invalidates notifications query', () => {
    const { client, ctx } = createTestSetup();
    act(() => ctx.invalidateNotifications());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] });
  });
});

it('sets initial wave drops only when cache empty', () => {
  const { client, ctx } = createTestSetup();
  const feed = { drops: ['d1'] } as any;
  act(() => ctx.setWaveDrops({ waveDrops: feed, waveId: 'w1' }));
  expect(client.getQueryData([QueryKey.DROPS, { waveId: 'w1', limit: 50, dropId: null }])).toEqual({ pages: [feed], pageParams: [undefined] });
  // second call should not overwrite
  const other = { drops: ['d2'] } as any;
  act(() => ctx.setWaveDrops({ waveDrops: other, waveId: 'w1' }));
  expect(client.getQueryData([QueryKey.DROPS, { waveId: 'w1', limit: 50, dropId: null }])).toEqual({ pages: [feed], pageParams: [undefined] });
});

it('sets initial waves overview page only once', () => {
  const { client, ctx } = createTestSetup();
  const waves = [{ id: 'w1' }] as any;
  act(() => ctx.setWavesOverviewPage(waves));
  const key = [QueryKey.WAVES_OVERVIEW, { limit: 20, type: "RECENTLY_DROPPED_TO", only_waves_followed_by_authenticated_user: true }];
  expect(client.getQueryData(key)).toEqual({ pages: [waves], pageParams: [undefined] });
  const other = [{ id: 'w2' }] as any;
  act(() => ctx.setWavesOverviewPage(other));
  expect(client.getQueryData(key)).toEqual({ pages: [waves], pageParams: [undefined] });
});

test('wave follow change toggles and invalidates', () => {
  jest.useFakeTimers();
  const toggle = require('@/components/react-query-wrapper/utils/toggleWaveFollowing');
  jest.spyOn(toggle, 'toggleWaveFollowing').mockResolvedValue(undefined);
  const { client, ctx } = createTestSetup();
  act(() => ctx.onWaveFollowChange({ waveId: 'w1', following: true }));
  expect(toggle.toggleWaveFollowing).toHaveBeenCalledWith({ waveId: 'w1', following: true, queryClient: client });
  jest.runAllTimers();
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.WAVES_OVERVIEW] });
  jest.useRealTimers();
});

it('invalidateAll calls queryClient.invalidateQueries with no args', () => {
  const { client, ctx } = createTestSetup();
  act(() => ctx.invalidateAll());
  expect(client.invalidateQueries).toHaveBeenCalledWith();
});

it('sets profile proxy and invalidates on modify', () => {
  const { client, ctx } = createTestSetup();
  const proxy = { id: 'p1' } as any;
  act(() => ctx.setProfileProxy(proxy));
  expect(client.setQueryData).toHaveBeenCalledWith([QueryKey.PROFILE_PROXY, { id: 'p1' }], proxy);
  act(() => ctx.onProfileProxyModify({ profileProxyId: 'p1', createdByHandle: 'a', grantedToHandle: 'b' }));
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROXY, { id: 'p1' }] });
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROFILE_PROXIES] });
});

it('sets wave data in cache', () => {
  const { client, ctx } = createTestSetup();
  const wave = { id: 'w123' } as any;
  act(() => ctx.setWave(wave));
  expect(client.getQueryData([QueryKey.WAVE, { wave_id: 'w123' }])).toEqual(wave);
});
