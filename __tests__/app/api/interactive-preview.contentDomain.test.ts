import { validateInteractivePreview } from "@/app/api/interactive-preview/validateInteractivePreview";
import { INTERACTIVE_MEDIA_GATEWAY_BASE_URL } from "@/components/waves/memes/submission/constants/security";

const CID_V1 = "bafybeigdyrztobg3tv6zj5n6xvztf4k5p3xf7r6xkqfq5jz3o5quftdjum";
const ARWEAVE_TX_ID = "QW_ArkGRZa0uSmLkH2ZAzU9xOQFfGqVsRyCrND3eOo8";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    publicEnv: {
      ...actual.publicEnv,
      MEDIA_RESOLVER_ENDPOINT: "https://media.6529usercontent.com",
    },
  };
});

const originalFetch = global.fetch;

function response(
  status: number,
  url: string,
  headers: Record<string, string> = { "content-type": "text/html" }
): Response {
  const store = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    status,
    ok: status >= 200 && status < 300,
    url,
    headers: { get: (name: string) => store.get(name.toLowerCase()) ?? null },
    body: null,
  } as unknown as Response;
}

describe("validateInteractivePreview with the content-domain resolver", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("checks content on the content-domain path host", async () => {
    expect(INTERACTIVE_MEDIA_GATEWAY_BASE_URL).toEqual({
      ipfs: "https://media.6529usercontent.com/ipfs/",
      arweave: "https://media.6529usercontent.com/arweave/",
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      response(200, `https://media.6529usercontent.com/ipfs/${CID_V1}`)
    );

    await expect(
      validateInteractivePreview({ provider: "ipfs", path: CID_V1 })
    ).resolves.toEqual(expect.objectContaining({ ok: true }));
    expect(global.fetch).toHaveBeenCalledWith(
      `https://media.6529usercontent.com/ipfs/${CID_V1}`,
      expect.objectContaining({ method: "HEAD", redirect: "manual" })
    );
  });

  it("follows a redirect to the CID's own host on the content domain", async () => {
    const isolated = `https://${CID_V1}.ipfs.6529usercontent.com/`;
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        response(301, `https://media.6529usercontent.com/ipfs/${CID_V1}`, {
          location: isolated,
        })
      )
      .mockResolvedValueOnce(response(200, isolated));

    await expect(
      validateInteractivePreview({ provider: "ipfs", path: CID_V1 })
    ).resolves.toEqual(expect.objectContaining({ ok: true }));
    expect(global.fetch).toHaveBeenLastCalledWith(
      isolated,
      expect.objectContaining({ method: "HEAD" })
    );
  });

  it.each([
    "https://evil.example/",
    "https://6529usercontent.com/",
    "https://not-a-cid.ipfs.6529usercontent.com/",
    `http://${CID_V1}.ipfs.6529usercontent.com/`,
    `https://${CID_V1}.ipfs.6529usercontent.com:8443/`,
    `https://${CID_V1}.ipfs.6529usercontent.com/script.js`,
  ])("refuses a redirect to %s", async (location) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      response(302, `https://media.6529usercontent.com/ipfs/${CID_V1}`, {
        location,
      })
    );

    await expect(
      validateInteractivePreview({ provider: "ipfs", path: CID_V1 })
    ).resolves.toEqual({
      ok: false,
      reason: "Gateway redirected to an unapproved host.",
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps Arweave checks on the path host", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      response(200, `https://media.6529usercontent.com/arweave/${ARWEAVE_TX_ID}`)
    );

    await expect(
      validateInteractivePreview({ provider: "arweave", path: ARWEAVE_TX_ID })
    ).resolves.toEqual(expect.objectContaining({ ok: true }));
    expect(global.fetch).toHaveBeenCalledWith(
      `https://media.6529usercontent.com/arweave/${ARWEAVE_TX_ID}`,
      expect.anything()
    );
  });
});
