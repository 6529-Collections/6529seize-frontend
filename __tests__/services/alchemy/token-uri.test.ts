/** @jest-environment node */
import {
  fetchTokenUriMetadata,
  getTokenUriMetadataUrl,
} from "@/services/alchemy/token-uri";

jest.mock("@/config/env", () => ({
  publicEnv: { MEDIA_RESOLVER_ENDPOINT: "https://media.6529.io" },
}));

const tokenUri =
  "https://arweave.net/fLAMSnWmzM9tAso6xMRSSPC2ZYaRoqjRnqGKaxk7vRQ";
const image = "https://arweave.net/9zgKqfEqo7u1LbMKy34OTts6oUMatjH8HMNX97Lk-Rs";
const controller = () => new AbortController();

describe("original token metadata recovery", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("reads bounded original metadata through the existing resolver without credentials", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ name: "1. Deploy", image }))
      );
    await expect(
      fetchTokenUriMetadata(tokenUri, controller().signal)
    ).resolves.toEqual({ name: "1. Deploy", imageUrl: image });
    expect(fetchMock).toHaveBeenCalledWith(
      getTokenUriMetadataUrl(tokenUri),
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: expect.any(AbortSignal),
      })
    );
  });

  it.each([
    "https://unknown.example/metadata",
    "https://arweave.net.evil.example/metadata",
    "http://127.0.0.1/private",
    "javascript:alert(1)",
    "null",
  ])("does not fetch arbitrary metadata targets: %s", async (url) => {
    const fetchMock = jest.spyOn(globalThis, "fetch");
    await expect(
      fetchTokenUriMetadata(url, controller().signal)
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized metadata bodies", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("x".repeat(256 * 1024 + 1)));
    await expect(
      fetchTokenUriMetadata(tokenUri, controller().signal)
    ).rejects.toThrow("Body exceeds");
  });

  it("does not fetch a cancelled request", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");
    const abort = controller();
    abort.abort();
    await expect(
      fetchTokenUriMetadata(tokenUri, abort.signal)
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("times out a stalled metadata request", async () => {
    jest.useFakeTimers();
    jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => new Promise(() => {}));
    const result = expect(
      fetchTokenUriMetadata(tokenUri, controller().signal)
    ).rejects.toThrow("Token metadata timed out");
    await jest.advanceTimersByTimeAsync(4000);
    await result;
  });
});
