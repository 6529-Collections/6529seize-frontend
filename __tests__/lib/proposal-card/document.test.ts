import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildProposalCardDocument,
  getProposalCardLogoSvg,
} from "@/lib/proposal-card/document";
import { parseProposalFrameMetadata } from "@/lib/proposal-card/metadata";

const input = {
  mediaUrl: "https://example.com/art.png",
  mimeType: "image/png",
  title: "Original art",
  layout: "portrait" as const,
};

describe("proposal frame document", () => {
  it.each(["portrait", "landscape"] as const)(
    "preserves the original image in %s without cropping",
    (layout) => {
      const doc = new DOMParser().parseFromString(
        buildProposalCardDocument({ ...input, layout }),
        "text/html"
      );
      expect(doc.querySelector(".media img")?.getAttribute("src")).toBe(
        input.mediaUrl
      );
      expect(doc.querySelectorAll(".corner svg")).toHaveLength(4);
      expect(doc.querySelector("style")?.textContent).toContain(
        "object-fit:contain"
      );
      expect(doc.querySelector("[lang=fr]")?.textContent).toContain(
        "Ceci n’est pas une carte mème."
      );
    }
  );

  it("uses the real logo geometry", () => {
    const source = new DOMParser().parseFromString(
      readFileSync(resolve("public/6529-black.svg"), "utf8"),
      "image/svg+xml"
    );
    const actual = new DOMParser().parseFromString(
      getProposalCardLogoSvg(),
      "image/svg+xml"
    );
    for (const selector of ["polygon", "path"]) {
      const geometry = (doc: Document) =>
        Array.from(doc.querySelectorAll(selector), (element) =>
          element.getAttribute(selector === "path" ? "d" : "points")
        );
      expect(geometry(actual)).toEqual(geometry(source));
    }
  });

  it("escapes hostile titles and media query strings without adding elements or scripts", () => {
    const title =
      '</title><script>alert(1)</script><img src=x onerror="alert(1)">';
    const doc = new DOMParser().parseFromString(
      buildProposalCardDocument({
        ...input,
        title,
        mediaUrl: 'https://example.com/art?x="&y=<svg>',
      }),
      "text/html"
    );
    expect(doc.querySelector("title")?.textContent).toBe(
      `${title} — proposal card`
    );
    expect(doc.querySelector("img")?.getAttribute("alt")).toBe(title);
    expect(doc.querySelectorAll("script")).toHaveLength(1);
    expect(doc.querySelectorAll("img")).toHaveLength(1);
    expect(doc.querySelector("[onerror]")).toBeNull();
  });

  it("isolates embedded HTML and preserves native video controls", () => {
    const html = new DOMParser().parseFromString(
      buildProposalCardDocument({ ...input, mimeType: "text/html" }),
      "text/html"
    );
    expect(html.querySelector("iframe")?.getAttribute("sandbox")).toBe(
      "allow-scripts"
    );
    const video = new DOMParser().parseFromString(
      buildProposalCardDocument({ ...input, mimeType: "video/mp4" }),
      "text/html"
    );
    expect(video.querySelector("video")?.hasAttribute("controls")).toBe(true);
    expect(video.querySelector("video")?.hasAttribute("autoplay")).toBe(false);
  });

  it.each([
    "javascript:alert(1)",
    "http://example.com/art",
    "https://user:secret@example.com/art",
    "data:image/png;base64,AA==",
    "blob:https://example.com/id",
  ])("rejects unsafe published source %s", (mediaUrl) => {
    expect(() => buildProposalCardDocument({ ...input, mediaUrl })).toThrow();
  });

  it("allows browser-local images only for previews", () => {
    expect(
      buildProposalCardDocument(
        { ...input, mediaUrl: "blob:https://example.com/id" },
        { localPreview: true }
      )
    ).toContain("blob:https://example.com/id");
  });
});

describe("proposal frame resubmission metadata", () => {
  const metadata = {
    version: 1,
    layout: "portrait",
    media_url: input.mediaUrl,
    mime_type: "image/png",
    preview_image: "",
  };
  it("preserves the original source and orientation", () => {
    expect(parseProposalFrameMetadata(JSON.stringify(metadata))).toEqual(
      metadata
    );
  });
  it.each([
    { version: 2 },
    { layout: "square" },
    { media_url: "javascript:alert(1)" },
    { mime_type: "model/gltf-binary" },
    { preview_image: "javascript:alert(1)" },
  ])("ignores invalid frame metadata %j", (change) => {
    expect(
      parseProposalFrameMetadata(JSON.stringify({ ...metadata, ...change }))
    ).toBeNull();
  });
});
