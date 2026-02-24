import { buildPreviewDrop } from "@/components/waves/memes/submission/utils/buildPreviewDrop";

describe("buildPreviewDrop", () => {
  it("sets placeholder score and voter count for preview cards", () => {
    const previewDrop = buildPreviewDrop({
      wave: {
        id: "wave-1",
        name: "Preview Wave",
        picture: null,
        description_drop: { id: "drop-description-1" },
        voting: {
          authenticated_user_eligible: true,
          period: { min: 1, max: 2 },
          credit_type: "NIC",
          forbid_negative_votes: false,
        },
        participation: { authenticated_user_eligible: true },
        chat: { authenticated_user_eligible: true },
        wave: { admin_drop_deletion_enabled: false },
        pinned: false,
      } as any,
      traits: {
        title: "Preview Title",
        description: "Preview Description",
      } as any,
      operationalData: undefined,
      mediaSelection: {
        mediaSource: "url",
        selectedFile: null,
        externalUrl: "https://example.com/art.png",
        externalMimeType: "image/png",
        isExternalValid: true,
      },
      uploadArtworkUrl: "",
      connectedProfile: null,
    });

    expect(previewDrop.rating).toBe(6529);
    expect(previewDrop.realtime_rating).toBe(6529420);
    expect(previewDrop.rating_prediction).toBe(69420);
    expect(previewDrop.raters_count).toBe(69);
  });
});
