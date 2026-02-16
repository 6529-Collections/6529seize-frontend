const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

import {
  getMintTimelineDetails,
  toISO,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { GET } from "@/app/api/meme-calendar/[id]/route";

describe("/api/meme-calendar/[id]", () => {
  beforeEach(() => {
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

  it("returns mint calendar fields for a valid id", async () => {
    const id = 500;
    const expected = getMintTimelineDetails(id);

    const response = await GET({} as any, {
      params: Promise.resolve({ id: String(id) }),
    });

    expect(response.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith({
      mint_date: toISO(expected.instantUtc),
      season: expected.seasonNumber,
      year: expected.yearNumber,
      epoch: expected.epochNumber,
      period: expected.periodNumber,
      era: expected.eraNumber,
      eon: expected.eonNumber,
    });
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
            "Invalid id. Use a positive integer in /api/meme-calendar/<id>.",
        },
        { status: 400 }
      );
    }
  );
});
