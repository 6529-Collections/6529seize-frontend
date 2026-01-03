import {
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
});
