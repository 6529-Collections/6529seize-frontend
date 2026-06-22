const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
}));

import {
  getCurrentMintTimelineDetails,
  getNextMintTimelineDetails,
} from "@/app/api/meme-calendar/meme-calendar-response";
import { GET } from "@/app/api/meme-calendar/current/route";

describe("/api/meme-calendar/current", () => {
  beforeEach(() => {
    jest.useFakeTimers();
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

  it("returns the live mint when the current mint window is open", async () => {
    jest.setSystemTime(new Date("2024-07-03T15:00:00.000Z"));
    const expected = getCurrentMintTimelineDetails(new Date());
    expect(expected).not.toBeNull();
    if (!expected) {
      throw new Error("Expected a live mint timeline");
    }

    const response = await GET();

    expect(response.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith({
      status: "live",
      current: {
        mint_number: expected.mintNumber,
        mint_date: "2024-07-03",
        mint_start: "2024-07-03T14:40:00.000Z",
        mint_end: "2024-07-04T14:00:00.000Z",
        status: "live",
        season: expected.seasonNumber,
        year: expected.yearNumber,
        epoch: expected.epochNumber,
        period: expected.periodNumber,
        era: expected.eraNumber,
        eon: expected.eonNumber,
        calendar_path: "/meme-calendar",
        mint_path: `/the-memes/${expected.mintNumber}`,
      },
    });
  });

  it("returns the next mint when nothing is live", async () => {
    jest.setSystemTime(new Date("2024-07-03T12:00:00.000Z"));
    const expected = getNextMintTimelineDetails(new Date());

    const response = await GET();

    expect(response.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith({
      status: "none",
      current: null,
      next: expect.objectContaining({
        mint_number: expected.mintNumber,
        mint_start: "2024-07-03T14:40:00.000Z",
        mint_end: "2024-07-04T14:00:00.000Z",
        status: "upcoming",
      }),
    });
  });
});
