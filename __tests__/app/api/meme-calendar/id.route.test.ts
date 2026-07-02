const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
}));

import {
  getMintTimelineDetails,
  toISO,
} from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MEME_CALENDAR_API_CACHE_HEADERS,
  getMintTimelineStatus,
} from "@/app/api/meme-calendar/meme-calendar-response";
import { GET } from "@/app/api/meme-calendar/[id]/route";

const EXPECTED_POSITION_FIELDS = {
  position_in_season: expect.any(Number),
  position_in_year: expect.any(Number),
  position_in_epoch: expect.any(Number),
  position_in_period: expect.any(Number),
  position_in_era: expect.any(Number),
  position_in_eon: expect.any(Number),
};

describe("/api/meme-calendar/[id]", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    nextResponseJson.mockReset();
    nextResponseJson.mockImplementation(
      (
        body: unknown,
        init?: {
          status?: number | undefined;
        }
      ) => ({
        status: init?.status ?? 200,
        body,
        json: async () => body,
      })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns mint calendar fields for a valid id", async () => {
    const id = 500;
    const expected = getMintTimelineDetails(id);
    const now = new Date();

    const response = await GET({} as any, {
      params: Promise.resolve({ id: String(id) }),
    });

    expect(response.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        mint_number: expected.mintNumber,
        mint_date: toISO(expected.instantUtc),
        mint_start: expected.instantUtc.toISOString(),
        mint_end: expected.mintEndUtc.toISOString(),
        status: getMintTimelineStatus(expected, now),
        season: expected.seasonNumber,
        year: expected.yearNumber,
        epoch: expected.epochNumber,
        period: expected.periodNumber,
        era: expected.eraNumber,
        eon: expected.eonNumber,
        ...EXPECTED_POSITION_FIELDS,
        calendar_path: "/meme-calendar",
        mint_path: `/the-memes/${id}`,
      },
      { headers: MEME_CALENDAR_API_CACHE_HEADERS }
    );
  });

  it("returns division positions for a structured timeline mint", async () => {
    const response = await GET({} as any, {
      params: Promise.resolve({ id: "516" }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        mint_number: 516,
        season: 16,
        year: 4,
        epoch: 1,
        period: 1,
        era: 1,
        eon: 1,
        position_in_season: 1,
        position_in_year: 78,
        position_in_epoch: 469,
        position_in_period: 469,
        position_in_era: 469,
        position_in_eon: 469,
      })
    );
  });

  it("counts SZN1 positions from the historical first mint", async () => {
    const response = await GET({} as any, {
      params: Promise.resolve({ id: "47" }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        mint_number: 47,
        season: 1,
        year: 0,
        epoch: 0,
        period: 0,
        era: 0,
        eon: 0,
        position_in_season: 47,
        position_in_year: 47,
        position_in_epoch: 47,
        position_in_period: 47,
        position_in_era: 47,
        position_in_eon: 47,
      })
    );
  });

  it.each(["abc", "1.5", "-7", "0"])(
    "returns 400 for invalid id '%s'",
    async (id) => {
      const response = await GET({} as any, {
        params: Promise.resolve({ id }),
      });

      expect(response.status).toBe(400);
      expect(nextResponseJson).toHaveBeenCalledWith(
        {
          error:
            "Invalid id. Use a positive integer up to 100000 in /api/meme-calendar/<id>.",
        },
        { status: 400 }
      );
    }
  );

  it("returns 400 for oversized numeric ids", async () => {
    const response = await GET({} as any, {
      params: Promise.resolve({ id: "9007199254740992" }),
    });

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        error:
          "Invalid id. Use a positive integer up to 100000 in /api/meme-calendar/<id>.",
      },
      { status: 400 }
    );
  });

  it("returns 400 for values above the supported calendar lookup range", async () => {
    const response = await GET({} as any, {
      params: Promise.resolve({ id: "100001" }),
    });

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        error:
          "Invalid id. Use a positive integer up to 100000 in /api/meme-calendar/<id>.",
      },
      { status: 400 }
    );
  });
});
