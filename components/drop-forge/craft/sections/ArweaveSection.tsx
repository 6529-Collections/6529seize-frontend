import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeStorageLinkCard from "@/components/drop-forge/DropForgeStorageLinkCard";
import {
  BTN_PRIMARY,
  getErrorMessage,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import { postArweaveUpload } from "@/services/api/memes-minting-claims-api";

const ARWEAVE_LINK_GRID =
  "tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3";
const ARWEAVE_LINK_CARD =
  "tw-flex tw-flex-col tw-items-stretch tw-gap-2 tw-rounded-lg tw-bg-iron-900/60 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800";

function ArweaveLinkRow({
  label,
  cid,
}: Readonly<{ label: string; cid: string | null | undefined }>) {
  return (
    <DropForgeStorageLinkCard
      label={label}
      value={cid}
      cardClassName={ARWEAVE_LINK_CARD}
      labelClassName="tw-min-w-0 tw-text-base tw-text-iron-200"
    />
  );
}

export default function ArweaveSection({
  claimId,
  claim,
  onStatusRefresh,
  hasPendingChanges,
}: Readonly<{
  claimId: number;
  claim: MintingClaim;
  onStatusRefresh: () => Promise<void>;
  hasPendingChanges: boolean;
}>) {
  const { setToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primaryStatus = getClaimPrimaryStatus({ claim, isCraftContext: true });
  const isPublishing = primaryStatus.key === "publishing";
  const isDraft = primaryStatus.key === "draft";
  const canPublish = isDraft && !hasPendingChanges && !loading && !isPublishing;
  const hasPublishedMetadata = claim.metadata_location != null;

  useEffect(() => {
    if (!isPublishing) return;
    const id = setInterval(() => {
      onStatusRefresh().catch((e) => {
        const msg = getErrorMessage(e, "Failed to refresh claim status");
        setError(msg);
      });
    }, 10000);
    return () => clearInterval(id);
  }, [isPublishing, onStatusRefresh]);

  async function handleUpload() {
    if (!canPublish) return;
    setError(null);
    setLoading(true);
    try {
      await postArweaveUpload(claimId);
      setToast({ message: "Publishing to Arweave started.", type: "success" });
      await onStatusRefresh();
    } catch (e) {
      const msg = getErrorMessage(e, "Upload failed");
      setError(msg);
      if (msg !== "Already published" && msg !== "Not authorized") {
        setToast({
          type: "error",
          title: "Couldn't publish to Arweave.",
          description: "Please try again.",
          details: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {hasPublishedMetadata &&
        (claim.image_location ||
          claim.animation_location ||
          claim.metadata_location) && (
          <div className={`tw-my-4 ${ARWEAVE_LINK_GRID}`}>
            <ArweaveLinkRow label="Image" cid={claim.image_location} />
            <ArweaveLinkRow label="Animation" cid={claim.animation_location} />
            <ArweaveLinkRow label="Metadata" cid={claim.metadata_location} />
          </div>
        )}
      {(isDraft || isPublishing) && (
        <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-4">
          {isPublishing && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
              Publishing to Arweave…
            </p>
          )}
          {isDraft && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              Publish this claim&apos;s media and metadata to Arweave.
            </p>
          )}
          {hasPendingChanges && (
            <p className="tw-mb-0 tw-text-sm tw-text-yellow-400">
              Save or revert pending changes before publishing to Arweave.
            </p>
          )}
          {error && (
            <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
              {error}
            </p>
          )}
          {isDraft && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canPublish}
              className={`${BTN_PRIMARY} tw-w-fit`}
            >
              {loading ? (
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <CircleLoader size={CircleLoaderSize.SMALL} />
                  <span>Publishing…</span>
                </span>
              ) : (
                "Publish to Arweave"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
