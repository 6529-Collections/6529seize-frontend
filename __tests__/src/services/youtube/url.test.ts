import {
  getYoutubeEmbedUrl,
  getYoutubeFetchUrl,
  getYoutubeWatchUrl,
  parseYoutubeLink,
  parseYoutubeStartSeconds,
} from "@/src/services/youtube/url";

describe("YouTube URL helpers", () => {
  it.each([
    ["https://youtu.be/abc123XYZ_0", "abc123XYZ_0"],
    ["https://www.youtube.com/watch?v=abc123XYZ_0", "abc123XYZ_0"],
    ["https://music.youtube.com/watch?v=abc123XYZ_0", "abc123XYZ_0"],
    ["https://www.youtube.com/shorts/abc123XYZ_0", "abc123XYZ_0"],
    ["https://www.youtube.com/live/abc123XYZ_0", "abc123XYZ_0"],
    ["https://www.youtube-nocookie.com/embed/abc123XYZ_0", "abc123XYZ_0"],
    ["https://www.youtube.com/v/abc123XYZ_0", "abc123XYZ_0"],
  ])("extracts a video id from %s", (href, videoId) => {
    expect(parseYoutubeLink(href)?.videoId).toBe(videoId);
  });

  it("preserves playlist context and start time", () => {
    const href =
      "https://music.youtube.com/watch?v=abc123XYZ_0&t=1m30s&list=PL123456&index=4";

    expect(parseYoutubeLink(href)).toEqual({
      videoId: "abc123XYZ_0",
      url: href,
      playlistId: "PL123456",
      playlistIndex: "4",
      startSeconds: 90,
    });
    expect(getYoutubeFetchUrl(href, "abc123XYZ_0")).toBe(
      "https://www.youtube.com/watch?v=abc123XYZ_0&list=PL123456&index=4"
    );
    expect(getYoutubeWatchUrl(href, "abc123XYZ_0")).toBe(
      "https://www.youtube.com/watch?v=abc123XYZ_0&list=PL123456&index=4&t=90s"
    );
    expect(getYoutubeEmbedUrl(href, "abc123XYZ_0")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123XYZ_0?rel=0&playsinline=1&list=PL123456&index=4&start=90"
    );
  });

  it.each([
    ["42", 42],
    ["42s", 42],
    ["2m", 120],
    ["1h2m3s", 3723],
    ["0", undefined],
    ["not-a-time", undefined],
  ])("parses start token %s", (value, expected) => {
    expect(parseYoutubeStartSeconds(value)).toBe(expected);
  });

  it("rejects unsupported YouTube paths and invalid ids", () => {
    expect(parseYoutubeLink("https://www.youtube.com/channel/UC123")).toBeNull();
    expect(parseYoutubeLink("https://www.youtube.com/watch?v=$bad")).toBeNull();
    expect(parseYoutubeLink("https://notyoutube.example/watch?v=abc123")).toBeNull();
  });
});
