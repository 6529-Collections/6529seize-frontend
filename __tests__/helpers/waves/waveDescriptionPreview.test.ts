import {
  getWaveDescriptionPreviewText,
  markdownToPlainText,
} from "@/helpers/waves/waveDescriptionPreview";

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

  it("handles nested and escaped markdown delimiters", () => {
    expect(
      markdownToPlainText(
        "Docs [read [this]](https://example.com/path_(v1)) and [escaped](https://example.com/a\\)b)"
      )
    ).toBe(
      "Docs read [this] (https://example.com/path_(v1)) and escaped (https://example.com/a\\)b)"
    );
  });

  it("can omit link destinations and image URLs for bounded summaries", () => {
    expect(
      markdownToPlainText(
        "Read [the guide](https://example.com/path_(v1)) ![diagram](https://example.com/image.png)",
        {
          includeImageUrls: false,
          includeLinkDestinations: false,
        }
      )
    ).toBe("Read the guide");
  });

  const previewOf = (content: string) =>
    getWaveDescriptionPreviewText({
      description_drop: { parts: [{ content }] },
    } as any);

  it("omits image markdown instead of showing its URL", () => {
    expect(previewOf("Image ![alt](https://cdn.example.com/file.png)")).toBe(
      "Image"
    );
  });

  it("returns null for an image-only description on the media CDN", () => {
    expect(
      previewOf(
        "![Seize](https://d3lqz0a4bldqgf.cloudfront.net/drops/author_0f831714-87b4-11ee-9d82-029a0e4b6159/91ca9f63-e46e-4e34-ae62-2561b6ba6dcf/image.png)"
      )
    ).toBeNull();
  });

  it("omits bare media CDN and media-file URLs", () => {
    expect(
      previewOf(
        "Banner https://d3lqz0a4bldqgf.cloudfront.net/drops/author_x/y/giphy_downsized_medium and (clip: https://example.com/clip.mp4). Done"
      )
    ).toBe("Banner and (clip: ) Done");
  });

  it("omits 6529 drop and wave links that render as embeds", () => {
    expect(
      previewOf(
        "https://test.6529.io/waves/da16201a-f4d0-40cf-b888-9f3a4a86a894?serialNo=1518681"
      )
    ).toBeNull();
    expect(
      previewOf(
        "Read this https://test.6529.io/waves/da16201a-f4d0-40cf-b888-9f3a4a86a894?drop=abc and https://test.6529.io/waves/da16201a-f4d0-40cf-b888-9f3a4a86a894"
      )
    ).toBe("Read this and");
  });

  it("keeps the label of a markdown link to media", () => {
    expect(
      previewOf("See [the banner](https://d3lqz0a4bldqgf.cloudfront.net/x.png)")
    ).toBe("See the banner");
    expect(
      previewOf("See [](https://d3lqz0a4bldqgf.cloudfront.net/x.png)")
    ).toBe("See");
  });

  it("leaves no stray emphasis markers around an omitted URL", () => {
    expect(
      previewOf(
        "Costs **https://d3lqz0a4bldqgf.cloudfront.net/x.png** and *https://example.com/y.gif*"
      )
    ).toBe("Costs and");
  });

  it("handles long punctuation runs after a URL", () => {
    const punctuation = ".".repeat(5000);
    expect(previewOf(`Clip https://example.com/a.mp4${punctuation}x`)).toBe(
      `Clip https://example.com/a.mp4${punctuation}x`
    );
    expect(previewOf(`Clip https://example.com/a.mp4${punctuation}`)).toBe(
      "Clip"
    );
  });

  it("keeps external URLs", () => {
    expect(previewOf("Docs at https://example.com/guide.")).toBe(
      "Docs at https://example.com/guide."
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
