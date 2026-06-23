import { buildMemesSubmissionDraftFromDrop } from "@/components/waves/memes/submission/utils/submissionDraft";

describe("buildMemesSubmissionDraftFromDrop", () => {
  it("clones metadata, operational data, and existing media from a drop", () => {
    const drop = {
      title: "Fallback Title",
      is_additional_action_promised: true,
      parts: [
        {
          content: "Fallback description",
          media: [
            {
              url: "https://example.com/art.png",
              mime_type: "image/png",
            },
          ],
        },
      ],
      metadata: [
        { data_key: "title", data_value: "Cloned Title" },
        { data_key: "description", data_value: "Cloned description" },
        { data_key: "artist", data_value: "alice" },
        { data_key: "punk6529", data_value: "true" },
        { data_key: "pointsPower", data_value: "42" },
        {
          data_key: "payment_info",
          data_value: JSON.stringify({
            payment_address: "0x123",
            has_designated_payee: true,
            designated_payee_name: "Bob",
          }),
        },
        {
          data_key: "airdrop_config",
          data_value: JSON.stringify([{ address: "0xabc", count: 20 }]),
        },
        {
          data_key: "allowlist_batches",
          data_value: JSON.stringify([
            { contract: "0xdef", token_ids: "1-3, 7" },
          ]),
        },
        {
          data_key: "additional_media",
          data_value: JSON.stringify({
            artist_profile_media: ["https://example.com/profile.png"],
            artwork_commentary_media: ["https://example.com/detail.png"],
            preview_image: "https://example.com/preview.png",
            promo_video: "https://example.com/promo.mp4",
          }),
        },
        { data_key: "commentary", data_value: "Commentary" },
        { data_key: "about_artist", data_value: "About Alice" },
      ],
    } as any;

    const draft = buildMemesSubmissionDraftFromDrop(drop);

    expect(draft.traits.title).toBe("Cloned Title");
    expect(draft.traits.description).toBe("Cloned description");
    expect(draft.traits.artist).toBe("alice");
    expect(draft.traits.punk6529).toBe(true);
    expect(draft.traits.pointsPower).toBe(42);
    expect(draft.operationalData.payment_info).toEqual({
      payment_address: "0x123",
      has_designated_payee: true,
      designated_payee_name: "Bob",
    });
    expect(draft.operationalData.airdrop_config).toEqual([
      { id: "airdrop-0", address: "0xabc", count: 20 },
    ]);
    expect(draft.operationalData.allowlist_batches).toEqual([
      { id: "allowlist-0", contract: "0xdef", token_ids_raw: "1-3, 7" },
    ]);
    expect(draft.operationalData.additional_media.preview_image).toBe(
      "https://example.com/preview.png"
    );
    expect(draft.operationalData.commentary).toBe("Commentary");
    expect(draft.operationalData.about_artist).toBe("About Alice");
    expect(draft.existingMedia).toEqual({
      url: "https://example.com/art.png",
      mimeType: "image/png",
    });
    expect(draft.isAdditionalActionPromised).toBe(true);
  });
});
