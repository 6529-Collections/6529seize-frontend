import { getDropContentPreview } from "@/helpers/waves/dropContentPreview";

describe("long drop detection", () => {
  it("keeps short messages and image-only posts complete", () => {
    expect(getDropContentPreview("A short post.").isLong).toBe(false);
    const images = Array.from(
      { length: 15 },
      (_, i) => `![Image ${i}](https://example.com/${i}.png)`
    ).join("\n");
    expect(getDropContentPreview(images).isLong).toBe(false);
  });

  it("recognizes long readable content and many authored lines", () => {
    expect(
      getDropContentPreview("A readable sentence. ".repeat(80)).isLong
    ).toBe(true);
    expect(
      getDropContentPreview(
        Array.from({ length: 21 }, (_, i) => `Line ${i}`).join("\n")
      ).isLong
    ).toBe(true);
  });

  it("does not count hidden link destinations as long text", () => {
    expect(
      getDropContentPreview(
        `[A link](https://example.com/${"path/".repeat(250)})`
      ).isLong
    ).toBe(false);
  });
});
