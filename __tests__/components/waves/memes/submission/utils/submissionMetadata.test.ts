import {
  buildSubmissionMetadata,
  getSubmissionMetadataLengthValidation,
} from "@/components/waves/memes/submission/utils/submissionMetadata";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import type { OperationalData } from "@/components/waves/memes/submission/types/OperationalData";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

const buildTraits = (overrides: Partial<TraitsData>): TraitsData =>
  ({
    title: "",
    description: "",
    artist: "",
    ...overrides,
  }) as TraitsData;

describe("submissionMetadata", () => {
  const mockTraits: TraitsData = {
    title: "Test Artwork",
    description: "Test Description",
    artist: "Test Artist",
  };

  const mockOperationalData: OperationalData = {
    airdrop_config: [
      {
        id: "test-1",
        address: "0x1234567890123456789012345678901234567890",
        count: 15,
      },
      {
        id: "test-2",
        address: "0x0987654321098765432109876543210987654321",
        count: 5,
      },
    ],
    payment_info: {
      payment_address: "0x789",
      has_designated_payee: false,
      designated_payee_name: "",
    },
    allowlist_batches: [
      { id: "test-batch-1", contract: "0xabc", token_ids_raw: "1-5" },
    ],
    additional_media: {
      artist_profile_media: ["https://example.com/profile.jpg"],
      artwork_commentary_media: ["https://example.com/commentary.jpg"],
      preview_image: "",
      promo_video: "",
    },
    commentary: "Test Commentary",
    about_artist: "Test About Artist",
  };

  it("includes operational data in metadata when provided", () => {
    const metadata = buildSubmissionMetadata({
      traits: mockTraits,
      operationalData: mockOperationalData,
    });

    const metadataMap = new Map(
      metadata.map((item) => [item.data_key, item.data_value])
    );

    expect(metadataMap.get("title")).toBe("Test Artwork");
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)
    ).toBe(JSON.stringify(mockOperationalData.airdrop_config));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(
      JSON.stringify(mockOperationalData.payment_info)
    );
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)
    ).toBe(JSON.stringify([{ contract: "0xabc", token_ids: "1-5" }]));
    expect(
      metadataMap.get(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)
    ).toBe(JSON.stringify(mockOperationalData.additional_media));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe(
      "Test Commentary"
    );
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST)).toBe(
      "Test About Artist"
    );
  });

  it("does not include operational fields when not provided", () => {
    const metadata = buildSubmissionMetadata({
      traits: mockTraits,
    });

    const metadataMap = new Map(
      metadata.map((item) => [item.data_key, item.data_value])
    );

    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)
    ).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(
      false
    );
    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)
    ).toBe(false);
    expect(
      metadataMap.has(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)
    ).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe(
      false
    );
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST)).toBe(
      false
    );
  });

  it("uses key-specific metadata value limits", () => {
    const validation = getSubmissionMetadataLengthValidation({
      traits: buildTraits({
        title: "t".repeat(256),
        description: "d".repeat(8001),
        artist: "a".repeat(5001),
      }),
    });

    expect(validation.statusesByKey.title).toMatchObject({
      maxLength: 255,
      isError: true,
    });
    expect(validation.statusesByKey.description).toMatchObject({
      maxLength: 8000,
      isError: true,
    });
    expect(validation.statusesByKey.artist).toMatchObject({
      maxLength: 5000,
      isError: true,
    });
  });

  it("allows long descriptions without raising default metadata limit errors", () => {
    const validation = getSubmissionMetadataLengthValidation({
      traits: buildTraits({
        title: "t".repeat(255),
        description: "d".repeat(8000),
        artist: "a".repeat(5000),
      }),
    });

    expect(validation.hasErrors).toBe(false);
  });
});
