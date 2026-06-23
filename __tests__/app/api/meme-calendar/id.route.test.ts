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
        calendar_path: "/meme-calendar",
        mint_path: `/the-memes/${id}`,
      },
      { headers: MEME_CALENDAR_API_CACHE_HEADERS }
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

  it("returns 400 for values above max safe integer", async () => {
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
