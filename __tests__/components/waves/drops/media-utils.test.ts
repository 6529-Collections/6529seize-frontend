import {
  parseStandaloneMediaUrl,
  isVideoMimeType,
  processContent,
} from "@/components/waves/drops/media-utils";

describe("media-utils", () => {
  it("detects video mime types", () => {
    expect(isVideoMimeType("video/mp4")).toBe(true);
    expect(isVideoMimeType("image/png")).toBe(false);
  });

  it("processes markdown content and extracts media", () => {
    const result = processContent(
      "Hello @[bob]! ![v](https://x.com/a.mp4) end ![i](img.jpg)",
      []
    );
    expect(result.segments[0]).toEqual({
      type: "text",
      content: "Hello @bob!",
    });
    expect(result.segments[1]?.mediaInfo?.type).toBe("video");
    expect(result.segments[2]).toEqual({ type: "text", content: "end" });
  });

  it("parses standalone gif URLs into image media", () => {
    expect(parseStandaloneMediaUrl("https://cdn.example.com/a.gif")).toEqual({
      alt: "Media",
      url: "https://cdn.example.com/a.gif",
      type: "image",
    });
  });

  it("parses gif hosts with query parameters as image media", () => {
    expect(
      parseStandaloneMediaUrl("https://media.tenor.com/abc/tenor.gif?itemid=1")
    ).toEqual({
      alt: "Media",
      url: "https://media.tenor.com/abc/tenor.gif?itemid=1",
      type: "image",
    });

    expect(
      parseStandaloneMediaUrl("https://media1.giphy.com/media/abc/giphy.gif")
    ).toEqual({
      alt: "Media",
      url: "https://media1.giphy.com/media/abc/giphy.gif",
      type: "image",
    });
  });

  it("parses standalone video URLs into video media", () => {
    expect(parseStandaloneMediaUrl("https://cdn.example.com/a.mp4")).toEqual({
      alt: "Media",
      url: "https://cdn.example.com/a.mp4",
      type: "video",
    });
  });

  it("returns null for non-media URLs", () => {
    expect(parseStandaloneMediaUrl("https://example.com/page")).toBeNull();
  });

  it("returns null when text contains non-url content", () => {
    expect(
      parseStandaloneMediaUrl("look https://cdn.example.com/a.gif")
    ).toBeNull();
  });
});
