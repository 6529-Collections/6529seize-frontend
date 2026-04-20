import { QueryClient } from "@tanstack/react-query";
import { increaseWavesOverviewDropsCount } from "@/components/react-query-wrapper/utils/increaseWavesOverviewDropsCount";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

function createWave(id: string) {
  return {
    id,
    last_drop_time: 0,
    metrics: {
      drops_count: 0,
      your_drops_count: 0,
      latest_drop_timestamp: 0,
      your_latest_drop_timestamp: 0,
    },
  } as any;
}

describe("increaseWavesOverviewDropsCount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("increments drops count for all overview types", async () => {
    const client = new QueryClient();
    const wave = createWave("w1");
    const data = { pages: [[wave]] };

    for (const type of Object.values(ApiWavesOverviewType)) {
      const key = [
        QueryKey.WAVES_OVERVIEW,
        { limit: 20, type, only_waves_followed_by_authenticated_user: true },
      ];
      client.setQueryData(key, data);
    }

    await increaseWavesOverviewDropsCount(client, "w1");

    for (const type of Object.values(ApiWavesOverviewType)) {
      const key = [
        QueryKey.WAVES_OVERVIEW,
        { limit: 20, type, only_waves_followed_by_authenticated_user: true },
      ];
      const result: any = client.getQueryData(key);
      expect(result?.pages?.[0][0].metrics.drops_count).toBe(1);
      expect(result?.pages?.[0][0].metrics.your_drops_count).toBe(1);
    }
  });

  it("updates pinned overview array caches", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1234);
    const client = new QueryClient();
    const wave = createWave("w1");
    const other = createWave("w2");
    const key = [
      QueryKey.WAVES_OVERVIEW,
      { pinned: ApiWavesPinFilter.Pinned, viewer_identity: "0xabc" },
    ];
    client.setQueryData(key, [wave, other]);

    await increaseWavesOverviewDropsCount(client, "w1");

    const result: any = client.getQueryData(key);
    expect(result[0].metrics.drops_count).toBe(1);
    expect(result[0].metrics.your_drops_count).toBe(1);
    expect(result[0].metrics.latest_drop_timestamp).toBe(1234);
    expect(result[0].metrics.your_latest_drop_timestamp).toBe(1234);
    expect(result[0].last_drop_time).toBe(1234);
    expect(result[1]).toEqual(other);
  });

  it("preserves infinite overview page structure", async () => {
    const client = new QueryClient();
    const waveOne = createWave("w1");
    const waveTwo = createWave("w2");
    const key = [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: 20,
        type: ApiWavesOverviewType.RecentlyDroppedTo,
        only_waves_followed_by_authenticated_user: true,
      },
    ];
    client.setQueryData(key, {
      pages: [[waveOne], [waveTwo]],
      pageParams: [undefined, 1],
    });

    await increaseWavesOverviewDropsCount(client, "w2");

    const result: any = client.getQueryData(key);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toEqual([waveOne]);
    expect(result.pages[1]).toHaveLength(1);
    expect(result.pages[1][0].id).toBe("w2");
    expect(result.pages[1][0].metrics.drops_count).toBe(1);
    expect(result.pageParams).toEqual([undefined, 1]);
  });

  it("leaves unrelated overview caches untouched", async () => {
    const client = new QueryClient();
    const key = [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: 20,
        type: ApiWavesOverviewType.RecentlyDroppedTo,
        only_waves_followed_by_authenticated_user: true,
      },
    ];
    const data = { pages: [[createWave("other")]], pageParams: [undefined] };
    client.setQueryData(key, data);
    const cancelSpy = jest.spyOn(client, "cancelQueries");
    const setQueryDataSpy = jest.spyOn(client, "setQueryData");

    await increaseWavesOverviewDropsCount(client, "missing");

    expect(cancelSpy).not.toHaveBeenCalled();
    expect(setQueryDataSpy).not.toHaveBeenCalled();
    expect(client.getQueryData(key)).toBe(data);
  });
});
