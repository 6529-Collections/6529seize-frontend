import { getPreviewItems } from "@/components/waves/drops/curation-preview/dropClassification";
import type { PreviewDrop } from "@/components/waves/drops/curation-preview/types";
import { getAnimatedImagePreviewUri } from "@/helpers/gif-preview.helpers";
import { ImageScale } from "@/helpers/image.helpers";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));

it("keeps adjacent Markdown image URLs separate in curation previews", () => {
  const png =
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_688421f0-dda9-4ba2-a3a5-b5def176560b/d3e42690-aa6f-437c-bbc9-de9e85e7729f/image.png";
  const gif =
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_688421f0-dda9-4ba2-a3a5-b5def176560b/9d46a9e8-73bd-40d8-a301-b99a64a6346d/glitchford-cow-met-open-access-small.gif";
  const drop: PreviewDrop = {
    id: "incident-drop",
    parts: [
      {
        content: `Met Open Access\n\n![Seize](${png})![Seize](${gif})`,
        media: [],
      },
    ],
  };

  const [item] = getPreviewItems([drop]);
  expect(item).toMatchObject({
    kind: "media",
    media: { sourceUrl: png, imageUrl: png },
    mediaCount: 2,
  });
  if (item?.kind !== "media" || item.media.imageUrl === null) {
    throw new Error("Expected image preview");
  }
  expect(
    getAnimatedImagePreviewUri(item.media.imageUrl, ImageScale.W_200_H_200)
  ).toBe(png.replace("/image.png", "/200x200/image.png"));
});

it("keeps a URL-only title available as a link preview", () => {
  const url = "https://example.com/story";
  const drop: PreviewDrop = {
    id: "title-link",
    title: `  ${url}  `,
    parts: [{ content: null, media: [] }],
  };

  expect(getPreviewItems([drop])[0]).toMatchObject({ kind: "link", url });
});
