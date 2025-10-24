jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown) => body),
  },
}));

import { NextResponse } from "next/server";
import { GET as getCollections } from "@/app/api/xtdh/collections/route";
import { GET as getTokens } from "@/app/api/xtdh/tokens/route";
import { GET as getStats } from "@/app/api/xtdh/stats/route";
import {
  getCollectionsResponse,
  getTokensResponse,
} from "@/app/api/xtdh/mock-data";

const jsonMock = NextResponse.json as jest.Mock;

describe("xTDH API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns filtered collections", async () => {
    const request = { url: "http://localhost/api/xtdh/collections?grantor=gm6529" } as Request;
    await getCollections(request);

    expect(jsonMock).toHaveBeenCalledTimes(1);
    const payload = jsonMock.mock.calls[0][0];
    expect(Array.isArray(payload.collections)).toBe(true);
    expect(payload.collections.length).toBeGreaterThan(0);
    for (const collection of payload.collections) {
      expect(
        collection.granters.some(
          (granter: { profileId: string }) =>
            granter.profileId.toLowerCase() === "gm6529"
        )
      ).toBe(true);
    }
  });

  it("returns filtered tokens", async () => {
    const request = {
      url: "http://localhost/api/xtdh/tokens?network=ethereum&min_rate=150",
    } as Request;

    await getTokens(request);

    const payload = jsonMock.mock.calls.at(-1)[0];
    expect(Array.isArray(payload.nfts)).toBe(true);
    expect(payload.nfts.length).toBeGreaterThan(0);
    for (const token of payload.nfts) {
      expect(token.blockchain).toBe("ethereum");
      expect(token.xtdhRate).toBeGreaterThanOrEqual(150);
    }
  });

  it("exposes overview stats", async () => {
    await getStats();
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        network: expect.objectContaining({
          totalDailyCapacity: expect.any(Number),
          totalAllocated: expect.any(Number),
          totalAvailable: expect.any(Number),
          baseTdhRate: expect.any(Number),
          activeAllocations: expect.any(Number),
          grantors: expect.any(Number),
          collections: expect.any(Number),
          tokens: expect.any(Number),
          totalXtdh: expect.any(Number),
        }),
        multiplier: expect.objectContaining({
          current: expect.any(Number),
          nextValue: expect.any(Number),
          nextIncreaseDate: expect.any(String),
          milestones: expect.any(Array),
        }),
      })
    );
  });
});

describe("xTDH mock data helpers", () => {
  it("applies grantor filter at data layer", () => {
    const result = getCollectionsResponse({
      page: 1,
      pageSize: 10,
      sort: "total_rate",
      dir: "desc",
      filters: {
        networks: [],
        grantorProfileId: "gm6529",
      },
    });

    expect(result.collections.length).toBeGreaterThan(0);
    result.collections.forEach((collection) => {
      expect(
        collection.granters.some(
          (granter) => granter.profileId.toLowerCase() === "gm6529"
        )
      ).toBe(true);
    });
  });

  it("applies network filter for tokens", () => {
    const result = getTokensResponse({
      page: 1,
      pageSize: 10,
      sort: "xtdh_rate",
      dir: "desc",
      filters: {
        networks: ["ethereum"],
        minRate: 150,
      },
    });

    expect(result.nfts.length).toBeGreaterThan(0);
    result.nfts.forEach((token) => {
      expect(token.blockchain).toBe("ethereum");
      expect(token.xtdhRate).toBeGreaterThanOrEqual(150);
    });
  });
});
