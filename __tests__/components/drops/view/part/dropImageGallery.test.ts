import { buildDropImageGalleryItems } from "@/components/drops/view/part/dropImageGallery";

describe("buildDropImageGalleryItems", () => {
  it("includes markdown images", () => {
    const items = buildDropImageGalleryItems({
      partContent: "hello ![drop](/image.png)",
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        src: "/image.png",
        source: "body",
      }),
    ]);
  });

  it("includes bare direct image URLs", () => {
    const items = buildDropImageGalleryItems({
      partContent: "https://cdn.example.com/image.gif?cache=1",
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        src: "https://cdn.example.com/image.gif?cache=1",
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

  it("excludes image URLs used as markdown link labels", () => {
    const items = buildDropImageGalleryItems({
      partContent:
        "[https://cdn.example.com/image.jpg](https://example.com/page)",
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
});
