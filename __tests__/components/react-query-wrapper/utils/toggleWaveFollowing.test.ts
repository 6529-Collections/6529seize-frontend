import { QueryClient } from "@tanstack/react-query";
import { toggleWaveFollowing } from "@/components/react-query-wrapper/utils/toggleWaveFollowing";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";

interface WaveCache {
  readonly subscribed_actions: readonly unknown[];
}

interface CachedSidebarWave {
  readonly id: string;
  readonly subscribed: boolean;
}

interface CachedSidebarWavesPage {
  readonly pages: readonly {
    readonly waves: readonly CachedSidebarWave[];
    readonly page: number;
    readonly next: boolean;
  }[];
  readonly pageParams: readonly number[];
}

type CachedSidebarWaves = readonly CachedSidebarWave[];

describe("toggleWaveFollowing", () => {
  it("updates subscribed actions in cache", () => {
    const client = new QueryClient();
    const key = [QueryKey.WAVE, { wave_id: "w1" }];
    client.setQueryData(key, { id: "w1", subscribed_actions: [] });

    toggleWaveFollowing({
      waveId: "w1",
      following: true,
      queryClient: client,
    });
    expect(client.getQueryData<WaveCache>(key)?.subscribed_actions).toEqual(
      WAVE_DEFAULT_SUBSCRIPTION_ACTIONS
    );

    toggleWaveFollowing({
      waveId: "w1",
      following: false,
      queryClient: client,
    });
    expect(client.getQueryData<WaveCache>(key)?.subscribed_actions).toEqual([]);
  });

  it("updates sidebar wave caches after unfollowing", () => {
    const client = new QueryClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    const followedOnlyKey = [
      QueryKey.WAVES_V2,
      { only_waves_followed_by_authenticated_user: true },
    ];
    const overviewKey = [QueryKey.WAVES_V2, { exclude_followed: true }];
    const subwavesKey = [QueryKey.WAVE_SUBWAVES, { parent_wave_id: "parent" }];
    const officialWavesKey = [
      QueryKey.OFFICIAL_WAVES,
      { viewer_identity: "0xabc:primary" },
    ];

    client.setQueryData(followedOnlyKey, {
      pages: [
        {
          waves: [
            { id: "w1", subscribed: true },
            { id: "w2", subscribed: true },
          ],
          page: 1,
          next: false,
        },
      ],
      pageParams: [1],
    });
    client.setQueryData(overviewKey, {
      pages: [
        {
          waves: [{ id: "w1", subscribed: true }],
          page: 1,
          next: false,
        },
      ],
      pageParams: [1],
    });
    client.setQueryData(subwavesKey, [{ id: "w1", subscribed: true }]);
    client.setQueryData(officialWavesKey, [{ id: "w1", subscribed: true }]);

    toggleWaveFollowing({
      waveId: "w1",
      following: false,
      queryClient: client,
    });

    expect(
      client
        .getQueryData<CachedSidebarWavesPage>(followedOnlyKey)
        ?.pages[0]?.waves.map((wave) => wave.id)
    ).toEqual(["w2"]);
    expect(
      client.getQueryData<CachedSidebarWavesPage>(overviewKey)?.pages[0]
        ?.waves[0]?.subscribed
    ).toBe(false);
    expect(
      client.getQueryData<CachedSidebarWaves>(subwavesKey)?.[0]?.subscribed
    ).toBe(false);
    expect(
      client.getQueryData<CachedSidebarWaves>(officialWavesKey)?.[0]?.subscribed
    ).toBe(false);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVES_V2],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_SUBWAVES],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.OFFICIAL_WAVES],
    });
  });

  it("removes followed waves from exclude-followed sidebar caches", () => {
    const client = new QueryClient();
    const overviewKey = [QueryKey.WAVES_V2, { exclude_followed: true }];

    client.setQueryData(overviewKey, {
      pages: [
        {
          waves: [
            { id: "w1", subscribed: false },
            { id: "w2", subscribed: false },
          ],
          page: 1,
          next: false,
        },
      ],
      pageParams: [1],
    });

    toggleWaveFollowing({
      waveId: "w1",
      following: true,
      queryClient: client,
    });

    expect(
      client
        .getQueryData<CachedSidebarWavesPage>(overviewKey)
        ?.pages[0]?.waves.map((wave) => wave.id)
    ).toEqual(["w2"]);
  });
});
