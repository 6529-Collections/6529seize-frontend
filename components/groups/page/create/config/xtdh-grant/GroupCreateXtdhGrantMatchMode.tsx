"use client";

import { useEffect, useId } from "react";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";

export const DEFAULT_BENEFICIARY_GRANT_MATCH_MODE =
  ApiGroupBeneficiaryGrantMatchMode.AnyToken;

const MATCH_MODE_OPTIONS = [
  {
    value: ApiGroupBeneficiaryGrantMatchMode.AnyToken,
    label: "Own any",
  },
  {
    value: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
    label: "Own all",
  },
] as const;

const supportsAllTokensGrantMatchMode = (
  grant: ApiXTdhGrant | null | undefined
): boolean => grant?.target_token_mode === ApiXTdhGrantTargetTokenMode.Include;

export const getGrantCompatibleMatchMode = (
  grant: ApiXTdhGrant | null | undefined,
  matchMode:
    | ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
    | undefined
): ApiGroupBeneficiaryGrantMatchMode => {
  const normalizedMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  if (!supportsAllTokensGrantMatchMode(grant)) {
    return DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  }
  return normalizedMode;
};

export const useCompatibleXtdhGrantMatchMode = ({
  grant,
  hasSelectedGrant,
  isLookupFresh,
  matchMode,
  setMatchMode,
}: {
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly hasSelectedGrant: boolean;
  readonly isLookupFresh: boolean;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
}): ApiGroupBeneficiaryGrantMatchMode => {
  const effectiveMatchMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;

  useEffect(() => {
    if (!hasSelectedGrant) {
      if (effectiveMatchMode !== DEFAULT_BENEFICIARY_GRANT_MATCH_MODE) {
        setMatchMode(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
      }
      return;
    }

    if (!isLookupFresh || !grant) {
      return;
    }

    const compatibleMode = getGrantCompatibleMatchMode(
      grant,
      effectiveMatchMode
    );
    if (compatibleMode !== effectiveMatchMode) {
      setMatchMode(compatibleMode);
    }
  }, [
    effectiveMatchMode,
    grant,
    hasSelectedGrant,
    isLookupFresh,
    setMatchMode,
  ]);

  return effectiveMatchMode;
};

export default function GroupCreateXtdhGrantMatchMode({
  grant,
  matchMode,
  setMatchMode,
  className,
  quiet = false,
}: {
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
  readonly className?: string | undefined;
  readonly quiet?: boolean;
}) {
  const normalizedMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  const tokenRequirementLabelId = useId();

  if (!grant) {
    return null;
  }

  if (!supportsAllTokensGrantMatchMode(grant)) {
    if (grant.target_token_mode !== ApiXTdhGrantTargetTokenMode.All) {
      return null;
    }

    return (
      <div
        className={`${quiet ? "" : "tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3"} ${
          className ?? ""
        }`.trim()}
      >
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400">
          Full-collection grants match holders of at least one collection token.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${quiet ? "tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2" : "tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3"} ${
        className ?? ""
      }`.trim()}
    >
      <span
        id={tokenRequirementLabelId}
        className={`tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-iron-500 ${quiet ? "tw-font-medium" : "tw-mb-2 tw-block tw-font-semibold"}`}
      >
        Token requirement
      </span>
      <div
        role="group"
        aria-labelledby={tokenRequirementLabelId}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {MATCH_MODE_OPTIONS.map((option) => {
          const isActive = normalizedMode === option.value;
          let optionClasses = isActive
            ? "tw-border-primary-400 tw-bg-primary-400/20 tw-text-primary-300"
            : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900";
          if (quiet) {
            optionClasses = isActive
              ? "tw-bg-white/10 tw-font-medium tw-text-iron-100"
              : "tw-bg-white/[0.03] tw-font-normal tw-text-iron-500 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-200";
          }
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setMatchMode(option.value)}
              className={
                quiet
                  ? `tw-min-h-8 tw-rounded-lg tw-border-0 tw-px-3 tw-py-1.5 tw-text-xxs tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${optionClasses}`
                  : `tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-outline-none tw-transition tw-duration-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${optionClasses}`
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
