const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
}));

import {
  MEME_CALENDAR_API_CACHE_HEADERS,
  getNextMintTimelineDetails,
  getMintTimelineStatus,
} from "@/app/api/meme-calendar/meme-calendar-response";
import { GET } from "@/app/api/meme-calendar/next/route";

describe("/api/meme-calendar/next", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-07-03T12:00:00.000Z"));
    nextResponseJson.mockReset();
    nextResponseJson.mockImplementation((body: unknown) => ({
      status: 200,
      body,
      json: async () => body,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the next upcoming mint with its full mint window", async () => {
    const now = new Date();
    const expected = getNextMintTimelineDetails(now);
    const response = await GET();

    expect(response.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        mint_number: expected.mintNumber,
        mint_date: "2024-07-03",
        mint_start: "2024-07-03T14:40:00.000Z",
        mint_end: "2024-07-04T14:00:00.000Z",
        status: getMintTimelineStatus(expected, now),
        season: expected.seasonNumber,
        year: expected.yearNumber,
        epoch: expected.epochNumber,
        period: expected.periodNumber,
        era: expected.eraNumber,
        eon: expected.eonNumber,
        position_in_season: 2,
        position_in_year: 67,
        position_in_epoch: 200,
        position_in_period: 200,
        position_in_era: 200,
        position_in_eon: 200,
        calendar_path: "/meme-calendar",
        mint_path: `/the-memes/${expected.mintNumber}`,
      },
      { headers: MEME_CALENDAR_API_CACHE_HEADERS }
    );
  });
});
