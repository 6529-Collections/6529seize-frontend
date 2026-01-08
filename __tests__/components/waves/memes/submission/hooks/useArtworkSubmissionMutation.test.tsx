import { transformToApiRequest } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation";
import { MemesSubmissionAdditionalInfoKey, OperationalData } from "@/components/waves/memes/submission/types/OperationalData";
import { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

describe("useArtworkSubmissionMutation - transformToApiRequest", () => {
  const mockTraits: TraitsData = {
    title: "Test Artwork",
    description: "Test Description",
    artist: "Test Artist",
  };

  const mockOperationalData: OperationalData = {
    airdrop_config: [
      { id: "test-1", address: "0x1234567890123456789012345678901234567890", count: 15 },
      { id: "test-2", address: "0x0987654321098765432109876543210987654321", count: 5 },
    ],
    payment_info: {
      payment_address: "0x789",
    },
    allowlist_batches: [
      { id: "test-batch-1", contract: "0xabc", token_ids_raw: "1-5" },
    ],
    additional_media: {
      artist_profile_media: ["https://example.com/profile.jpg"],
      artwork_commentary_media: ["https://example.com/commentary.jpg"],
    },
    commentary: "Test Commentary",
  };

  it("should include operational data in metadata when provided", () => {
    const result = transformToApiRequest({
      waveId: "wave-1",
      traits: mockTraits,
      operationalData: mockOperationalData,
      mediaUrl: "https://example.com/image.jpg",
      mimeType: "image/jpeg",
      signerAddress: "0xsigner",
      isSafeSignature: false,
    });

    const metadataMap = new Map(
      result.metadata.map((m) => [m.data_key, m.data_value])
    );

    // Check basic traits
    expect(metadataMap.get("title")).toBe("Test Artwork");

    // Check operational data
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)).toBe(JSON.stringify(mockOperationalData.airdrop_config));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(JSON.stringify(mockOperationalData.payment_info));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)).toBe(JSON.stringify([
      { contract: "0xabc", token_ids: "1-5" } // Stored as raw string
    ]));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)).toBe(JSON.stringify(mockOperationalData.additional_media));
    expect(metadataMap.get(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe("Test Commentary");
  });

  it("should not include operational fields if not provided", () => {
    const result = transformToApiRequest({
      waveId: "wave-1",
      traits: mockTraits,
      mediaUrl: "https://example.com/image.jpg",
      mimeType: "image/jpeg",
      signerAddress: "0xsigner",
      isSafeSignature: false,
    });

    const metadataMap = new Map(
      result.metadata.map((m) => [m.data_key, m.data_value])
    );

    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA)).toBe(false);
    expect(metadataMap.has(MemesSubmissionAdditionalInfoKey.COMMENTARY)).toBe(false);
  });
});