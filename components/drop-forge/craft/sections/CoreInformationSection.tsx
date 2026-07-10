import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import {
  BTN_DANGER,
  BTN_SAVE,
  formatNullableEditionSize,
  getErrorMessage,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import { patchClaim } from "@/services/api/memes-minting-claims-api";

export default function CoreInformationSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
  onEditionSizeSaved,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
  onEditionSizeSaved: () => void;
}>) {
  const { setToast } = useAuth();
  const [editionSize, setEditionSize] = useState(
    formatNullableEditionSize(claim.edition_size)
  );
  const [season, setSeason] = useState(() => getClaimSeason(claim));
  const [coreSaving, setCoreSaving] = useState(false);
  const [coreError, setCoreError] = useState<string | null>(null);

  useEffect(() => {
    setEditionSize(formatNullableEditionSize(claim.edition_size));
    setSeason(getClaimSeason(claim));
    setCoreError(null);
  }, [claim.claim_id]);

  const currentEditionSize =
    claim.edition_size == null ? "" : String(claim.edition_size);
  const coreChanged =
    editionSize !== currentEditionSize || season !== getClaimSeason(claim);
  const editionSizeChanged = editionSize !== currentEditionSize;
  const seasonChanged = season !== getClaimSeason(claim);

  const editionSizeNum =
    editionSize !== "" && Number.isFinite(Number(editionSize))
      ? Number(editionSize)
      : null;
  const seasonNum =
    season !== "" && Number.isFinite(Number(season)) ? Number(season) : null;

  useEffect(() => {
    onPendingChange(coreChanged);
  }, [coreChanged, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  async function handleCoreSave(e: React.FormEvent) {
    e.preventDefault();
    setCoreError(null);
    if (
      editionSize !== "" &&
      (editionSizeNum == null ||
        !Number.isInteger(editionSizeNum) ||
        editionSizeNum <= 0)
    ) {
      setCoreError("Edition size must be a positive integer");
      return;
    }
    if (
      season !== "" &&
      (seasonNum == null || !Number.isInteger(seasonNum) || seasonNum <= 0)
    ) {
      setCoreError("Season must be a positive integer");
      return;
    }
    setCoreSaving(true);
    try {
      const body: MintingClaimUpdateRequest = {
        edition_size: editionSizeNum,
      };

      if (seasonChanged) {
        const withoutSeason = (claim.attributes ?? []).filter(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() !== "type - season"
        );
        body.attributes =
          seasonNum == null
            ? withoutSeason
            : [
                ...withoutSeason,
                {
                  trait_type: "Type - Season",
                  value: seasonNum,
                  display_type: "number",
                },
              ];
      }
      const nextClaim = await patchClaim(claimId, body);
      setEditionSize(formatNullableEditionSize(nextClaim.edition_size));
      setSeason(getClaimSeason(nextClaim));
      onUpdated(nextClaim);
      if (editionSizeChanged) {
        onEditionSizeSaved();
      }
      setToast({ message: "Core information saved.", type: "success" });
    } catch (e) {
      const msg = getErrorMessage(e, "Update failed");
      setCoreError(msg);
      setToast({
        type: "error",
        title: "Couldn't save core information.",
        description: "Please try again.",
        details: msg,
      });
    } finally {
      setCoreSaving(false);
    }
  }

  return (
    <form onSubmit={handleCoreSave} className="tw-flex tw-flex-col tw-gap-2">
      <div className="tailwind-scope tw-grid tw-grid-cols-2 tw-gap-6">
        <div className="tw-group tw-relative tw-min-w-0 tw-pb-8">
          <div className="tw-relative">
            <label
              htmlFor="metadata-season"
              className="group-focus-visible-within:tw-text-primary-400 tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all"
            >
              Season
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                id="metadata-season"
                type="number"
                min={1}
                step={1}
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Season"
                className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-font-normal tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>
        <div className="tw-group tw-relative tw-min-w-0 tw-pb-8">
          <div className="tw-relative">
            <label
              htmlFor="metadata-edition-size"
              className="group-focus-visible-within:tw-text-primary-400 tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all"
            >
              Edition size
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                id="metadata-edition-size"
                type="number"
                min={1}
                step={1}
                value={editionSize}
                onChange={(e) => setEditionSize(e.target.value)}
                className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>
      </div>
      {coreError && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
          {coreError}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        <button
          type="submit"
          disabled={coreSaving || !coreChanged}
          className={`${BTN_SAVE} tw-w-full`}
        >
          {coreSaving ? (
            <span className="tw-inline-flex tw-items-center tw-gap-2">
              <CircleLoader size={CircleLoaderSize.SMALL} />
              <span>Saving…</span>
            </span>
          ) : (
            "Save"
          )}
        </button>
        <button
          type="button"
          disabled={!coreChanged}
          onClick={() => {
            setEditionSize(formatNullableEditionSize(claim.edition_size));
            setSeason(getClaimSeason(claim));
            setCoreError(null);
          }}
          className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
        >
          Revert
        </button>
      </div>
    </form>
  );
}
