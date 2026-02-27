import { URL_PREVIEW_IMAGE_TRANSFORMER } from "@/components/drops/create/lexical/transformers/UrlPreviewImageTransformer";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "@/components/drops/create/lexical/nodes/urlPreviewImage.constants";

jest.mock("@/components/drops/create/lexical/nodes/ImageNode", () => ({
  $isImageNode: jest.fn((n) => n && n.type === "image"),
  ImageNode: class {},
}));

describe("URL_PREVIEW_IMAGE_TRANSFORMER", () => {
  it("exports plain URL for preview-marked image nodes", () => {
    const node: any = {
      type: "image",
      getAltText: () => URL_PREVIEW_IMAGE_ALT_TEXT,
      getSrc: () => "https://media.tenor.com/abc/tenor.gif",
    };

    expect(URL_PREVIEW_IMAGE_TRANSFORMER.export?.(node)).toBe(
      "https://media.tenor.com/abc/tenor.gif"
    );
  });

  it("returns null for non-preview image nodes", () => {
    const node: any = {
      type: "image",
      getAltText: () => "Seize",
      getSrc: () => "https://example.com/image.png",
    };

    expect(URL_PREVIEW_IMAGE_TRANSFORMER.export?.(node)).toBeNull();
  });

  it("uses a non-matching defensive regex for import-side behavior", () => {
    expect(URL_PREVIEW_IMAGE_TRANSFORMER.regExp.test("")).toBe(false);
    expect(
      URL_PREVIEW_IMAGE_TRANSFORMER.regExp.test(
        "https://media.tenor.com/abc/tenor.gif"
      )
    ).toBe(false);
    expect(
      URL_PREVIEW_IMAGE_TRANSFORMER.regExp.test("![Seize](https://x.com/a.png)")
    ).toBe(false);
  });

  it("has a safe no-op replace handler", () => {
    const children: any[] = [{ id: "node-1" }];
    const parentNode: any = { type: "paragraph" };
    const match = ["token"];

    expect(() =>
      URL_PREVIEW_IMAGE_TRANSFORMER.replace?.(parentNode, children, match, true)
    ).not.toThrow();
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ id: "node-1" });
  });
});
