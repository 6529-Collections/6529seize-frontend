import {
  getStableDropKey,
  DropSize,
  convertApiDropToExtendedDrop,
  getDropPreviewImageUrl,
  getDropPromoVideoUrl,
} from "@/helpers/waves/drop.helpers";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";

const baseDrop: any = {
  id: "d1",
  serial_no: 1,
  wave: { id: "w1", voting_credit_type: "REP" },
  author: { handle: "alice" },
  parts: [{ content: "foo" }],
  metadata: [],
  created_at: 1,
  title: "t",
};

describe("drop.helpers", () => {
  it("returns id for light drops", () => {
    const key = getStableDropKey({ ...baseDrop, type: DropSize.LIGHT } as any);
    expect(key).toEqual({ key: "d1", hash: "d1" });
  });

  it("converts api drop to extended drop", () => {
    const extended = convertApiDropToExtendedDrop(baseDrop);
    const again = convertApiDropToExtendedDrop(baseDrop);
    expect(extended.stableKey).toBe(again.stableKey);
    expect(extended.type).toBe(DropSize.FULL);
  });

  describe("getDropPreviewImageUrl", () => {
    it("returns null when metadata is undefined", () => {
      expect(getDropPreviewImageUrl(undefined)).toBeNull();
    });

    it("returns null when metadata is empty", () => {
      expect(getDropPreviewImageUrl([])).toBeNull();
    });

    it("returns null when additional_media entry is missing", () => {
      const metadata = [{ data_key: "other_key", data_value: "value" }];
      expect(getDropPreviewImageUrl(metadata as any)).toBeNull();
    });

    it("returns null when preview_image is not in additional_media", () => {
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: JSON.stringify({ artist_profile_media: [] }),
        },
      ];
      expect(getDropPreviewImageUrl(metadata as any)).toBeNull();
    });

    it("returns parsed IPFS URL when preview_image exists", () => {
      const ipfsHash = "QmTest123";
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: JSON.stringify({ preview_image: `ipfs://${ipfsHash}` }),
        },
      ];
      const result = getDropPreviewImageUrl(metadata as any);
      expect(result).toContain(ipfsHash);
    });

    it("returns null when JSON parsing fails", () => {
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: "invalid json",
        },
      ];
      expect(getDropPreviewImageUrl(metadata as any)).toBeNull();
    });
  });

  describe("getDropPromoVideoUrl", () => {
    it("returns null when metadata is undefined", () => {
      expect(getDropPromoVideoUrl(undefined)).toBeNull();
    });

    it("returns null when metadata is empty", () => {
      expect(getDropPromoVideoUrl([])).toBeNull();
    });

    it("returns null when additional_media entry is missing", () => {
      const metadata = [{ data_key: "other_key", data_value: "value" }];
      expect(getDropPromoVideoUrl(metadata as any)).toBeNull();
    });

    it("returns null when promo_video is not in additional_media", () => {
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: JSON.stringify({ artist_profile_media: [] }),
        },
      ];
      expect(getDropPromoVideoUrl(metadata as any)).toBeNull();
    });

    it("returns parsed IPFS URL when promo_video exists", () => {
      const ipfsHash = "QmPromoVideo123";
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: JSON.stringify({ promo_video: `ipfs://${ipfsHash}` }),
        },
      ];
      const result = getDropPromoVideoUrl(metadata as any);
      expect(result).toContain(ipfsHash);
    });

    it("returns null when JSON parsing fails", () => {
      const metadata = [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: "invalid json",
        },
      ];
      expect(getDropPromoVideoUrl(metadata as any)).toBeNull();
    });
  });
});
