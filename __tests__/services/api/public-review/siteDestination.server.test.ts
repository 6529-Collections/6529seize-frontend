jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { fetchSitePublicReviewDiscussionDestination } from "@/services/api/public-review/destination.server";

const STAGING_WAVE_ID = "22222222-2222-4222-8222-222222222222";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("public review destination from the site", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads the destination from the site's API and keeps it", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        environment: "staging",
        logicalKey: "stream-review",
        waveId: STAGING_WAVE_ID.toUpperCase(),
      })
    );
    const request = {
      environment: "staging",
      logicalKey: "stream-review",
      path: "/api/public-reviews/6529-stream/destination",
      siteOrigin: "https://staging.6529.io",
    } as const;

    await expect(
      fetchSitePublicReviewDiscussionDestination(request)
    ).resolves.toEqual({
      environment: "staging",
      logicalKey: "stream-review",
      waveId: STAGING_WAVE_ID,
    });
    await fetchSitePublicReviewDiscussionDestination(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://staging.6529.io/api/public-reviews/6529-stream/destination"
    );
    expect(init.redirect).toBe("error");
  });

  it("rejects a destination for another environment", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        environment: "production",
        logicalKey: "stream-review",
        waveId: STAGING_WAVE_ID,
      })
    );

    await expect(
      fetchSitePublicReviewDiscussionDestination({
        environment: "staging",
        logicalKey: "stream-review",
        path: "/api/public-reviews/6529-stream/destination?environment",
        siteOrigin: "https://staging.6529.io",
      })
    ).rejects.toThrow("invalid public review destination");
  });

  it("rejects a Wave id that is not a Wave id", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        environment: "staging",
        logicalKey: "stream-review",
        waveId: "not-a-wave",
      })
    );

    await expect(
      fetchSitePublicReviewDiscussionDestination({
        environment: "staging",
        logicalKey: "stream-review",
        path: "/api/public-reviews/6529-stream/destination?wave",
        siteOrigin: "https://staging.6529.io",
      })
    ).rejects.toThrow("invalid public review destination");
  });

  it("does not keep a failed answer", async () => {
    const request = {
      environment: "staging",
      logicalKey: "stream-review",
      path: "/api/public-reviews/6529-stream/destination?retry",
      siteOrigin: "https://staging.6529.io",
    } as const;
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Not found." }, 404));

    await expect(
      fetchSitePublicReviewDiscussionDestination(request)
    ).rejects.toThrow("unavailable (HTTP 404)");

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        environment: "staging",
        logicalKey: "stream-review",
        waveId: STAGING_WAVE_ID,
      })
    );
    await expect(
      fetchSitePublicReviewDiscussionDestination(request)
    ).resolves.toMatchObject({ waveId: STAGING_WAVE_ID });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not leave the site", async () => {
    await expect(
      fetchSitePublicReviewDiscussionDestination({
        environment: "staging",
        logicalKey: "stream-review",
        path: "https://example.com/destination",
        siteOrigin: "https://staging.6529.io",
      })
    ).rejects.toThrow("leaves the site");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
