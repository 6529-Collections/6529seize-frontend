import { transformToApiRequest } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation";
import { OperationalData } from "@/components/waves/memes/submission/types/OperationalData";
import { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

describe("useArtworkSubmissionMutation - transformToApiRequest", () => {
  const mockTraits: TraitsData = {
    title: "Test Artwork",
    description: "Test Description",
    artist: "Test Artist",
  };

  const mockOperationalData: OperationalData = {
    airdrop_info: {
      airdrop_artist_address: "0x123",
      airdrop_artist_count: 1,
      airdrop_choice_address: "0x456",
      airdrop_choice_count: 2,
    },
    payment_info: {
      payment_address: "0x789",
    },
    allowlist_batches: [
      { contract: "0xabc", token_ids_raw: "1-5" },
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
    expect(metadataMap.get("airdrop_info")).toBe(JSON.stringify(mockOperationalData.airdrop_info));
    expect(metadataMap.get("payment_info")).toBe(JSON.stringify(mockOperationalData.payment_info));
    expect(metadataMap.get("allowlist_batches")).toBe(JSON.stringify([
      { contract: "0xabc", token_ids: [1, 2, 3, 4, 5] } // Expect parsed token IDs
    ]));
    expect(metadataMap.get("additional_media")).toBe(JSON.stringify(mockOperationalData.additional_media));
    expect(metadataMap.get("commentary")).toBe("Test Commentary");
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

    expect(metadataMap.has("airdrop_info")).toBe(false);
    expect(metadataMap.has("payment_info")).toBe(false);
    expect(metadataMap.has("allowlist_batches")).toBe(false);
    expect(metadataMap.has("additional_media")).toBe(false);
    expect(metadataMap.has("commentary")).toBe(false);
  });
});