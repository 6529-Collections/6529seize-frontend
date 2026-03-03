import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";

describe("getWaveDescriptionPreviewText", () => {
  it("returns a cleaned one-line preview from first description part", () => {
    const wave = {
      description_drop: {
        parts: [
          {
            content: "  Hello **world**\n\nwith [link](https://example.com)  ",
          },
        ],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBe(
      "Hello world with link (https://example.com)"
    );
  });

  it("returns null when content is empty or whitespace", () => {
    const wave = {
      description_drop: {
        parts: [{ content: "   \n\t " }],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBeNull();
  });

  it("only uses first part content", () => {
    const wave = {
      description_drop: {
        parts: [{ content: "First part" }, { content: "Second part" }],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBe("First part");
  });

  it("returns null when wave or description is missing", () => {
    expect(getWaveDescriptionPreviewText(null)).toBeNull();
    expect(getWaveDescriptionPreviewText(undefined)).toBeNull();
    expect(getWaveDescriptionPreviewText({} as any)).toBeNull();
  });

  it("handles links with nested parentheses", () => {
    const wave = {
      description_drop: {
        parts: [
          {
            content: "Docs [readme](https://example.com/path_(v1)) today",
          },
        ],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBe(
      "Docs readme (https://example.com/path_(v1)) today"
    );
  });

  it("keeps image markdown as URL text", () => {
    const wave = {
      description_drop: {
        parts: [{ content: "Image ![alt](https://cdn.example.com/file.png)" }],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBe(
      "Image https://cdn.example.com/file.png"
    );
  });

  it("preserves malformed markdown links without crashing", () => {
    const wave = {
      description_drop: {
        parts: [
          { content: "Broken [link](https://example.com/path( still open" },
        ],
      },
    } as any;

    expect(getWaveDescriptionPreviewText(wave)).toBe(
      "Broken [link](https://example.com/path( still open"
    );
  });
});
