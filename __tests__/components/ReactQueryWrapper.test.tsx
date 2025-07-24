import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import React, { useContext } from "react";
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_FOLLOWING_WAVES_PARAMS, WAVE_DROPS_PARAMS } from "../../components/react-query-wrapper/utils/query-utils";

import { toggleWaveFollowing } from "../../components/react-query-wrapper/utils/toggleWaveFollowing";
jest.mock("../../components/react-query-wrapper/utils/toggleWaveFollowing");
function useContextValue() {
  const ctx = useContext(ReactQueryWrapperContext);
  return ctx;
}

test("setProfile stores profile under all handles", () => {
  const queryClient = new QueryClient();
  let context: any;
  function Child() {
    context = useContextValue();
    return null;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Child />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );

  const profile = {
    handle: "Alice",
    wallets: [{ wallet: "0xabc", display: "ABC" }],
  } as any;
  context.setProfile(profile);
  expect(queryClient.getQueryData([QueryKey.PROFILE, "alice"])).toEqual(profile);
  expect(queryClient.getQueryData([QueryKey.PROFILE, "0xabc"])).toEqual(profile);
});

test("waitAndInvalidateDrops invalidates drop queries", async () => {
  jest.useFakeTimers();
  const queryClient = new QueryClient();
  const spy = jest.spyOn(queryClient, "invalidateQueries");
  let context: any;
  function Child() {
    context = useContextValue();
    return null;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Child />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );

  const promise = context.waitAndInvalidateDrops();
  await act(async () => {
    jest.advanceTimersByTime(500);
    await promise;
  });
  expect(spy).toHaveBeenCalledWith({ queryKey: [QueryKey.DROPS] });
  jest.useRealTimers();
});

test("setWavesOverviewPage only sets when no cache", () => {
  const queryClient = new QueryClient();
  let context: any;
  const Wrapper = () => {
    context = useContextValue();
    return null;
  };
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Wrapper />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );

  const waves = [{ id: "1" }] as any;
  context.setWavesOverviewPage(waves);
  const key = [
    QueryKey.WAVES_OVERVIEW,
    {
      limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
      type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
      only_waves_followed_by_authenticated_user:
        WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
    },
  ];
  const data = queryClient.getQueriesData({ queryKey: [QueryKey.WAVES_OVERVIEW] })[0]?.[1] as any;
  expect(data.pages[0]).toEqual(waves);

  const other = [{ id: "2" }] as any;
  context.setWavesOverviewPage(other);
  // should not overwrite existing data
  const dataAgain = queryClient.getQueriesData({ queryKey: [QueryKey.WAVES_OVERVIEW] })[0]?.[1] as any;
  expect(dataAgain.pages[0]).toEqual(waves);
});

test("setWaveDrops caches drops when empty", () => {
  const queryClient = new QueryClient();
  let context: any;
  const Wrapper = () => {
    context = useContextValue();
    return null;
  };
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Wrapper />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );
  const dropsData = { drops: [{ serial_no: 1 }] } as any;
  context.setWaveDrops({ waveDrops: dropsData, waveId: "10" });
  const key = [
    QueryKey.DROPS,
    { waveId: "10", limit: WAVE_DROPS_PARAMS.limit, dropId: null },
  ];
  const dropData = queryClient.getQueriesData({ queryKey: [QueryKey.DROPS] })[0]?.[1] as any;
  expect(dropData.pages[0]).toEqual(dropsData);
});


test("setWave stores wave in cache", () => {
  const queryClient = new QueryClient();
  let context: any;
  const Wrapper = () => { context = useContextValue(); return null; };
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Wrapper />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );
  const wave = { id: "w1" } as any;
  context.setWave(wave);
  expect(queryClient.getQueryData([QueryKey.WAVE, { wave_id: "w1" }])).toEqual(wave);
});

test("onWaveFollowChange toggles and invalidates", () => {
  jest.useFakeTimers();
  const queryClient = new QueryClient();
  let ctx: any;
  const Child = () => { ctx = useContextValue(); return null; };
  const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Child />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );
  ctx.onWaveFollowChange({ waveId: "1", following: true });
  expect(toggleWaveFollowing).toHaveBeenCalledWith({ waveId: "1", following: true, queryClient });
  jest.advanceTimersByTime(1000);
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QueryKey.WAVES_OVERVIEW] });
  jest.useRealTimers();
});
