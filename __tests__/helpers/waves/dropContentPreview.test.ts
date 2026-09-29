import {
  getDropContentPreview,
  LONG_DROP_CONTENT_CHARACTER_THRESHOLD,
  LONG_DROP_CONTENT_LINE_THRESHOLD,
  LONG_DROP_PREVIEW_CHARACTER_LIMIT,
} from "@/helpers/waves/dropContentPreview";

describe("getDropContentPreview", () => {
  it("keeps short content unchanged", () => {
    expect(getDropContentPreview("A short post.")).toEqual({
      isLong: false,
      text: "A short post.",
    });
  });

  it("shortens long text at a word boundary", () => {
    const content = `${"readable ".repeat(
      LONG_DROP_CONTENT_CHARACTER_THRESHOLD
    )}ending`;

    const preview = getDropContentPreview(content);

    expect(preview.isLong).toBe(true);
    expect(preview.text.length).toBeLessThanOrEqual(
      LONG_DROP_PREVIEW_CHARACTER_LIMIT + 1
    );
    expect(preview.text).toMatch(/readable…$/);
  });

  it("treats many source lines as long without measuring the DOM", () => {
    const content = Array.from(
      { length: LONG_DROP_CONTENT_LINE_THRESHOLD + 1 },
      (_, index) => `Line ${index + 1}`
    ).join("\n");

    expect(getDropContentPreview(content)).toEqual({
      isLong: true,
      text: Array.from(
        { length: LONG_DROP_CONTENT_LINE_THRESHOLD + 1 },
        (_, index) => `Line ${index + 1}`
      ).join(" "),
    });
  });

  it("removes markdown destinations from the collapsed preview", () => {
    const content = [
      "# A long update",
      "[Readable label](https://example.com/private-path)",
      "![Image description](https://example.com/image.png)",
      ...Array.from(
        { length: LONG_DROP_CONTENT_LINE_THRESHOLD },
        (_, index) => `Detail ${index + 1}`
      ),
    ].join("\n");

    const preview = getDropContentPreview(content);

    expect(preview.isLong).toBe(true);
    expect(preview.text).toContain("Readable label");
    expect(preview.text).not.toContain("https://");
    expect(preview.text).not.toContain("Image description");
  });

  it("does not collapse markdown that has no readable text", () => {
    const content = Array.from(
      { length: LONG_DROP_CONTENT_LINE_THRESHOLD + 1 },
      (_, index) => `![Image ${index}](https://example.com/${index}.png)`
    ).join("\n");

    expect(getDropContentPreview(content)).toEqual({
      isLong: false,
      text: "",
    });
  });
});
