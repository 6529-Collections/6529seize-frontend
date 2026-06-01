import {
  buildDropImageGalleryItems,
  getDropImageGalleryItemId,
} from "@/components/drops/view/part/dropImageGallery";

describe("buildDropImageGalleryItems", () => {
  it("includes markdown images", () => {
    const partContent = "hello ![drop](/image.png)";
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId(
          "body",
          partContent.indexOf("![drop]"),
          "/image.png"
        ),
        src: "/image.png",
        source: "body",
      }),
    ]);
  });

  it("includes bare direct image URLs", () => {
    const partContent = "https://cdn.example.com/image.gif?cache=1";
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId("body", 0, partContent),
        src: "https://cdn.example.com/image.gif?cache=1",
        source: "body",
      }),
    ]);
  });

  it("uses the wrapper start for angle-bracket bare image URL ids", () => {
    const partContent = "<https://cdn.example.com/image.jpg>";
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId(
          "body",
          partContent.indexOf("<"),
          "https://cdn.example.com/image.jpg"
        ),
        src: "https://cdn.example.com/image.jpg",
        source: "body",
      }),
    ]);
  });

  it("excludes normal named image links", () => {
    const items = buildDropImageGalleryItems({
      partContent: "[open image](https://cdn.example.com/image.jpg)",
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("includes bare direct image markdown links", () => {
    const imageSrc = "https://cdn.example.com/image.jpg";
    const partContent = `prefix [${imageSrc}](${imageSrc})`;
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId(
          "body",
          partContent.indexOf(`[${imageSrc}]`),
          imageSrc
        ),
        src: imageSrc,
        source: "body",
      }),
    ]);
  });

  it("excludes image URLs used as markdown link labels", () => {
    const items = buildDropImageGalleryItems({
      partContent:
        "[https://cdn.example.com/image.jpg](https://example.com/page)",
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("excludes bare markdown links to non-image pages", () => {
    const pageUrl = "https://cdn.example.com/gallery";
    const items = buildDropImageGalleryItems({
      partContent: `[${pageUrl}](${pageUrl})`,
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("excludes image URLs inside code", () => {
    const items = buildDropImageGalleryItems({
      partContent: [
        "`https://cdn.example.com/inline.jpg`",
        "",
        "```text",
        "https://cdn.example.com/block.jpg",
        "![hidden](https://cdn.example.com/hidden.jpg)",
        "```",
      ].join("\n"),
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("includes uploaded images", () => {
    const items = buildDropImageGalleryItems({
      partContent: null,
      partMedias: [{ mimeType: "image/png", mediaSrc: "upload.png" }],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId("media", 0, "upload.png"),
        src: "upload.png",
        source: "media",
      }),
    ]);
  });

  it("excludes uploaded video, audio, html, glb, and attachments", () => {
    const items = buildDropImageGalleryItems({
      partContent: null,
      partMedias: [
        { mimeType: "video/mp4", mediaSrc: "video.mp4" },
        { mimeType: "audio/mpeg", mediaSrc: "audio.mp3" },
        { mimeType: "text/html", mediaSrc: "index.html" },
        { mimeType: "model/gltf-binary", mediaSrc: "model.glb" },
      ],
    });

    expect(items).toEqual([]);
  });

  it("orders body images before uploaded images", () => {
    const items = buildDropImageGalleryItems({
      partContent: "![first](/body.png)",
      partMedias: [{ mimeType: "image/png", mediaSrc: "upload.png" }],
    });

    expect(items.map((item) => item.src)).toEqual([
      "/body.png",
      "upload.png",
    ]);
  });

  it("uses unique body image ids for duplicate URLs", () => {
    const partContent =
      "![first](https://cdn.example.com/same.jpg) ![second](https://cdn.example.com/same.jpg)";

    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId(
        "body",
        partContent.indexOf("![first]"),
        "https://cdn.example.com/same.jpg"
      ),
      getDropImageGalleryItemId(
        "body",
        partContent.indexOf("![second]"),
        "https://cdn.example.com/same.jpg"
      ),
    ]);
  });

  it("uses raw media indexes for uploaded image ids", () => {
    const items = buildDropImageGalleryItems({
      partContent: null,
      partMedias: [
        { mimeType: "image/png", mediaSrc: "duplicate.png" },
        { mimeType: "video/mp4", mediaSrc: "video.mp4" },
        { mimeType: "image/png", mediaSrc: "duplicate.png" },
      ],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId("media", 0, "duplicate.png"),
      getDropImageGalleryItemId("media", 2, "duplicate.png"),
    ]);
  });
});
