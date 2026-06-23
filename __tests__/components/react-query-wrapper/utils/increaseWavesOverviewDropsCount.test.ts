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

function createSidebarWave(id: string) {
  return {
    id,
    name: id,
    type: "CHAT",
    picture: null,
    contributors: [],
    isDirectMessage: false,
    hasCompetition: false,
    descriptionDrop: {
      contents: null,
      media: [],
    },
    totalDropsCount: 0,
    isPrivate: false,
    latestDropTimestamp: 0,
    firstUnreadDropSerialNo: null,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    pinned: false,
    muted: false,
    subscribed: false,
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

  it("updates v2 overview, pinned, official, and subwave caches", async () => {
    jest.spyOn(Date, "now").mockReturnValue(4321);
    const client = new QueryClient();
    const waveOne = createSidebarWave("w1");
    const waveTwo = createSidebarWave("w2");
    const overviewKey = [
      QueryKey.WAVES_V2,
      {
        view: "OVERVIEW",
        page_size: 20,
        overview_type: ApiWavesOverviewType.RecentlyDroppedTo,
        only_waves_followed_by_authenticated_user: true,
        direct_message: false,
      },
    ];
    const pinnedKey = [
      QueryKey.WAVES_V2,
      { pinned: ApiWavesPinFilter.Pinned, viewer_identity: "0xabc:primary" },
    ];
    const officialKey = [
      QueryKey.OFFICIAL_WAVES,
      { viewer_identity: "0xabc:primary" },
    ];
    const subwavesKey = [
      QueryKey.WAVE_SUBWAVES,
      { parent_wave_id: "parent", page: 1, page_size: 100 },
    ];

    client.setQueryData(overviewKey, {
      pages: [
        { waves: [waveOne], page: 1, next: true },
        { waves: [waveTwo], page: 2, next: false },
      ],
      pageParams: [1, 2],
    });
    client.setQueryData(pinnedKey, [waveOne]);
    client.setQueryData(officialKey, [waveOne]);
    client.setQueryData(subwavesKey, [waveOne, waveTwo]);

    await increaseWavesOverviewDropsCount(client, "w1");

    const overviewResult: any = client.getQueryData(overviewKey);
    const pinnedResult: any = client.getQueryData(pinnedKey);
    const officialResult: any = client.getQueryData(officialKey);
    const subwavesResult: any = client.getQueryData(subwavesKey);

    expect(overviewResult.pages[0].waves[0].totalDropsCount).toBe(1);
    expect(overviewResult.pages[0].waves[0].latestDropTimestamp).toBe(4321);
    expect(overviewResult.pages[1].waves[0]).toEqual(waveTwo);
    expect(overviewResult.pageParams).toEqual([1, 2]);
    expect(pinnedResult[0].totalDropsCount).toBe(1);
    expect(pinnedResult[0].latestDropTimestamp).toBe(4321);
    expect(officialResult[0].totalDropsCount).toBe(1);
    expect(officialResult[0].latestDropTimestamp).toBe(4321);
    expect(subwavesResult[0].totalDropsCount).toBe(1);
    expect(subwavesResult[0].latestDropTimestamp).toBe(4321);
    expect(subwavesResult[1]).toEqual(waveTwo);
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

  it("leaves unrelated subwave caches untouched", async () => {
    const client = new QueryClient();
    const key = [
      QueryKey.WAVE_SUBWAVES,
      { parent_wave_id: "parent", page: 1, page_size: 100 },
    ];
    const data = [createSidebarWave("other")];
    client.setQueryData(key, data);
    const cancelSpy = jest.spyOn(client, "cancelQueries");
    const setQueryDataSpy = jest.spyOn(client, "setQueryData");

    await increaseWavesOverviewDropsCount(client, "missing");

    expect(cancelSpy).not.toHaveBeenCalled();
    expect(setQueryDataSpy).not.toHaveBeenCalled();
    expect(client.getQueryData(key)).toBe(data);
  });
});
