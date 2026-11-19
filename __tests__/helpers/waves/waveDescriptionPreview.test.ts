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

  it.each([
    "https://example.com/a_b_c",
    "https://example.com/_a_",
    "https://example.com/a__b__c__",
    "https://example.com/path?v=a_b_c",
  ])("preserves bare URL punctuation: %s", (url) => {
    expect(markdownToPlainText(`Read ${url}.`)).toBe(`Read ${url}.`);
    expect(markdownToPlainText(`**Read ${url}**.`)).toBe(`Read ${url}.`);
  });

  it("preserves literal token-like text alongside URLs", () => {
    const text = "\u00000\u0000 https://example.com/a_b_c";
    expect(markdownToPlainText(text)).toBe(text);
    const privateUseText = "\uE0000\uE0000\uE000 https://example.com/a_b_c";
    expect(markdownToPlainText(privateUseText)).toBe(privateUseText);
  });

  it.each(["\uE0005\uE000", "\uE000abc\uE000", "\uE0000\uE000"])(
    "preserves private-use characters in prose: %s",
    (literal) => {
      const text = `Before ${literal} after`;
      expect(markdownToPlainText(text)).toBe(text);
    }
  );

  it("preserves marker-like text formed by removing emphasis", () => {
    expect(
      markdownToPlainText("\uE000**0**\uE0000\uE000 https://example.com/a_b_c")
    ).toBe("\uE0000\uE0000\uE000 https://example.com/a_b_c");
  });

  it("preserves private-use characters inside bare URLs", () => {
    const text = "https://example.com/a\uE000_b_c";
    expect(markdownToPlainText(text)).toBe(text);
  });

  it.each(["", "0", "1", "10"])(
    "preserves inline images separated by %j",
    (separator) => {
      const text = `![First](https://example.com/first.png)${separator}![Second](https://example.com/second.png)`;
      expect(markdownToPlainText(text, { preserveImageMarkdown: true })).toBe(
        text
      );
    }
  );

  it("pairs emphasis around an image and a bare URL", () => {
    expect(
      markdownToPlainText(
        "*![Cover](https://example.com/cover.png) https://example.com/a_b_c*",
        { preserveImageMarkdown: true }
      )
    ).toBe("![Cover](https://example.com/cover.png) https://example.com/a_b_c");
  });

  it("preserves content when no private-use marker is available", () => {
    const characters = Array.from({ length: 0x1900 }, (_, index) =>
      String.fromCodePoint(0xe000 + index)
    ).join("");
    const text = `${characters} **text** https://example.com/a_b_c`;
    expect(markdownToPlainText(text)).toBe(text);
  });

  it("removes formatting around images while retaining their markup", () => {
    expect(
      markdownToPlainText(
        "**_See ![Cover](https://example.com/a_b.png) here_**",
        {
          includeLinkDestinations: false,
          preserveImageMarkdown: true,
        }
      )
    ).toBe("See ![Cover](https://example.com/a_b.png) here");
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
