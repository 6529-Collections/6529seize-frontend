import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from '../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../../helpers/Helpers', () => ({ ...jest.requireActual('../../../helpers/Helpers'), wait: jest.fn(() => Promise.resolve()) }));

const wait = require('../../../helpers/Helpers').wait as jest.Mock;

describe('ReactQueryWrapper context', () => {
  it('sets profile data in query cache', () => {
    const client = new QueryClient();
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    const profile = { handle: 'Alice', wallets: [{ wallet: '0x1', display: 'Alice' }] } as any;
    act(() => ctx.setProfile(profile));
    expect(client.getQueryData([QueryKey.PROFILE, 'alice'])).toEqual(profile);
    expect(client.getQueryData([QueryKey.PROFILE, '0x1'])).toEqual(profile);
  });

  it('waits then invalidates drops', async () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    await act(async () => {
      await ctx.waitAndInvalidateDrops();
    });
    expect(wait).toHaveBeenCalledWith(500);
    expect((client.invalidateQueries as jest.Mock).mock.calls[0][0]).toEqual({ queryKey: [QueryKey.DROPS] });
  });
});

it('sets initial wave drops only when cache empty', () => {
  const client = new QueryClient();
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  const feed = { drops: ['d1'] } as any;
  act(() => ctx.setWaveDrops({ waveDrops: feed, waveId: 'w1' }));
  expect(client.getQueryData([QueryKey.DROPS, { waveId: 'w1', limit: 50, dropId: null }])).toEqual({ pages: [feed], pageParams: [undefined] });
  // second call should not overwrite
  const other = { drops: ['d2'] } as any;
  act(() => ctx.setWaveDrops({ waveDrops: other, waveId: 'w1' }));
  expect(client.getQueryData([QueryKey.DROPS, { waveId: 'w1', limit: 50, dropId: null }])).toEqual({ pages: [feed], pageParams: [undefined] });
});

it('sets initial waves overview page only once', () => {
  const client = new QueryClient();
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
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
  const toggle = require('../../../components/react-query-wrapper/utils/toggleWaveFollowing');
  jest.spyOn(toggle, 'toggleWaveFollowing').mockResolvedValue(undefined);
  const client = new QueryClient();
  jest.spyOn(client, 'invalidateQueries');
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  act(() => ctx.onWaveFollowChange({ waveId: 'w1', following: true }));
  expect(toggle.toggleWaveFollowing).toHaveBeenCalledWith({ waveId: 'w1', following: true, queryClient: client });
  jest.runAllTimers();
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.WAVES_OVERVIEW] });
  jest.useRealTimers();
});

it('invalidateAll calls queryClient.invalidateQueries with no args', () => {
  const client = new QueryClient();
  jest.spyOn(client, 'invalidateQueries');
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  act(() => ctx.invalidateAll());
  expect(client.invalidateQueries).toHaveBeenCalledWith();
});

it('sets profile proxy and invalidates on modify', () => {
  const client = new QueryClient();
  jest.spyOn(client, 'setQueryData');
  jest.spyOn(client, 'invalidateQueries');
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  const proxy = { id: 'p1' } as any;
  act(() => ctx.setProfileProxy(proxy));
  expect(client.setQueryData).toHaveBeenCalledWith([QueryKey.PROFILE_PROXY, { id: 'p1' }], proxy);
  act(() => ctx.onProfileProxyModify({ profileProxyId: 'p1', createdByHandle: 'a', grantedToHandle: 'b' }));
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROXY, { id: 'p1' }] });
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_PROFILE_PROXIES] });
});

it('sets wave data in cache', () => {
  const client = new QueryClient();
  let ctx: any;
  function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
  render(
    <QueryClientProvider client={client}>
      <ReactQueryWrapper><Child /></ReactQueryWrapper>
    </QueryClientProvider>
  );
  const wave = { id: 'w123' } as any;
  act(() => ctx.setWave(wave));
  expect(client.getQueryData([QueryKey.WAVE, { wave_id: 'w123' }])).toEqual(wave);
});
