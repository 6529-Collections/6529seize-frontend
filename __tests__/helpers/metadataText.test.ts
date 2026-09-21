import { toMetadataExcerpt } from "@/helpers/metadataText";

describe("toMetadataExcerpt", () => {
  it("removes HTML and Markdown while preserving readable text", () => {
    expect(
      toMetadataExcerpt(
        "<p>Casey &amp; friends</p> **study** [systems](https://example.com)"
      )
    ).toBe("Casey & friends study systems");
  });

  it("truncates at a word boundary", () => {
    expect(toMetadataExcerpt("one two three four five six", 20)).toBe(
      "one two three four…"
    );
  });

  it("ignores invalid numeric entities without breaking the excerpt", () => {
    expect(toMetadataExcerpt("Safe &#1114112; &#x110000; text")).toBe(
      "Safe text"
    );
  });
});
