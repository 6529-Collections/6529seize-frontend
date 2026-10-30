import {
  getStableDropKey,
  DropSize,
  convertApiDropToExtendedDrop,
  getDropPreviewImageUrl,
  getDropPromoVideoUrl,
} from "@/helpers/waves/drop.helpers";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://ipfs-gateway.test/ipfs/${url.slice(7)}`
      : url,
}));

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

  describe("stable full-drop hashes", () => {
    const stableHashCases = [
      {
        name: "ascii content",
        drop: { ...baseDrop, type: DropSize.FULL },
        hash: "c2cf570e70a3e4e746d2255fe0b29f84694822f83e6cf2a7d91143ad1a7b6841",
      },
      {
        name: "multi-byte content, reply and metadata",
        drop: {
          ...baseDrop,
          type: DropSize.FULL,
          reply_to: { drop_id: "r1", drop_part_id: 2 },
          parts: [{ content: "gm ünïcödé " }, { content: "\u{1F680}" }],
          metadata: [
            { data_key: "k1", data_value: "v1" },
            { data_key: "k2", data_value: "v2" },
          ],
        },
        hash: "4bb89b0abc60139b4f59687f1274b8fd79d4af81a9ddec5af0f208fe2492ccde",
      },
    ];

    it.each(stableHashCases)(
      "keeps the sha256 stable key and hash ($name)",
      ({ drop, hash }) => {
        const digest = Uint8Array.from(Buffer.from(hash, "hex"));

        expect(getStableDropKey(drop)).toEqual({
          key: new TextDecoder("utf-8").decode(digest),
          hash,
        });
      }
    );
  });

  it("converts api drop to extended drop", () => {
    const extended = convertApiDropToExtendedDrop(baseDrop);
    const again = convertApiDropToExtendedDrop(baseDrop);
    expect(extended.stableKey).toBe(again.stableKey);
    expect(extended.type).toBe(DropSize.FULL);
  });

  it("keeps identical anonymous submissions distinct using their entry-local author ids", () => {
    const first = {
      ...baseDrop,
      type: DropSize.FULL,
      author: { id: "anonymous-one", handle: "Anonymous", is_anonymous: true },
    };
    const second = {
      ...first,
      id: "d2",
      author: { ...first.author, id: "anonymous-two" },
    };
    expect(getStableDropKey(first).hash).not.toBe(
      getStableDropKey(second).hash
    );
    expect(getStableDropKey(second, [first])).toEqual(getStableDropKey(second));
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
      expect(result).toBe(`https://ipfs-gateway.test/ipfs/${ipfsHash}`);
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
      expect(result).toBe(`https://ipfs-gateway.test/ipfs/${ipfsHash}`);
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
