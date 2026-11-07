import {
  DIAGNOSTICS_ENDPOINT,
  encodeBundle,
  sendDiagnostics,
  type DiagnosticsBundle,
} from "@/services/diagnostics/sendDiagnostics";

const bundle: DiagnosticsBundle = {
  v: 1,
  captured_at: 1762423200000,
  app_version: "4.99.0",
  platform: "web",
  device: "desktop",
  browser: "chrome 142",
  flags: ["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"],
  route: "/waves/[wave]",
  entries: [{ at: 1762423199000, k: "nav", route: "/waves/[wave]" }],
  previous: null,
};

const decode = (body: string) => {
  const parsed = JSON.parse(body) as {
    v: number;
    encoding: string;
    data: string;
  };
  return {
    ...parsed,
    bundle: JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(parsed.data), (c) => c.charCodeAt(0))
      )
    ) as unknown,
  };
};

const respond = (status: number, json: unknown = {}) =>
  jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(json),
    })
  );

describe("encodeBundle", () => {
  it("wraps the exact bundle as base64 in the /e/diag envelope", async () => {
    const { body, decodedBytes } = await encodeBundle(bundle);
    const decoded = decode(body);
    expect(decoded).toMatchObject({ v: 1, encoding: "identity" });
    expect(decoded.bundle).toEqual(bundle);
    expect(decodedBytes).toBe(
      new TextEncoder().encode(JSON.stringify(bundle)).length
    );
  });
});

describe("sendDiagnostics", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  it("posts the bundle without credentials and returns the short code", async () => {
    const fetchMock = respond(201, {
      code: "D-7K3Q-9XW2",
      expires_at: "2026-11-21T10:00:00Z",
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await expect(sendDiagnostics(bundle)).resolves.toEqual({
      ok: true,
      code: "D-7K3Q-9XW2",
      expiresAt: "2026-11-21T10:00:00Z",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      DIAGNOSTICS_ENDPOINT,
      expect.objectContaining({ method: "POST", credentials: "omit" })
    );
    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(decode(init.body as string).bundle).toEqual(bundle);
  });

  it.each([
    [413, "too_large"],
    [429, "rate_limited"],
    [503, "unavailable"],
    [500, "failed"],
    [400, "failed"],
  ])("maps HTTP %p to %p", async (status, reason) => {
    globalThis.fetch = respond(status) as unknown as typeof fetch;
    await expect(sendDiagnostics(bundle)).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it("rejects a malformed code", async () => {
    globalThis.fetch = respond(201, {
      code: "<b>x</b>",
    }) as unknown as typeof fetch;
    await expect(sendDiagnostics(bundle)).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("reports offline when the request fails", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.reject(new TypeError("Failed to fetch"))
    ) as unknown as typeof fetch;
    await expect(sendDiagnostics(bundle)).resolves.toEqual({
      ok: false,
      reason: "offline",
    });
  });

  it("does not send a bundle above the 256 KB limit", async () => {
    const fetchMock = respond(201);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await expect(
      sendDiagnostics({
        ...bundle,
        screenshot: `data:image/jpeg;base64,${"A".repeat(300_000)}`,
      })
    ).resolves.toEqual({ ok: false, reason: "too_large" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
