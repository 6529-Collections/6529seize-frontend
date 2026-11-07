import {
  fetchViewerCountry,
  VIEWER_COUNTRY_PATH,
} from "@/components/cookies/viewerCountry";

const respond = (
  status: number,
  body: unknown,
  contentType = "application/json"
) =>
  jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-type" ? contentType : null,
      },
      json: () => Promise.resolve(body),
    })
  );

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch;
});

describe("fetchViewerCountry", () => {
  it("reads the same-origin edge country without credentials", async () => {
    const fetchMock = respond(200, { country: "US", is_eu: false });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const signal = new AbortController().signal;

    await expect(fetchViewerCountry(signal)).resolves.toEqual({
      country: "US",
      is_eu: false,
    });
    expect(VIEWER_COUNTRY_PATH).toBe("/e/country");
    expect(fetchMock).toHaveBeenCalledWith(
      "/e/country",
      expect.objectContaining({
        signal,
        credentials: "omit",
        cache: "no-store",
      })
    );
  });

  it.each([
    [
      { country: null, is_eu: true },
      { country: "", is_eu: true },
    ],
    [{}, { country: "", is_eu: true }],
    [null, { country: "", is_eu: true }],
    [
      { country: "FR", is_eu: true },
      { country: "FR", is_eu: true },
    ],
  ])("treats %p as %p", async (body, expected) => {
    globalThis.fetch = respond(200, body) as unknown as typeof fetch;
    await expect(
      fetchViewerCountry(new AbortController().signal)
    ).resolves.toEqual(expected);
  });

  it.each([
    [404, "text/html; charset=utf-8"],
    [200, "text/html; charset=utf-8"],
  ])(
    "resolves null for a host without the edge route (%p %p)",
    async (status, contentType) => {
      globalThis.fetch = respond(
        status,
        {},
        contentType
      ) as unknown as typeof fetch;
      await expect(
        fetchViewerCountry(new AbortController().signal)
      ).resolves.toBeNull();
    }
  );

  it("fails on an error status, so callers keep the unknown country", async () => {
    globalThis.fetch = respond(503, {}) as unknown as typeof fetch;
    await expect(
      fetchViewerCountry(new AbortController().signal)
    ).rejects.toThrow("503");
  });
});
