import {
  INTERACTIVE_PREVIEW_ENDPOINT,
  requestInteractivePreviewValidation,
} from "@/services/api/interactive-preview-api";

const CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

describe("requestInteractivePreviewValidation", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  function respond(status: number, body: unknown): void {
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });
  }

  it("posts the provider and path as JSON to the same-origin route", async () => {
    respond(200, {
      ok: true,
      finalUrl: `https://media.6529.io/ipfs/${CID}`,
      contentType: "text/html",
    });

    await expect(
      requestInteractivePreviewValidation({ provider: "ipfs", path: CID })
    ).resolves.toEqual({
      ok: true,
      reason: undefined,
      finalUrl: `https://media.6529.io/ipfs/${CID}`,
      contentType: "text/html",
    });
    expect(INTERACTIVE_PREVIEW_ENDPOINT).toBe("/api/interactive-preview");
    expect(fetchMock).toHaveBeenCalledWith("/api/interactive-preview", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ provider: "ipfs", path: CID }),
    });
  });

  it("returns an invalid result with its reason", async () => {
    respond(200, { ok: false, reason: "Gateway returned 404." });

    await expect(
      requestInteractivePreviewValidation({ provider: "arweave", path: CID })
    ).resolves.toEqual({
      ok: false,
      reason: "Gateway returned 404.",
      finalUrl: undefined,
      contentType: null,
    });
  });

  it.each([403, 413, 429, 500])(
    "throws when the route answers %s",
    async (status) => {
      respond(status, { error: "rejected" });

      await expect(
        requestInteractivePreviewValidation({ provider: "ipfs", path: CID })
      ).rejects.toThrow(`status ${status}`);
    }
  );

  it("throws on a body that is not a validation result", async () => {
    respond(200, { error: "unexpected" });

    await expect(
      requestInteractivePreviewValidation({ provider: "ipfs", path: CID })
    ).rejects.toThrow("unexpected body");
  });
});
