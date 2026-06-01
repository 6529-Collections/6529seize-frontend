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

  it("excludes image URLs from markdown reference definitions", () => {
    const items = buildDropImageGalleryItems({
      partContent: "[img]: https://cdn.example.com/hidden.jpg",
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("uses reference image definitions at the rendered image use site", () => {
    const imageSrc = "https://cdn.example.com/referenced.jpg";
    const partContent = [
      "prefix ![Referenced][img]",
      "",
      `[img]: ${imageSrc}`,
    ].join("\n");
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: getDropImageGalleryItemId(
          "body",
          partContent.indexOf("![Referenced][img]"),
          imageSrc
        ),
        src: imageSrc,
        source: "body",
      }),
    ]);
  });

  it("uses unique body image ids for duplicate reference images", () => {
    const imageSrc = "https://cdn.example.com/same-reference.jpg";
    const partContent = [
      "![first][img]",
      "![second][img]",
      "",
      `[img]: ${imageSrc}`,
    ].join("\n");
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId(
        "body",
        partContent.indexOf("![first][img]"),
        imageSrc
      ),
      getDropImageGalleryItemId(
        "body",
        partContent.indexOf("![second][img]"),
        imageSrc
      ),
    ]);
  });

  it("includes shortcut reference images", () => {
    const imageSrc = "https://cdn.example.com/shortcut.jpg";
    const partContent = ["![Shortcut]", "", `[Shortcut]: ${imageSrc}`].join(
      "\n"
    );
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId(
        "body",
        partContent.indexOf("![Shortcut]"),
        imageSrc
      ),
    ]);
  });

  it("includes bare direct image reference links", () => {
    const imageSrc = "https://cdn.example.com/reference-link.jpg";
    const partContent = [`[${imageSrc}][img]`, "", `[img]: ${imageSrc}`].join(
      "\n"
    );
    const items = buildDropImageGalleryItems({
      partContent,
      partMedias: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId("body", 0, imageSrc),
    ]);
  });

  it("excludes named reference links to direct images", () => {
    const imageSrc = "https://cdn.example.com/reference-link.jpg";
    const items = buildDropImageGalleryItems({
      partContent: ["[open image][img]", "", `[img]: ${imageSrc}`].join("\n"),
      partMedias: [],
    });

    expect(items).toEqual([]);
  });

  it("prefixes body image ids when rendered markdown is split into blocks", () => {
    const items = buildDropImageGalleryItems({
      partContent: "![hidden](https://cdn.example.com/hidden.jpg)",
      bodyMarkdowns: [
        {
          content: "![summary](https://cdn.example.com/summary.jpg)",
          bodyGalleryKeyPrefix: "summary",
        },
        {
          content: "![section](https://cdn.example.com/section.jpg)",
          bodyGalleryKeyPrefix: "section:0",
        },
      ],
      partMedias: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      getDropImageGalleryItemId(
        "body",
        "summary:0",
        "https://cdn.example.com/summary.jpg"
      ),
      getDropImageGalleryItemId(
        "body",
        "section:0:0",
        "https://cdn.example.com/section.jpg"
      ),
    ]);
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
