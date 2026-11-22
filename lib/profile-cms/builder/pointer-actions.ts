import {
  getProfileCmsPrimaryPackageHash,
  isProfileCmsPointerOnChainError,
  rollbackProfileCmsPackage,
  unpublishProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";
import { cmsCidFromHash } from "@/lib/profile-cms/chain/cms-cid";
import {
  moveProfileSitePointer,
  waitForProfileSitePrimary,
  type ProfileSiteMoveResult,
} from "@/lib/profile-cms/chain/move-site-pointer";

type RollbackGuard = {
  readonly expected_current_package_id: string | null;
  readonly expected_current_package_hash?: string | undefined;
};

/**
 * Makes an earlier published version the primary site. 6529.io moves the
 * pointer itself until profile sites follow the 6529 chain; then, once
 * 6529.io has checked the version as the chain index will, the person's
 * PROFILE_REPLACE names that version's signed publication. Returns "done"
 * when 6529.io serves the change, "pending" when it was submitted but isn't
 * shown yet; throws when it failed or 6529.io refuses the version.
 */
export async function makeProfileSitePrimary(
  record: ProfileCmsPackageRecord,
  guard: RollbackGuard
): Promise<"done" | "pending"> {
  try {
    await rollbackProfileCmsPackage(record.id, guard);
    return "done";
  } catch (error) {
    if (!isProfileCmsPointerOnChainError(error)) throw error;
    if (!record.publicationCid) {
      throw new Error("This version has no signed publication to point at.");
    }
    return outcome(
      await moveProfileSitePointer({
        pointer: {
          publication: record.publicationCid,
          package: cmsCidFromHash(record.packageHash),
        },
        confirm: () => confirmPrimary(record.profileHandle, record.packageHash),
      })
    );
  }
}

/**
 * Takes the profile site offline, on 6529.io or on the 6529 chain. Returns
 * as `makeProfileSitePrimary` does.
 */
export async function unpublishProfileSite(
  record: ProfileCmsPackageRecord
): Promise<"done" | "pending"> {
  try {
    await unpublishProfileCmsPackage(record.id, {
      expected_current_package_id: record.id,
      expected_current_package_hash: record.packageHash,
    });
    return "done";
  } catch (error) {
    if (!isProfileCmsPointerOnChainError(error)) throw error;
    return outcome(
      await moveProfileSitePointer({
        pointer: null,
        confirm: () => confirmPrimary(record.profileHandle, null),
      })
    );
  }
}

function confirmPrimary(
  handle: string,
  expectedPackageHash: string | null
): Promise<boolean> {
  return waitForProfileSitePrimary({
    expectedPackageHash,
    fetchPrimaryPackageHash: () => getProfileCmsPrimaryPackageHash(handle),
  });
}

/**
 * A pointer move on the 6529 chain that didn't go through. The message is
 * the profile tools' own words (or the builder's when this browser can't
 * sign), meant to be shown as it is.
 */
export class ProfileSiteMoveFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileSiteMoveFailed";
  }
}

function outcome(result: ProfileSiteMoveResult): "done" | "pending" {
  if (!result.ok) {
    throw new ProfileSiteMoveFailed(result.message);
  }
  return result.confirmed ? "done" : "pending";
}
