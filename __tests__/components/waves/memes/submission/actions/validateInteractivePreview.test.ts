import { validateInteractivePreview } from "@/components/waves/memes/submission/actions/validateInteractivePreview";
import { INTERACTIVE_MEDIA_GATEWAY_BASE_URL } from "@/components/waves/memes/submission/constants/security";

const CID_V1 = "bafybeigdyrztobg3tv6zj5n6xvztf4k5p3xf7r6xkqfq5jz3o5quftdjum";
const ARWEAVE_TX_ID = "QW_ArkGRZa0uSmLkH2ZAzU9xOQFfGqVsRyCrND3eOo8";

const originalFetch = global.fetch;

type MockResponse = {
  status: number;
  ok: boolean;
  url: string;
  headers: {
    get: (name: string) => string | null;
  };
  body: {
    cancel: () => Promise<void>;
  } | null;
};

const createResponse = (
  status: number,
  headers: Record<string, string>,
  url = `https://media.6529.io/ipfs/${CID_V1}`
): MockResponse => {
  const headerStore = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  const includeBody = status === 206;

  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => headerStore.get(name.toLowerCase()) ?? null,
    },
    url,
    body: includeBody
      ? {
          cancel: async () => {},
        }
      : null,
  };
};

describe("validateInteractivePreview", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("accepts HTML content served over an approved gateway", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, { "content-type": "text/html; charset=utf-8" })
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(true);
    expect(result.contentType).toBe("text/html; charset=utf-8");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining(`https://media.6529.io/ipfs/${CID_V1}`),
      expect.objectContaining({ method: "HEAD" })
    );
  });

  it("falls back to a ranged GET when HEAD is unsupported", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        createResponse(405, { "content-type": "text/plain" })
      )
      .mockResolvedValueOnce(
        createResponse(
          206,
          { "content-type": "text/html" },
          `https://media.6529.io/arweave/${ARWEAVE_TX_ID}`
        )
      );

    const result = await validateInteractivePreview({
      provider: "arweave",
      path: ARWEAVE_TX_ID,
    });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(`https://media.6529.io/arweave/${ARWEAVE_TX_ID}`),
      expect.objectContaining({
        method: "GET",
        headers: { Range: "bytes=0-1024" },
      })
    );
  });

  it("accepts HTML content served from an arweave subdomain", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { "content-type": "text/html" },
        `https://${ARWEAVE_TX_ID.toLowerCase()}.arweave.net/`
      )
    );

    const result = await validateInteractivePreview({
      provider: "arweave",
      path: ARWEAVE_TX_ID,
    });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects responses with disallowed content types", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, { "content-type": "application/octet-stream" })
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Media must respond with an HTML document.");
  });

  it("fails when the gateway redirects to an unapproved host", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { "content-type": "text/html" },
        "https://example.com/bad"
      )
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gateway redirected to an unapproved host.");
  });

  it("propagates network failures as validation errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Unable to reach the content gateway.");
  });

  it("fails fast when HEAD request returns 400 without retrying GET", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(400, { "content-type": "text/plain" })
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gateway returned 400.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("accepts responses from trailing-dot hosts after canonicalization", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { "content-type": "text/html" },
        `https://ipfs.io./ipfs/${CID_V1}`
      )
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects responses that include credentials", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { "content-type": "text/html" },
        `https://user:pass@ipfs.io/ipfs/${CID_V1}`
      )
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gateway redirected to an unapproved host.");
  });

  it("rejects responses that use a non-default https port", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { "content-type": "text/html" },
        `https://ipfs.io:444/ipfs/${CID_V1}`
      )
    );

    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: CID_V1,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gateway redirected to an unapproved host.");
  });

  it("rejects identifiers containing path separators before requesting the gateway", async () => {
    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: `${CID_V1}/index.html`,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(
      "Invalid path: only relative paths under the gateway origin are allowed."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects identifiers that do not match provider expectations", async () => {
    const result = await validateInteractivePreview({
      provider: "ipfs",
      path: "not-a-valid-cid",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(
      "Invalid path: expected a CIDv0 or CIDv1 root hash."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe("redirect handling", () => {
    const REDIRECT_TARGET = `https://ipfs.io/ipfs/${CID_V1}`;

    it("requests the gateway without following redirects implicitly", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createResponse(200, { "content-type": "text/html" })
      );

      await validateInteractivePreview({ provider: "ipfs", path: CID_V1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ redirect: "manual" })
      );
    });

    it("follows a redirect to an approved gateway host", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          createResponse(302, { location: REDIRECT_TARGET })
        )
        .mockResolvedValueOnce(
          createResponse(200, { "content-type": "text/html" }, REDIRECT_TARGET)
        );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(true);
      expect(result.finalUrl).toBe(REDIRECT_TARGET);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        REDIRECT_TARGET,
        expect.objectContaining({ method: "HEAD", redirect: "manual" })
      );
    });

    it("resolves relative redirect locations against the current hop", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          createResponse(301, { location: `/ipfs/${CID_V1}` })
        )
        .mockResolvedValueOnce(
          createResponse(200, { "content-type": "text/html" })
        );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `https://media.6529.io/ipfs/${CID_V1}`,
        expect.anything()
      );
    });

    it.each([
      ["an unapproved host", "https://example.com/ipfs/redirected"],
      ["a plain-http URL", `http://ipfs.io/ipfs/${CID_V1}`],
      ["a URL with credentials", `https://user:pass@ipfs.io/ipfs/${CID_V1}`],
      ["a non-default port", `https://ipfs.io:8443/ipfs/${CID_V1}`],
      ["a loopback address", "https://127.0.0.1/ipfs/redirected"],
      ["an unapproved path on an approved host", "https://ipfs.io/api/v0/id"],
    ])("does not follow a redirect to %s", async (_label, location) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createResponse(302, { location })
      );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected to an unapproved host.");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("rejects an approved hop that redirects onward to an unapproved host", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          createResponse(307, { location: REDIRECT_TARGET })
        )
        .mockResolvedValueOnce(
          createResponse(308, { location: "https://example.com/next" })
        );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected to an unapproved host.");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("rejects redirects without a usable location", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(createResponse(302, {}));

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected to an unapproved host.");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("stops after the redirect cap", async () => {
      (global.fetch as jest.Mock).mockImplementation(async () =>
        createResponse(302, { location: REDIRECT_TARGET })
      );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected too many times.");
      // The initial request plus three followed redirects.
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it("starts the GET fallback at the approved address HEAD reached", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createResponse(302, { location: REDIRECT_TARGET }))
        .mockResolvedValueOnce(
          createResponse(405, { "content-type": "text/plain" }, REDIRECT_TARGET)
        )
        .mockResolvedValueOnce(
          createResponse(206, { "content-type": "text/html" }, REDIRECT_TARGET)
        );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        REDIRECT_TARGET,
        expect.objectContaining({ method: "GET", redirect: "manual" })
      );
    });

    it("shares one redirect cap between HEAD and the ranged GET fallback", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createResponse(302, { location: REDIRECT_TARGET }))
        .mockResolvedValueOnce(createResponse(302, { location: REDIRECT_TARGET }))
        .mockResolvedValueOnce(createResponse(302, { location: REDIRECT_TARGET }))
        .mockResolvedValueOnce(createResponse(405, {}, REDIRECT_TARGET))
        .mockResolvedValueOnce(createResponse(302, { location: REDIRECT_TARGET }));

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected too many times.");
      // HEAD used the whole budget (initial request plus three redirects), so
      // the fallback GET, which starts at HEAD's final address, cannot follow
      // another redirect.
      expect(global.fetch).toHaveBeenCalledTimes(5);
      expect(global.fetch).toHaveBeenNthCalledWith(
        5,
        REDIRECT_TARGET,
        expect.objectContaining({ method: "GET" })
      );
    });

    it("applies the redirect guard to the ranged GET fallback as well", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createResponse(405, {}))
        .mockResolvedValueOnce(
          createResponse(302, { location: "https://example.com/bad" })
        );

      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("Gateway redirected to an unapproved host.");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({ method: "GET", redirect: "manual" })
      );
    });
  });

  it("rejects requests whose resolved target host is unapproved before making a network call", async () => {
    const originalBase = INTERACTIVE_MEDIA_GATEWAY_BASE_URL.ipfs;
    INTERACTIVE_MEDIA_GATEWAY_BASE_URL.ipfs = "https://example.com/";

    try {
      const result = await validateInteractivePreview({
        provider: "ipfs",
        path: CID_V1,
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe(
        "Invalid path: resolved target is not permitted under allowed gateway hosts."
      );
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      INTERACTIVE_MEDIA_GATEWAY_BASE_URL.ipfs = originalBase;
    }
  });
});
