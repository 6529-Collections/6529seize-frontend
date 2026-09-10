import { bindCmsDraftIdentity } from "@/lib/profile-cms/builder/identity";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import { validateCmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

const owner = "0x0000000000000000000000000000000000000001";
describe("CMS draft identity binding", () => {
  it("adds the authenticated identity required to save a new homepage and recomputes its integrity", () => {
    const original = buildCmsPackageCandidate(
      createDefaultCmsBuilderState("punk6529")
    );
    const bound = bindCmsDraftIdentity(original, "profile-id", owner);
    expect(original.profile.primary_wallet).toBeUndefined();
    expect(bound.profile).toEqual({
      handle: "punk6529",
      profile_id: "profile-id",
      primary_wallet: owner,
    });
    expect(bound.payload).toEqual(original.payload);
    expect(bound.integrity.package_hash).not.toBe(
      original.integrity.package_hash
    );
    expect(
      validateCmsPackageV1(bound, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("keeps gallery source holdings independent and clears inherited signing artifacts on a new revision", () => {
    const original = buildCmsPackageCandidate({
      ...createDefaultCmsBuilderState("punk6529"),
      template: "wallet_gallery",
    });
    const imported = {
      ...original,
      profile: {
        ...original.profile,
        primary_wallet: "0x0000000000000000000000000000000000000002",
      },
      signatures: [
        {
          ...original.signatures[0]!,
          type: "eip712" as const,
          signer: "0x0000000000000000000000000000000000000002",
        },
      ],
    };
    const bound = bindCmsDraftIdentity(imported, "profile-id", owner);
    expect(bound.profile.primary_wallet).toBe(owner);
    expect(bound.payload.source_packets).toEqual(
      original.payload.source_packets
    );
    expect(bound.payload.nft_media_profiles).toEqual(
      original.payload.nft_media_profiles
    );
    expect(bound.signatures.map((signature) => signature.type)).toEqual([
      "fixture",
    ]);
    expect(
      bound.storage.every(
        (receipt) => receipt.provider === "fixture" && !receipt.canonical
      )
    ).toBe(true);
    expect(
      validateCmsPackageV1(bound, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      }).valid
    ).toBe(true);
  });

  it("rejects malformed identity wallets before sending a draft", () => {
    const original = buildCmsPackageCandidate(
      createDefaultCmsBuilderState("punk6529")
    );
    expect(() =>
      bindCmsDraftIdentity(original, "profile-id", "not-an-address")
    ).toThrow("invalid_profile_cms_identity_wallet");
  });
});
