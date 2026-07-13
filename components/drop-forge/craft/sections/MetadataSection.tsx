import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  claimToTraitsData,
  traitsDataToUpdateRequest,
} from "@/components/drop-forge/claimTraitsData";
import {
  BTN_DANGER,
  BTN_SAVE,
  getErrorMessage,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import ClaimTraitsEditor from "@/components/waves/memes/MemesArtSubmissionTraits";
import ArtworkDetails from "@/components/waves/memes/submission/details/ArtworkDetails";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import { patchClaim } from "@/services/api/memes-minting-claims-api";

export default function MetadataSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}>) {
  const { setToast } = useAuth();
  const initialTraits = useMemo(() => claimToTraitsData(claim), [claim]);
  const [traits, setTraits] = useState<TraitsData>(initialTraits);
  const [externalUrl, setExternalUrl] = useState(claim.external_url ?? "");
  const [traitsSaving, setTraitsSaving] = useState(false);
  const [traitsError, setTraitsError] = useState<string | null>(null);
  const [traitsFormKey, setTraitsFormKey] = useState(0);
  const traitsSaveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTraits(claimToTraitsData(claim));
    setExternalUrl(claim.external_url ?? "");
    setTraitsError(null);
    setTraitsFormKey((prev) => prev + 1);
  }, [claim.claim_id]);

  const normalizedExistingExternalUrl = (claim.external_url ?? "").trim();
  const normalizedNextExternalUrl = externalUrl.trim();
  const externalUrlChanged =
    normalizedNextExternalUrl !== normalizedExistingExternalUrl;

  const currentTraits = useMemo(() => claimToTraitsData(claim), [claim]);
  const draftMetadataBody = useMemo(() => {
    const body = traitsDataToUpdateRequest(traits, null, currentTraits);
    const currentAttributesSnapshot = JSON.stringify(
      traitsDataToUpdateRequest(currentTraits, null).attributes ?? []
    );
    const nextAttributesSnapshot = JSON.stringify(
      traitsDataToUpdateRequest(traits, null).attributes ?? []
    );
    if (currentAttributesSnapshot === nextAttributesSnapshot) {
      delete body.attributes;
    }
    if (externalUrlChanged) {
      body.external_url =
        normalizedNextExternalUrl === "" ? null : normalizedNextExternalUrl;
    }
    return body;
  }, [currentTraits, externalUrlChanged, normalizedNextExternalUrl, traits]);
  const metadataChanged = Object.keys(draftMetadataBody).length > 0;

  useEffect(() => {
    onPendingChange(metadataChanged);
  }, [metadataChanged, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  async function handleTraitsSave(e: React.FormEvent) {
    e.preventDefault();
    setTraitsError(null);
    const previouslyFocused =
      typeof document === "undefined" ? null : document.activeElement;
    setTraitsSaving(true);
    try {
      const body = {
        ...draftMetadataBody,
        ...(draftMetadataBody.attributes
          ? { attributes: [...draftMetadataBody.attributes] }
          : {}),
      };
      if (Object.keys(body).length === 0) {
        return;
      }
      if (body.attributes) {
        const existingSeasonAttribute = (claim.attributes ?? []).find(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() === "type - season"
        );
        const nextHasSeasonAttribute = body.attributes.some(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() === "type - season"
        );
        if (existingSeasonAttribute && !nextHasSeasonAttribute) {
          body.attributes = [...body.attributes, existingSeasonAttribute];
        }
      }
      const nextClaim = await patchClaim(
        claimId,
        body as MintingClaimUpdateRequest
      );
      setTraits(claimToTraitsData(nextClaim));
      setExternalUrl(nextClaim.external_url ?? "");
      onUpdated(nextClaim);
      setToast({ message: "Metadata updated.", type: "success" });
    } catch (e) {
      const msg = getErrorMessage(e, "Update failed");
      setTraitsError(msg);
      setToast({
        type: "error",
        title: "Couldn't save metadata.",
        description: "Please try again.",
        details: msg,
      });
    } finally {
      setTraitsSaving(false);
      if (
        traitsSaveButtonRef.current &&
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.tagName === "BUTTON"
      ) {
        requestAnimationFrame(() => traitsSaveButtonRef.current?.focus());
      }
    }
  }

  return (
    <form
      onSubmit={handleTraitsSave}
      noValidate
      className="tw-flex tw-flex-col tw-gap-4"
    >
      <ArtworkDetails
        title={traits.title}
        description={traits.description}
        onTitleChange={(title) => setTraits((prev) => ({ ...prev, title }))}
        onDescriptionChange={(description) =>
          setTraits((prev) => ({ ...prev, description }))
        }
      />

      <div className="tw-group tw-relative tw-mt-2">
        <div className="tw-relative">
          <label
            htmlFor="metadata-external-url"
            className="group-focus-visible-within:tw-text-primary-400 tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all"
          >
            External URL
          </label>
          <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
            <input
              id="metadata-external-url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650"
            />
          </div>
        </div>
      </div>

      <div className="tw-mt-6 tw-space-y-4">
        <h3 className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-100 sm:tw-mb-6 sm:tw-text-xl">
          Artwork Traits
        </h3>
        <ClaimTraitsEditor
          key={`metadata-traits-${traitsFormKey}`}
          traits={traits}
          setTraits={(partial) =>
            setTraits((prev) => ({ ...prev, ...partial }))
          }
          showTitle={false}
          readOnlyOverrides={{ seizeArtistProfile: false }}
        />
      </div>
      {traitsError && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
          {traitsError}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-pt-4">
        <button
          ref={traitsSaveButtonRef}
          type="submit"
          disabled={traitsSaving || !metadataChanged}
          className={`${BTN_SAVE} tw-w-full`}
        >
          {traitsSaving ? (
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
          disabled={!metadataChanged}
          onClick={() => {
            setTraits(claimToTraitsData(claim));
            setExternalUrl(claim.external_url ?? "");
            setTraitsError(null);
            setTraitsFormKey((prev) => prev + 1);
          }}
          className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
        >
          Revert
        </button>
      </div>
    </form>
  );
}
