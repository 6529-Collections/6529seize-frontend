import {
  getVideoConversions,
  isVideoUrl,
  checkVideoAvailability,
} from "@/helpers/video.helpers";

beforeEach(() => {
  jest.resetAllMocks();
});

describe("video helpers", () => {
  it("detects video url", () => {
    expect(isVideoUrl("file.mp4")).toBe(true);
    expect(isVideoUrl("file.txt")).toBe(false);
  });

  it("creates conversion urls", () => {
    const url = "https://d3lqz0a4bldqgf.cloudfront.net/drops/foo/bar.mp4";
    const result = getVideoConversions(url);
    expect(result).not.toBeNull();
    expect(result!.HLS).toContain("renditions");
  });

  it("checks availability using fetch", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;
    const ok = await checkVideoAvailability("u");
    expect(fetchMock).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it("deduplicates in-flight availability checks", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;

    const [first, second] = await Promise.all([
      checkVideoAvailability("dedupe.mp4"),
      checkVideoAvailability("dedupe.mp4"),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("briefly caches network failures", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network"));
    (global as any).fetch = fetchMock;

    const first = await checkVideoAvailability("network-failure.mp4");
    const second = await checkVideoAvailability("network-failure.mp4");

    expect(first).toBe(false);
    expect(second).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("evicts old availability cache entries when the cache grows too large", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;
    const urls = Array.from(
      { length: 501 },
      (_, i) => `bounded-cache-${i}.mp4`
    );

    for (const url of urls) {
      await checkVideoAvailability(url);
    }
    await checkVideoAvailability(urls[0]!);

    expect(fetchMock).toHaveBeenCalledTimes(502);
  });
});
