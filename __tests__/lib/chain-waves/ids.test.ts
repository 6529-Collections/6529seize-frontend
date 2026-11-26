import { derivedId } from "@/lib/chain/codec/ids";
import {
  chainIdOf,
  isChainId,
  LegacyObjectKind,
  legacyObjectId,
} from "@/lib/chain-waves/ids";

const UUID = "6f1c2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";

describe("6529.io ids to chain ids", () => {
  it("derive an imported object's id from its UUID, as chain-tx does", () => {
    expect(legacyObjectId(UUID, LegacyObjectKind.ENTRY)).toBe(
      derivedId(
        `0x6f1c2c4e9a1b4c3d8e5f0a1b2c3d4e5f${"00".repeat(16)}`,
        0n,
        0x0603
      )
    );
    expect(legacyObjectId(UUID.replaceAll("-", "").toUpperCase(), 0x0603)).toBe(
      legacyObjectId(UUID, 0x0603)
    );
    expect(legacyObjectId(UUID, LegacyObjectKind.POLL)).not.toBe(
      legacyObjectId(UUID, LegacyObjectKind.ENTRY)
    );
  });

  it("keep a chain id as it is and refuse anything else", () => {
    const chainId = `0x${"AB".repeat(32)}`;
    expect(isChainId(chainId)).toBe(true);
    expect(chainIdOf(chainId, 0x0603)).toBe(chainId.toLowerCase());
    expect(chainIdOf("temp-1", 0x0603)).toBeNull();
    expect(() => legacyObjectId("not-a-uuid", 0x0603)).toThrow(RangeError);
  });
});
