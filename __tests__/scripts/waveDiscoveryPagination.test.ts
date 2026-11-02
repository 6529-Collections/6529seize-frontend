/** @jest-environment node */

import { fetchWaveDiscoveryPage } from "../../tests/social/waveDiscoveryPagination";

describe("Wave discovery pagination credentials", () => {
  const url = new URL("https://api.staging.6529.io/api/v2/waves?page=2");
  const cookies = jest.fn();
  const context = { cookies };
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    cookies.mockReset().mockResolvedValue([]);
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("preserves matching cookies and observed access without a Playwright request", async () => {
    cookies.mockResolvedValue([
      { name: "session", value: "cookie-sentinel" },
      { name: "preference", value: "en" },
    ]);
    const body = { data: [], page: 2, next: null };
    fetchMock.mockResolvedValue({ ok: true, json: async () => body });

    await expect(
      fetchWaveDiscoveryPage(context, url, "access-sentinel")
    ).resolves.toEqual(body);
    expect(cookies).toHaveBeenCalledWith(url.toString());
    expect(fetchMock).toHaveBeenCalledWith(url, {
      headers: {
        Cookie: "session=cookie-sentinel; preference=en",
        "x-6529-auth": "access-sentinel",
      },
      redirect: "error",
      signal: expect.any(AbortSignal),
    });
  });

  it("supports cookie-only access without requiring a staging header", async () => {
    cookies.mockResolvedValue([{ name: "session", value: "cookie-sentinel" }]);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ page: 2 }) });
    await fetchWaveDiscoveryPage(context, url, null);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Cookie: "session=cookie-sentinel",
    });
  });

  it("leaves public requests credential-free", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ page: 2 }) });
    await fetchWaveDiscoveryPage(context, url, null);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it.each(["transport", "redirect", "timeout"])(
    "redacts a %s failure and its cause",
    async (kind) => {
      fetchMock.mockRejectedValue(
        new Error(`${kind}: access-sentinel cookie-sentinel`)
      );
      const error = await fetchWaveDiscoveryPage(
        context,
        url,
        "access-sentinel"
      ).catch((failure: Error) => failure);
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        message: "Wave discovery pagination transport failed",
      });
      expect(error).not.toHaveProperty("cause");
      expect(String(error)).not.toContain("sentinel");
    }
  );

  it("reports HTTP status without including the response body", async () => {
    const json = jest.fn();
    fetchMock.mockResolvedValue({ ok: false, status: 403, json });
    await expect(
      fetchWaveDiscoveryPage(context, url, "access-sentinel")
    ).rejects.toThrow("Wave discovery pagination failed (HTTP 403)");
    expect(json).not.toHaveBeenCalled();
  });

  it("redacts invalid JSON errors that could contain response content", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("access-sentinel");
      },
    });
    await expect(fetchWaveDiscoveryPage(context, url, null)).rejects.toThrow(
      "Wave discovery pagination returned invalid JSON"
    );
  });
});
