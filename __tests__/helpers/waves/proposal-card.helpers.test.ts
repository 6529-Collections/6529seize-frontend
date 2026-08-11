import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import { getProposalCardViewModel } from "@/helpers/waves/proposal-card.helpers";

const makeDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    title: null,
    parts_count: 1,
    parts: [
      {
        part_id: 1,
        content: null,
        media: [],
        attachments: [],
        quoted_drop: null,
      },
    ],
    nft_links: [],
    ...overrides,
  }) as any;

describe("getProposalCardViewModel", () => {
  it("uses the native title and removes only a matching authored heading", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        title: "A complete original proposal",
        parts: [
          {
            part_id: 1,
            content:
              "# A complete original proposal\n\nKeep this authored description exactly as proposal content.",
            media: [],
            attachments: [],
          },
        ],
      })
    );

    expect(result.title).toBe("A complete original proposal");
    expect(result.excerpt).toBe(
      "Keep this authored description exactly as proposal content."
    );
  });

  it("derives a missing title from the first authored line without inventing copy", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        parts: [
          {
            part_id: 1,
            content:
              "**Proposal: The Complaint Cards (not) by 6529**\n\nRecognize the collection as within the collecting scope.",
            media: [],
            attachments: [],
          },
        ],
      })
    );

    expect(result.title).toBe("Proposal: The Complaint Cards (not) by 6529");
    expect(result.excerpt).toBe(
      "Recognize the collection as within the collecting scope."
    );
  });

  it("removes authored HTML tags without changing their text", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        title: "Formatted proposal",
        parts: [
          {
            part_id: 1,
            content:
              "Keep <strong>this authored text</strong> and <em>its emphasis</em> intact.",
            media: [],
            attachments: [],
          },
        ],
      })
    );

    expect(result.excerpt).toBe(
      "Keep this authored text and its emphasis intact."
    );
  });

  it("keeps a very short proposal compact and does not fabricate an excerpt", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        parts: [
          {
            part_id: 1,
            content: "Approve the archive transfer.",
            media: [],
            attachments: [],
          },
        ],
      })
    );

    expect(result.title).toBe("Approve the archive transfer.");
    expect(result.excerpt).toBeNull();
  });

  it("truncates authored content at a word boundary", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        title: "Long proposal",
        parts: [
          {
            part_id: 1,
            content: Array.from(
              { length: 100 },
              (_, index) => `authored-${index}`
            ).join(" "),
            media: [],
            attachments: [],
          },
        ],
      })
    );

    expect(result.excerpt?.length).toBeGreaterThan(300);
    expect(result.excerpt?.length).toBeLessThanOrEqual(361);
    expect(result.excerpt).toMatch(/…$/);
  });

  it("uses the recipe excerpt limit", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        title: "Configurable proposal",
        parts: [
          {
            part_id: 1,
            content: Array.from({ length: 80 }, () => "proposal").join(" "),
            media: [],
            attachments: [],
          },
        ],
      }),
      {
        version: 1,
        layout: "summary",
        excerptMaxCharacters: 140,
        showMediaThumbnail: true,
      }
    );

    expect(result.excerpt?.length).toBeLessThanOrEqual(141);
    expect(result.excerpt).toMatch(/…$/);
  });

  it("reports only real multipart, media, and attachment counts", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        parts_count: 4,
        parts: [
          {
            part_id: 1,
            content: "Proposal title",
            media: [
              { url: "first.jpg", mime_type: "image/jpeg" },
              { url: "clip.mp4", mime_type: "video/mp4" },
            ],
            attachments: [{ name: "terms.pdf" }],
          },
          {
            part_id: 2,
            content: "Second part",
            media: [{ url: "second.png", mime_type: "image/png" }],
            attachments: [{ name: "one.txt" }, { name: "two.txt" }],
          },
        ],
      })
    );

    expect(result.partCount).toBe(4);
    expect(result.mediaCount).toBe(3);
    expect(result.attachmentCount).toBe(3);
  });

  it("selects one ready static upload and ignores failed or animated media", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        parts: [
          {
            part_id: 1,
            content: "Proposal title",
            media: [
              {
                url: "failed.jpg",
                mime_type: "image/jpeg",
                media_status: ApiDropMediaStatus.Failed,
              },
              {
                url: "animated.gif",
                mime_type: "image/gif",
                media_status: ApiDropMediaStatus.Ready,
              },
              {
                url: "ready.webp",
                mime_type: "image/webp",
                media_status: ApiDropMediaStatus.Ready,
              },
              {
                url: "unused.png",
                mime_type: "image/png",
              },
            ],
            attachments: [],
          },
        ],
      })
    );

    expect(result.previewImage).toEqual({
      url: "ready.webp",
    });
  });

  it("uses a ready NFT preview only when no static upload is available", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        nft_links: [
          {
            data: {
              media_preview: {
                status: ApiNftLinkMediaPreviewStatusEnum.Processing,
                small_url: "processing.jpg",
                mime_type: "image/jpeg",
              },
            },
          },
          {
            data: {
              media_preview: {
                status: ApiNftLinkMediaPreviewStatusEnum.Ready,
                small_url: "ready.jpg",
                mime_type: "image/jpeg",
              },
            },
          },
        ],
      })
    );

    expect(result.previewImage).toEqual({
      url: "ready.jpg",
    });
  });

  it("falls back to the first still NFT preview candidate", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        nft_links: [
          {
            data: {
              media_preview: {
                status: ApiNftLinkMediaPreviewStatusEnum.Ready,
                small_url: "animated.gif",
                thumb_url: "ready-thumb.jpg",
                card_url: "ready-card.jpg",
                mime_type: "image/jpeg",
              },
            },
          },
        ],
      })
    );

    expect(result.previewImage).toEqual({
      url: "ready-thumb.jpg",
    });
  });

  it("omits the preview when the recipe disables media thumbnails", () => {
    const result = getProposalCardViewModel(
      makeDrop({
        parts: [
          {
            part_id: 1,
            content: "Proposal title",
            media: [{ url: "ready.jpg", mime_type: "image/jpeg" }],
            attachments: [],
          },
        ],
      }),
      {
        version: 1,
        layout: "summary",
        excerptMaxCharacters: 360,
        showMediaThumbnail: false,
      }
    );

    expect(result.previewImage).toBeNull();
  });
});
