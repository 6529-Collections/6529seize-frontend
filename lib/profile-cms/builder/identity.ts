import { getAddress, isAddress } from "viem";
import {
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

/** Bind a new immutable draft to its authenticated owner, not its gallery sources. */
export function bindCmsDraftIdentity(
  cmsPackage: CmsPackageV1,
  profileId: string,
  primaryWallet: string
): CmsPackageV1 {
  if (!isAddress(primaryWallet, { strict: false }))
    throw new Error("invalid_profile_cms_identity_wallet");
  const now = new Date().toISOString();
  return withComputedCmsHashes({
    ...cmsPackage,
    profile: {
      ...cmsPackage.profile,
      profile_id: profileId,
      primary_wallet: getAddress(primaryWallet.toLowerCase()),
    },
    signatures: [
      {
        type: "fixture",
        signer: `fixture:${cmsPackage.profile.handle}`,
        signature: "cms-draft-awaiting-wallet-signature",
        signed_at: now,
      },
    ],
    storage: [
      {
        provider: "fixture",
        uri: "ipfs://cms-draft-awaiting-upload",
        content_hash: cmsPackage.integrity.package_hash,
        canonical: false,
        recorded_at: now,
      },
    ],
  });
}
